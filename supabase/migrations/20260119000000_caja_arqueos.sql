-- =====================================================
-- MÓDULO: ARQUEOS DE CAJA
-- Descripción: Permite hacer arqueos parciales durante el día
-- Fecha: 2026-01-19
-- =====================================================

-- =====================================================
-- TABLA: caja_arqueos
-- Arqueos de caja (pueden ser varios por día)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.caja_arqueos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora TIME NOT NULL DEFAULT LOCALTIME,

    -- Valores del arqueo
    efectivo_esperado DECIMAL(12,2) NOT NULL DEFAULT 0,
    efectivo_real DECIMAL(12,2) NOT NULL DEFAULT 0,
    diferencia DECIMAL(12,2) NOT NULL DEFAULT 0,

    -- Detalles
    motivo_diferencia VARCHAR(200),
    notas VARCHAR(500),

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caja_arqueos_user ON public.caja_arqueos(user_id);
CREATE INDEX IF NOT EXISTS idx_caja_arqueos_fecha ON public.caja_arqueos(fecha);
CREATE INDEX IF NOT EXISTS idx_caja_arqueos_user_fecha ON public.caja_arqueos(user_id, fecha);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.caja_arqueos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "caja_arqueos_select" ON public.caja_arqueos;
CREATE POLICY "caja_arqueos_select" ON public.caja_arqueos
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "caja_arqueos_insert" ON public.caja_arqueos;
CREATE POLICY "caja_arqueos_insert" ON public.caja_arqueos
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "caja_arqueos_update" ON public.caja_arqueos;
CREATE POLICY "caja_arqueos_update" ON public.caja_arqueos
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "caja_arqueos_delete" ON public.caja_arqueos;
CREATE POLICY "caja_arqueos_delete" ON public.caja_arqueos
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- FUNCIÓN: Calcular efectivo esperado actual
-- Calcula el efectivo que debería haber en caja en este momento
-- =====================================================

CREATE OR REPLACE FUNCTION public.caja_efectivo_esperado_actual(
    p_user_id UUID,
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL AS $$
DECLARE
    v_saldo_inicial DECIMAL;
    v_efectivo_entradas DECIMAL;
    v_efectivo_salidas DECIMAL;
BEGIN
    -- Obtener saldo inicial del día
    SELECT COALESCE(saldo_inicial, 0) INTO v_saldo_inicial
    FROM public.caja_cierres
    WHERE user_id = p_user_id AND fecha = p_fecha;

    -- Si no hay registro de cierre, buscar el efectivo_real del día anterior
    IF v_saldo_inicial IS NULL THEN
        SELECT COALESCE(efectivo_real, 0) INTO v_saldo_inicial
        FROM public.caja_cierres
        WHERE user_id = p_user_id
        AND fecha = p_fecha - INTERVAL '1 day'
        AND cerrado = true;

        v_saldo_inicial := COALESCE(v_saldo_inicial, 0);
    END IF;

    -- Obtener entradas en efectivo del día
    SELECT COALESCE(SUM(mp.monto), 0) INTO v_efectivo_entradas
    FROM public.caja_movimientos m
    JOIN public.caja_movimientos_pagos mp ON mp.movimiento_id = m.id
    JOIN public.caja_metodos_pago met ON met.id = mp.metodo_pago_id
    WHERE m.user_id = p_user_id
    AND m.fecha = p_fecha
    AND m.tipo = 'entrada'
    AND m.anulado = false
    AND met.es_efectivo = true;

    -- Obtener salidas en efectivo del día
    SELECT COALESCE(SUM(mp.monto), 0) INTO v_efectivo_salidas
    FROM public.caja_movimientos m
    JOIN public.caja_movimientos_pagos mp ON mp.movimiento_id = m.id
    JOIN public.caja_metodos_pago met ON met.id = mp.metodo_pago_id
    WHERE m.user_id = p_user_id
    AND m.fecha = p_fecha
    AND m.tipo = 'salida'
    AND m.anulado = false
    AND met.es_efectivo = true;

    RETURN v_saldo_inicial + v_efectivo_entradas - v_efectivo_salidas;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- FUNCIÓN: Obtener arqueos del día
-- =====================================================

CREATE OR REPLACE FUNCTION public.caja_arqueos_del_dia(
    p_user_id UUID,
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    id UUID,
    hora TIME,
    efectivo_esperado DECIMAL,
    efectivo_real DECIMAL,
    diferencia DECIMAL,
    motivo_diferencia VARCHAR,
    notas VARCHAR,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.hora,
        a.efectivo_esperado,
        a.efectivo_real,
        a.diferencia,
        a.motivo_diferencia,
        a.notas,
        a.created_at
    FROM public.caja_arqueos a
    WHERE a.user_id = p_user_id
    AND a.fecha = p_fecha
    ORDER BY a.hora DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
