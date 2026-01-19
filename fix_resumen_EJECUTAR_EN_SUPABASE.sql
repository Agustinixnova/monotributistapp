-- =============================================================================
-- EJECUTAR ESTE SQL EN LA CONSOLA DE SUPABASE (SQL Editor)
-- FIX: Función caja_resumen_dia que duplicaba totales
-- =============================================================================

-- Paso 1: Eliminar la función existente
DROP FUNCTION IF EXISTS public.caja_resumen_dia(UUID, DATE);

-- Paso 2: Crear la función corregida (sin JOINs para monto_total)
CREATE FUNCTION public.caja_resumen_dia(
    p_user_id UUID,
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_entradas DECIMAL,
    total_salidas DECIMAL,
    saldo DECIMAL,
    efectivo_entradas DECIMAL,
    efectivo_salidas DECIMAL,
    efectivo_saldo DECIMAL,
    digital_entradas DECIMAL,
    digital_salidas DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Totales generales (desde caja_movimientos directo, SIN joins)
        COALESCE((
            SELECT SUM(m.monto_total)
            FROM public.caja_movimientos m
            WHERE m.user_id = p_user_id
            AND m.fecha = p_fecha
            AND m.tipo = 'entrada'
            AND m.anulado = false
        ), 0)::DECIMAL as total_entradas,

        COALESCE((
            SELECT SUM(m.monto_total)
            FROM public.caja_movimientos m
            WHERE m.user_id = p_user_id
            AND m.fecha = p_fecha
            AND m.tipo = 'salida'
            AND m.anulado = false
        ), 0)::DECIMAL as total_salidas,

        COALESCE((
            SELECT SUM(CASE WHEN m.tipo = 'entrada' THEN m.monto_total ELSE -m.monto_total END)
            FROM public.caja_movimientos m
            WHERE m.user_id = p_user_id
            AND m.fecha = p_fecha
            AND m.anulado = false
        ), 0)::DECIMAL as saldo,

        -- Efectivo entradas (desde tabla de pagos)
        COALESCE((
            SELECT SUM(mp.monto)
            FROM public.caja_movimientos m
            JOIN public.caja_movimientos_pagos mp ON mp.movimiento_id = m.id
            JOIN public.caja_metodos_pago met ON met.id = mp.metodo_pago_id
            WHERE m.user_id = p_user_id
            AND m.fecha = p_fecha
            AND m.tipo = 'entrada'
            AND m.anulado = false
            AND met.es_efectivo = true
        ), 0)::DECIMAL as efectivo_entradas,

        -- Efectivo salidas (desde tabla de pagos)
        COALESCE((
            SELECT SUM(mp.monto)
            FROM public.caja_movimientos m
            JOIN public.caja_movimientos_pagos mp ON mp.movimiento_id = m.id
            JOIN public.caja_metodos_pago met ON met.id = mp.metodo_pago_id
            WHERE m.user_id = p_user_id
            AND m.fecha = p_fecha
            AND m.tipo = 'salida'
            AND m.anulado = false
            AND met.es_efectivo = true
        ), 0)::DECIMAL as efectivo_salidas,

        -- Efectivo saldo
        COALESCE((
            SELECT SUM(CASE WHEN m.tipo = 'entrada' THEN mp.monto ELSE -mp.monto END)
            FROM public.caja_movimientos m
            JOIN public.caja_movimientos_pagos mp ON mp.movimiento_id = m.id
            JOIN public.caja_metodos_pago met ON met.id = mp.metodo_pago_id
            WHERE m.user_id = p_user_id
            AND m.fecha = p_fecha
            AND m.anulado = false
            AND met.es_efectivo = true
        ), 0)::DECIMAL as efectivo_saldo,

        -- Digital entradas (desde tabla de pagos)
        COALESCE((
            SELECT SUM(mp.monto)
            FROM public.caja_movimientos m
            JOIN public.caja_movimientos_pagos mp ON mp.movimiento_id = m.id
            JOIN public.caja_metodos_pago met ON met.id = mp.metodo_pago_id
            WHERE m.user_id = p_user_id
            AND m.fecha = p_fecha
            AND m.tipo = 'entrada'
            AND m.anulado = false
            AND met.es_efectivo = false
        ), 0)::DECIMAL as digital_entradas,

        -- Digital salidas (desde tabla de pagos)
        COALESCE((
            SELECT SUM(mp.monto)
            FROM public.caja_movimientos m
            JOIN public.caja_movimientos_pagos mp ON mp.movimiento_id = m.id
            JOIN public.caja_metodos_pago met ON met.id = mp.metodo_pago_id
            WHERE m.user_id = p_user_id
            AND m.fecha = p_fecha
            AND m.tipo = 'salida'
            AND m.anulado = false
            AND met.es_efectivo = false
        ), 0)::DECIMAL as digital_salidas;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verificar: Ejecuta esto para probar que la función funciona
-- SELECT * FROM caja_resumen_dia('TU_USER_ID_AQUI', '2026-01-18');
