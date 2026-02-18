-- ============================================
-- PROVEEDORES Y FACTURAS DE COMPRA
-- ============================================
-- Fecha: 2026-02-18
-- Descripción: Tablas para gestionar proveedores y
--              facturas de compra del negocio
-- ============================================

-- TABLA: caja_proveedores
-- Proveedores del negocio
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

-- TABLA: caja_facturas_compra
-- Facturas de compra a proveedores
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

-- ============================================
-- FUNCIONES RPC
-- ============================================

-- caja_reporte_compras_por_proveedor(p_user_id, p_fecha_desde, p_fecha_hasta):
--   Agrupa facturas por proveedor con totales
-- caja_detalle_facturas_proveedor(p_user_id, p_proveedor_id, p_fecha_desde, p_fecha_hasta):
--   Detalle de facturas de un proveedor en un período
-- caja_registrar_factura_con_egreso(...):
--   Atómica: crea factura + movimiento de egreso en caja

-- ============================================
-- FLUJO DE USO
-- ============================================

-- 1. REGISTRAR FACTURA (sin egreso):
--    - Usuario abre "Compras" desde CajaDiariaPage
--    - Selecciona o crea un proveedor
--    - Carga datos de la factura (fecha, monto, número opcional)
--    - Se guarda en caja_facturas_compra sin movimiento_id
--    - NO afecta la caja del día

-- 2. REGISTRAR FACTURA CON EGRESO:
--    - Mismo flujo, pero marca "Registrar como egreso en caja"
--    - Selecciona categoría de salida y método de pago
--    - Se usa la función RPC caja_registrar_factura_con_egreso
--    - Se crea la factura Y el movimiento de salida atómicamente
--    - SÍ afecta la caja del día

-- 3. REPORTE POR PROVEEDOR:
--    - Desde Reportes → "Compras por Proveedor"
--    - Selecciona período (hoy, semana, mes, año, personalizado)
--    - Ve totales agrupados por proveedor con barra de progreso
--    - Click en proveedor → detalle de facturas
--    - Exportar a PDF o Excel

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. Las facturas sin egreso NO aparecen en caja_movimientos
-- 2. Las facturas con egreso generan un movimiento de SALIDA en caja_movimientos
-- 3. Eliminar una factura vinculada NO elimina el movimiento de caja
-- 4. Los proveedores se desactivan (soft delete), no se eliminan físicamente
-- 5. El CUIT es opcional y se valida en frontend (warning, no bloquea)
