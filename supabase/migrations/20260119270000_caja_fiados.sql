-- ============================================
-- SISTEMA DE FIADOS PARA CAJA DIARIA
-- ============================================
-- Permite gestionar ventas a crédito (fiados) para clientes
-- - Los fiados NO afectan la caja del día (solo registran deuda)
-- - Las cobranzas SÍ afectan la caja (generan entrada)
-- ============================================

-- ============================================
-- TABLA: caja_clientes_fiado
-- Clientes que pueden comprar fiado
-- ============================================
CREATE TABLE IF NOT EXISTS public.caja_clientes_fiado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100),
  telefono VARCHAR(50),
  limite_credito DECIMAL(12,2) DEFAULT NULL,  -- NULL = sin límite
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único para evitar duplicados por usuario (nombre + apellido)
CREATE UNIQUE INDEX IF NOT EXISTS idx_caja_clientes_fiado_unique
  ON public.caja_clientes_fiado(user_id, nombre, COALESCE(apellido, ''));

-- Índices
CREATE INDEX IF NOT EXISTS idx_caja_clientes_fiado_user_id ON public.caja_clientes_fiado(user_id);
CREATE INDEX IF NOT EXISTS idx_caja_clientes_fiado_activo ON public.caja_clientes_fiado(user_id, activo);

-- ============================================
-- TABLA: caja_fiados
-- Ventas a crédito (deudas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.caja_fiados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.caja_clientes_fiado(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
  descripcion VARCHAR(200),
  saldado BOOLEAN DEFAULT false,  -- true cuando se pagó completamente
  created_by_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_caja_fiados_user_id ON public.caja_fiados(user_id);
CREATE INDEX IF NOT EXISTS idx_caja_fiados_cliente_id ON public.caja_fiados(cliente_id);
CREATE INDEX IF NOT EXISTS idx_caja_fiados_fecha ON public.caja_fiados(user_id, fecha);
CREATE INDEX IF NOT EXISTS idx_caja_fiados_pendientes ON public.caja_fiados(cliente_id, saldado) WHERE saldado = false;

-- ============================================
-- TABLA: caja_pagos_fiado
-- Cobranzas de deudas
-- ============================================
CREATE TABLE IF NOT EXISTS public.caja_pagos_fiado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.caja_clientes_fiado(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
  metodo_pago_id UUID NOT NULL REFERENCES public.caja_metodos_pago(id),
  movimiento_id UUID REFERENCES public.caja_movimientos(id),  -- FK al movimiento de entrada generado
  nota VARCHAR(200),
  created_by_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_caja_pagos_fiado_user_id ON public.caja_pagos_fiado(user_id);
CREATE INDEX IF NOT EXISTS idx_caja_pagos_fiado_cliente_id ON public.caja_pagos_fiado(cliente_id);
CREATE INDEX IF NOT EXISTS idx_caja_pagos_fiado_fecha ON public.caja_pagos_fiado(user_id, fecha);
CREATE INDEX IF NOT EXISTS idx_caja_pagos_fiado_movimiento ON public.caja_pagos_fiado(movimiento_id);

-- ============================================
-- FUNCIONES RPC
-- ============================================

-- Función para obtener deuda total de un cliente
CREATE OR REPLACE FUNCTION public.caja_cliente_deuda(p_cliente_id UUID)
RETURNS DECIMAL(12,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_fiados DECIMAL(12,2);
  v_total_pagos DECIMAL(12,2);
BEGIN
  -- Total de fiados
  SELECT COALESCE(SUM(monto), 0)
  INTO v_total_fiados
  FROM public.caja_fiados
  WHERE cliente_id = p_cliente_id
    AND saldado = false;

  -- Total de pagos (para fiados no saldados)
  SELECT COALESCE(SUM(pf.monto), 0)
  INTO v_total_pagos
  FROM public.caja_pagos_fiado pf
  WHERE pf.cliente_id = p_cliente_id;

  -- Retornar diferencia
  RETURN GREATEST(v_total_fiados - v_total_pagos, 0);
END;
$$;

-- Función para obtener clientes con deuda
CREATE OR REPLACE FUNCTION public.caja_clientes_con_deuda(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  nombre VARCHAR(100),
  apellido VARCHAR(100),
  telefono VARCHAR(50),
  limite_credito DECIMAL(12,2),
  deuda_total DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.nombre,
    c.apellido,
    c.telefono,
    c.limite_credito,
    public.caja_cliente_deuda(c.id) AS deuda_total
  FROM public.caja_clientes_fiado c
  WHERE c.user_id = p_user_id
    AND c.activo = true
    AND public.caja_cliente_deuda(c.id) > 0
  ORDER BY public.caja_cliente_deuda(c.id) DESC;
END;
$$;

-- Función para obtener historial de un cliente (fiados + pagos)
CREATE OR REPLACE FUNCTION public.caja_cliente_historial(p_cliente_id UUID)
RETURNS TABLE (
  id UUID,
  tipo VARCHAR(10),
  fecha DATE,
  hora TIME,
  monto DECIMAL(12,2),
  descripcion VARCHAR(200),
  metodo_pago VARCHAR(100),
  saldado BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Fiados
  SELECT
    f.id,
    'fiado'::VARCHAR(10) AS tipo,
    f.fecha,
    f.hora,
    f.monto,
    f.descripcion,
    NULL::VARCHAR(100) AS metodo_pago,
    f.saldado,
    f.created_at
  FROM public.caja_fiados f
  WHERE f.cliente_id = p_cliente_id

  UNION ALL

  -- Pagos
  SELECT
    p.id,
    'pago'::VARCHAR(10) AS tipo,
    p.fecha,
    p.hora,
    p.monto,
    p.nota AS descripcion,
    mp.nombre AS metodo_pago,
    NULL::BOOLEAN AS saldado,
    p.created_at
  FROM public.caja_pagos_fiado p
  LEFT JOIN public.caja_metodos_pago mp ON mp.id = p.metodo_pago_id
  WHERE p.cliente_id = p_cliente_id

  ORDER BY created_at DESC;
END;
$$;

-- Función para registrar pago y actualizar fiados saldados
CREATE OR REPLACE FUNCTION public.caja_registrar_pago_fiado(
  p_user_id UUID,
  p_cliente_id UUID,
  p_monto DECIMAL(12,2),
  p_metodo_pago_id UUID,
  p_fecha DATE,
  p_hora TIME,
  p_nota VARCHAR(200) DEFAULT NULL,
  p_created_by_id UUID DEFAULT NULL
)
RETURNS TABLE (
  pago_id UUID,
  movimiento_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pago_id UUID;
  v_movimiento_id UUID;
  v_categoria_id UUID;
  v_monto_restante DECIMAL(12,2);
  v_fiado RECORD;
BEGIN
  -- Obtener o crear categoría "Cobro de deuda"
  SELECT id INTO v_categoria_id
  FROM public.caja_categorias
  WHERE nombre = 'Cobro de deuda'
    AND (user_id IS NULL OR user_id = p_user_id)
  LIMIT 1;

  -- Si no existe, crear categoría de sistema
  IF v_categoria_id IS NULL THEN
    INSERT INTO public.caja_categorias (user_id, nombre, icono, tipo, es_sistema, orden, activo)
    VALUES (NULL, 'Cobro de deuda', 'HandCoins', 'entrada', true, 15, true)
    RETURNING id INTO v_categoria_id;
  END IF;

  -- 1. Crear movimiento de entrada en caja
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
    'entrada',
    v_categoria_id,
    COALESCE(p_nota, 'Cobro de deuda'),
    p_fecha,
    p_hora,
    p_monto,
    false
  )
  RETURNING id INTO v_movimiento_id;

  -- 2. Crear registro de pago en caja_movimientos_pagos
  INSERT INTO public.caja_movimientos_pagos (movimiento_id, metodo_pago_id, monto)
  VALUES (v_movimiento_id, p_metodo_pago_id, p_monto);

  -- 3. Registrar el pago de fiado
  INSERT INTO public.caja_pagos_fiado (
    user_id,
    cliente_id,
    fecha,
    hora,
    monto,
    metodo_pago_id,
    movimiento_id,
    nota,
    created_by_id
  )
  VALUES (
    p_user_id,
    p_cliente_id,
    p_fecha,
    p_hora,
    p_monto,
    p_metodo_pago_id,
    v_movimiento_id,
    p_nota,
    p_created_by_id
  )
  RETURNING id INTO v_pago_id;

  -- 4. Marcar fiados como saldados según corresponda (FIFO)
  v_monto_restante := p_monto;

  FOR v_fiado IN
    SELECT f.id, f.monto
    FROM public.caja_fiados f
    WHERE f.cliente_id = p_cliente_id
      AND f.saldado = false
    ORDER BY f.fecha ASC, f.hora ASC
  LOOP
    IF v_monto_restante >= v_fiado.monto THEN
      -- Saldar completamente este fiado
      UPDATE public.caja_fiados
      SET saldado = true
      WHERE id = v_fiado.id;

      v_monto_restante := v_monto_restante - v_fiado.monto;
    ELSE
      -- No alcanza para saldar más
      EXIT;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_pago_id, v_movimiento_id;
END;
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Habilitar RLS
ALTER TABLE public.caja_clientes_fiado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caja_fiados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caja_pagos_fiado ENABLE ROW LEVEL SECURITY;

-- Políticas para caja_clientes_fiado
CREATE POLICY "caja_clientes_fiado_select" ON public.caja_clientes_fiado
  FOR SELECT USING (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

CREATE POLICY "caja_clientes_fiado_insert" ON public.caja_clientes_fiado
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

CREATE POLICY "caja_clientes_fiado_update" ON public.caja_clientes_fiado
  FOR UPDATE USING (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

CREATE POLICY "caja_clientes_fiado_delete" ON public.caja_clientes_fiado
  FOR DELETE USING (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

-- Políticas para caja_fiados
CREATE POLICY "caja_fiados_select" ON public.caja_fiados
  FOR SELECT USING (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

CREATE POLICY "caja_fiados_insert" ON public.caja_fiados
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

CREATE POLICY "caja_fiados_update" ON public.caja_fiados
  FOR UPDATE USING (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

CREATE POLICY "caja_fiados_delete" ON public.caja_fiados
  FOR DELETE USING (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

-- Políticas para caja_pagos_fiado
CREATE POLICY "caja_pagos_fiado_select" ON public.caja_pagos_fiado
  FOR SELECT USING (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

CREATE POLICY "caja_pagos_fiado_insert" ON public.caja_pagos_fiado
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

CREATE POLICY "caja_pagos_fiado_update" ON public.caja_pagos_fiado
  FOR UPDATE USING (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

CREATE POLICY "caja_pagos_fiado_delete" ON public.caja_pagos_fiado
  FOR DELETE USING (
    user_id = auth.uid()
    OR user_id = public.get_caja_owner_id()
  );

-- ============================================
-- TRIGGER para updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_caja_clientes_fiado_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_caja_clientes_fiado_updated_at ON public.caja_clientes_fiado;
CREATE TRIGGER trigger_update_caja_clientes_fiado_updated_at
  BEFORE UPDATE ON public.caja_clientes_fiado
  FOR EACH ROW
  EXECUTE FUNCTION public.update_caja_clientes_fiado_updated_at();

-- ============================================
-- SEED: Categorías de sistema para fiados
-- ============================================
-- Categoría para cobros de deuda (entrada)
INSERT INTO public.caja_categorias (user_id, nombre, icono, tipo, es_sistema, orden, activo)
VALUES (NULL, 'Cobro de deuda', 'HandCoins', 'entrada', true, 15, true)
ON CONFLICT DO NOTHING;

-- Categoría especial para registrar fiados (aparece en salidas pero no genera movimiento)
INSERT INTO public.caja_categorias (user_id, nombre, icono, tipo, es_sistema, orden, activo)
VALUES (NULL, 'Fiado', 'UserPlus', 'salida', true, 16, true)
ON CONFLICT DO NOTHING;
