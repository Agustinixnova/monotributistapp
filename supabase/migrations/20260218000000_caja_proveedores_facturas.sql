-- ============================================
-- PROVEEDORES Y FACTURAS DE COMPRA
-- ============================================
-- Permite registrar proveedores y sus facturas de compra.
-- Opcionalmente, una factura puede generar un egreso en caja.
-- ============================================

-- ============================================
-- TABLA: caja_proveedores
-- Proveedores del negocio
-- ============================================
CREATE TABLE IF NOT EXISTS public.caja_proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razon_social VARCHAR(200) NOT NULL,
  cuit VARCHAR(13),                  -- XX-XXXXXXXX-X (opcional)
  telefono VARCHAR(50),
  email VARCHAR(150),
  direccion VARCHAR(300),
  comentario VARCHAR(500),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único: no duplicar razón social por usuario (solo activos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_caja_proveedores_unique
  ON public.caja_proveedores(user_id, razon_social) WHERE activo = true;

-- Índices
CREATE INDEX IF NOT EXISTS idx_caja_proveedores_user_id ON public.caja_proveedores(user_id);
CREATE INDEX IF NOT EXISTS idx_caja_proveedores_activo ON public.caja_proveedores(user_id, activo);
CREATE INDEX IF NOT EXISTS idx_caja_proveedores_cuit ON public.caja_proveedores(user_id, cuit) WHERE cuit IS NOT NULL;

-- ============================================
-- TABLA: caja_facturas_compra
-- Facturas de compra a proveedores
-- ============================================
CREATE TABLE IF NOT EXISTS public.caja_facturas_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proveedor_id UUID NOT NULL REFERENCES public.caja_proveedores(id),
  numero_factura VARCHAR(50),         -- Opcional
  fecha_factura DATE NOT NULL,
  fecha_carga DATE NOT NULL,          -- Fecha de carga en el sistema
  monto_sin_iva DECIMAL(12,2),        -- Opcional
  monto_total DECIMAL(12,2) NOT NULL CHECK (monto_total > 0),
  descripcion VARCHAR(500),
  movimiento_id UUID REFERENCES public.caja_movimientos(id),  -- NULL si no se vinculó a caja
  activo BOOLEAN DEFAULT true,
  created_by_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único: no duplicar numero_factura por proveedor (solo si no es null y activo)
CREATE UNIQUE INDEX IF NOT EXISTS idx_caja_facturas_compra_numero
  ON public.caja_facturas_compra(proveedor_id, numero_factura)
  WHERE numero_factura IS NOT NULL AND activo = true;

-- Índices
CREATE INDEX IF NOT EXISTS idx_caja_facturas_compra_user_id ON public.caja_facturas_compra(user_id);
CREATE INDEX IF NOT EXISTS idx_caja_facturas_compra_proveedor ON public.caja_facturas_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_caja_facturas_compra_fecha ON public.caja_facturas_compra(user_id, fecha_factura);
CREATE INDEX IF NOT EXISTS idx_caja_facturas_compra_movimiento ON public.caja_facturas_compra(movimiento_id) WHERE movimiento_id IS NOT NULL;

-- ============================================
-- FUNCIONES RPC
-- ============================================

-- Reporte de compras agrupado por proveedor
CREATE OR REPLACE FUNCTION public.caja_reporte_compras_por_proveedor(
  p_user_id UUID,
  p_fecha_desde DATE,
  p_fecha_hasta DATE
)
RETURNS TABLE (
  proveedor_id UUID,
  razon_social VARCHAR(200),
  cuit VARCHAR(13),
  cantidad BIGINT,
  total DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS proveedor_id,
    p.razon_social,
    p.cuit,
    COUNT(f.id) AS cantidad,
    COALESCE(SUM(f.monto_total), 0)::DECIMAL(12,2) AS total
  FROM public.caja_proveedores p
  INNER JOIN public.caja_facturas_compra f ON f.proveedor_id = p.id
  WHERE f.user_id = p_user_id
    AND f.fecha_factura BETWEEN p_fecha_desde AND p_fecha_hasta
    AND f.activo = true
  GROUP BY p.id, p.razon_social, p.cuit
  ORDER BY total DESC;
END;
$$;

-- Detalle de facturas de un proveedor en un período
CREATE OR REPLACE FUNCTION public.caja_detalle_facturas_proveedor(
  p_user_id UUID,
  p_proveedor_id UUID,
  p_fecha_desde DATE,
  p_fecha_hasta DATE
)
RETURNS TABLE (
  id UUID,
  numero_factura VARCHAR(50),
  fecha_factura DATE,
  monto_sin_iva DECIMAL(12,2),
  monto_total DECIMAL(12,2),
  descripcion VARCHAR(500),
  movimiento_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.numero_factura,
    f.fecha_factura,
    f.monto_sin_iva,
    f.monto_total,
    f.descripcion,
    f.movimiento_id,
    f.created_at
  FROM public.caja_facturas_compra f
  WHERE f.user_id = p_user_id
    AND f.proveedor_id = p_proveedor_id
    AND f.fecha_factura BETWEEN p_fecha_desde AND p_fecha_hasta
    AND f.activo = true
  ORDER BY f.fecha_factura DESC, f.created_at DESC;
END;
$$;

-- Registrar factura con egreso en caja (atómica)
CREATE OR REPLACE FUNCTION public.caja_registrar_factura_con_egreso(
  p_user_id UUID,
  p_proveedor_id UUID,
  p_numero_factura VARCHAR(50),
  p_fecha_factura DATE,
  p_fecha_carga DATE,
  p_monto_sin_iva DECIMAL(12,2),
  p_monto_total DECIMAL(12,2),
  p_descripcion VARCHAR(500),
  p_metodo_pago_id UUID,
  p_created_by_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_movimiento_id UUID;
  v_factura_id UUID;
  v_categoria_id UUID;
  v_fecha DATE;
  v_hora TIME;
BEGIN
  -- Obtener fecha y hora de Argentina
  v_fecha := (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::DATE;
  v_hora := (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::TIME;

  -- Obtener categoría "Pago proveedor"
  SELECT id INTO v_categoria_id
  FROM public.caja_categorias
  WHERE nombre = 'Pago proveedor'
    AND tipo = 'salida'
    AND (user_id IS NULL OR user_id = p_user_id)
  LIMIT 1;

  -- Si no existe, crear categoría de sistema
  IF v_categoria_id IS NULL THEN
    INSERT INTO public.caja_categorias (user_id, nombre, icono, tipo, es_sistema, orden, activo)
    VALUES (NULL, 'Pago proveedor', 'ShoppingBag', 'salida', true, 17, true)
    RETURNING id INTO v_categoria_id;
  END IF;

  -- 1. Crear movimiento de egreso en caja
  INSERT INTO public.caja_movimientos (
    user_id,
    created_by_id,
    tipo,
    categoria_id,
    descripcion,
    fecha,
    hora,
    monto_total,
    anulado
  )
  VALUES (
    p_user_id,
    p_created_by_id,
    'salida',
    v_categoria_id,
    COALESCE(p_descripcion, 'Factura de compra'),
    v_fecha,
    v_hora,
    p_monto_total,
    false
  )
  RETURNING id INTO v_movimiento_id;

  -- 2. Crear registro de pago del movimiento
  INSERT INTO public.caja_movimientos_pagos (movimiento_id, metodo_pago_id, monto)
  VALUES (v_movimiento_id, p_metodo_pago_id, p_monto_total);

  -- 3. Crear factura vinculada al movimiento
  INSERT INTO public.caja_facturas_compra (
    user_id,
    proveedor_id,
    numero_factura,
    fecha_factura,
    fecha_carga,
    monto_sin_iva,
    monto_total,
    descripcion,
    movimiento_id,
    created_by_id
  )
  VALUES (
    p_user_id,
    p_proveedor_id,
    NULLIF(TRIM(p_numero_factura), ''),
    p_fecha_factura,
    p_fecha_carga,
    p_monto_sin_iva,
    p_monto_total,
    p_descripcion,
    v_movimiento_id,
    p_created_by_id
  )
  RETURNING id INTO v_factura_id;

  RETURN v_factura_id;
END;
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Habilitar RLS
ALTER TABLE public.caja_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caja_facturas_compra ENABLE ROW LEVEL SECURITY;

-- Políticas para caja_proveedores
CREATE POLICY "caja_proveedores_select" ON public.caja_proveedores
  FOR SELECT USING (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

CREATE POLICY "caja_proveedores_insert" ON public.caja_proveedores
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

CREATE POLICY "caja_proveedores_update" ON public.caja_proveedores
  FOR UPDATE USING (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

CREATE POLICY "caja_proveedores_delete" ON public.caja_proveedores
  FOR DELETE USING (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

-- Políticas para caja_facturas_compra
CREATE POLICY "caja_facturas_compra_select" ON public.caja_facturas_compra
  FOR SELECT USING (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

CREATE POLICY "caja_facturas_compra_insert" ON public.caja_facturas_compra
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

CREATE POLICY "caja_facturas_compra_update" ON public.caja_facturas_compra
  FOR UPDATE USING (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

CREATE POLICY "caja_facturas_compra_delete" ON public.caja_facturas_compra
  FOR DELETE USING (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

-- ============================================
-- TRIGGERS para updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_caja_proveedores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_caja_proveedores_updated_at ON public.caja_proveedores;
CREATE TRIGGER trigger_update_caja_proveedores_updated_at
  BEFORE UPDATE ON public.caja_proveedores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_caja_proveedores_updated_at();

CREATE OR REPLACE FUNCTION public.update_caja_facturas_compra_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_caja_facturas_compra_updated_at ON public.caja_facturas_compra;
CREATE TRIGGER trigger_update_caja_facturas_compra_updated_at
  BEFORE UPDATE ON public.caja_facturas_compra
  FOR EACH ROW
  EXECUTE FUNCTION public.update_caja_facturas_compra_updated_at();

-- ============================================
-- SEED: Categoría de sistema para pago a proveedor
-- ============================================
INSERT INTO public.caja_categorias (user_id, nombre, icono, tipo, es_sistema, orden, activo)
VALUES (NULL, 'Pago proveedor', 'ShoppingBag', 'salida', true, 17, true)
ON CONFLICT DO NOTHING;
