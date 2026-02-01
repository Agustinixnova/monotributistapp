-- ============================================
-- CAJA SECUNDARIA PARA CAJA DIARIA
-- ============================================
-- Fecha: 2026-01-30
-- Descripción: Sistema de caja secundaria para guardar efectivo
--              separado de la caja principal del día
-- ============================================

-- TABLA: caja_secundaria_movimientos
-- Movimientos de entrada/salida de la caja secundaria
CREATE TABLE IF NOT EXISTS public.caja_secundaria_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
  categoria_id UUID REFERENCES public.caja_categorias(id), -- Solo para salidas (gastos)
  descripcion VARCHAR(200),
  origen VARCHAR(50) NOT NULL, -- 'transferencia', 'reintegro', 'gasto', 'arqueo'
  movimiento_principal_id UUID REFERENCES public.caja_movimientos(id), -- FK al movimiento en caja principal
  created_by_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by_id UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_caja_secundaria_user_fecha
  ON public.caja_secundaria_movimientos(user_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_caja_secundaria_user_tipo
  ON public.caja_secundaria_movimientos(user_id, tipo);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS tr_caja_secundaria_updated ON public.caja_secundaria_movimientos;
CREATE TRIGGER tr_caja_secundaria_updated
  BEFORE UPDATE ON public.caja_secundaria_movimientos
  FOR EACH ROW EXECUTE FUNCTION public.caja_set_updated_by();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.caja_secundaria_movimientos ENABLE ROW LEVEL SECURITY;

-- Select: usuarios ven sus propios movimientos
DROP POLICY IF EXISTS "caja_secundaria_select" ON public.caja_secundaria_movimientos;
CREATE POLICY "caja_secundaria_select" ON public.caja_secundaria_movimientos
  FOR SELECT USING (auth.uid() = user_id);

-- Insert: usuarios insertan sus propios movimientos
DROP POLICY IF EXISTS "caja_secundaria_insert" ON public.caja_secundaria_movimientos;
CREATE POLICY "caja_secundaria_insert" ON public.caja_secundaria_movimientos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update: usuarios actualizan sus propios movimientos
DROP POLICY IF EXISTS "caja_secundaria_update" ON public.caja_secundaria_movimientos;
CREATE POLICY "caja_secundaria_update" ON public.caja_secundaria_movimientos
  FOR UPDATE USING (auth.uid() = user_id);

-- Delete: usuarios eliminan sus propios movimientos
DROP POLICY IF EXISTS "caja_secundaria_delete" ON public.caja_secundaria_movimientos;
CREATE POLICY "caja_secundaria_delete" ON public.caja_secundaria_movimientos
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCIÓN: Obtener saldo de caja secundaria
-- ============================================
CREATE OR REPLACE FUNCTION public.caja_secundaria_saldo(p_user_id UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
  v_saldo DECIMAL(12,2);
BEGIN
  SELECT COALESCE(
    SUM(CASE WHEN tipo = 'entrada' THEN monto ELSE -monto END),
    0
  ) INTO v_saldo
  FROM public.caja_secundaria_movimientos
  WHERE user_id = p_user_id;

  RETURN v_saldo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CATEGORÍAS DE SISTEMA PARA CAJA PRINCIPAL
-- ============================================
-- Nota: Las categorías se crean automáticamente desde el código
-- cuando el usuario usa caja secundaria por primera vez.
-- No es necesario ejecutar nada manualmente.

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON TABLE public.caja_secundaria_movimientos IS
'Movimientos de la caja secundaria. Solo maneja efectivo. user_id actúa como tenant_id.';

COMMENT ON COLUMN public.caja_secundaria_movimientos.tipo IS
'entrada = dinero que entra (desde caja principal), salida = dinero que sale (gastos, reintegros)';

COMMENT ON COLUMN public.caja_secundaria_movimientos.origen IS
'transferencia = enviado desde caja principal, reintegro = devuelto a caja principal, gasto = pago de gasto, arqueo = desde arqueo de caja';

COMMENT ON COLUMN public.caja_secundaria_movimientos.movimiento_principal_id IS
'FK al movimiento correspondiente en caja_movimientos (para trazabilidad)';
