-- =====================================================
-- MIGRACIÓN: Funciones RPC que aceptan user_id como parámetro
-- Fecha: 2026-01-27
-- Descripción:
--   - Crear versiones de funciones que reciben p_user_id explícitamente
--   - Esto permite que JavaScript controle qué caja mostrar
--   - Soporta el selector de contexto (caja propia vs empleador)
-- =====================================================

-- =====================================================
-- 1. FUNCIÓN: caja_resumen_dia_v2 (con user_id explícito)
-- =====================================================

CREATE OR REPLACE FUNCTION public.caja_resumen_dia_v2(
    p_user_id UUID,
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_entradas DECIMAL(12,2),
    total_salidas DECIMAL(12,2),
    saldo DECIMAL(12,2),
    cantidad_movimientos INT,
    efectivo_entradas DECIMAL(12,2),
    efectivo_salidas DECIMAL(12,2),
    efectivo_saldo DECIMAL(12,2),
    digital_entradas DECIMAL(12,2),
    digital_salidas DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH movimientos_dia AS (
        SELECT
            m.tipo,
            m.monto_total
        FROM public.caja_movimientos m
        WHERE m.user_id = p_user_id
        AND m.fecha = p_fecha
        AND m.anulado = false
    ),
    totales AS (
        SELECT
            COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN monto_total ELSE 0 END), 0) as sum_entradas,
            COALESCE(SUM(CASE WHEN tipo = 'salida' THEN monto_total ELSE 0 END), 0) as sum_salidas,
            COUNT(*)::INT as cant
        FROM movimientos_dia
    ),
    efectivo AS (
        SELECT
            COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN p.monto ELSE 0 END), 0) as efe_entradas,
            COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN p.monto ELSE 0 END), 0) as efe_salidas
        FROM public.caja_movimientos m
        INNER JOIN public.caja_movimientos_pagos p ON p.movimiento_id = m.id
        INNER JOIN public.caja_metodos_pago mp ON mp.id = p.metodo_pago_id
        WHERE m.user_id = p_user_id
        AND m.fecha = p_fecha
        AND m.anulado = false
        AND mp.es_efectivo = true
    ),
    digital AS (
        SELECT
            COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN p.monto ELSE 0 END), 0) as dig_entradas,
            COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN p.monto ELSE 0 END), 0) as dig_salidas
        FROM public.caja_movimientos m
        INNER JOIN public.caja_movimientos_pagos p ON p.movimiento_id = m.id
        INNER JOIN public.caja_metodos_pago mp ON mp.id = p.metodo_pago_id
        WHERE m.user_id = p_user_id
        AND m.fecha = p_fecha
        AND m.anulado = false
        AND mp.es_efectivo = false
    )
    SELECT
        t.sum_entradas::DECIMAL(12,2),
        t.sum_salidas::DECIMAL(12,2),
        (t.sum_entradas - t.sum_salidas)::DECIMAL(12,2),
        t.cant,
        e.efe_entradas::DECIMAL(12,2),
        e.efe_salidas::DECIMAL(12,2),
        (e.efe_entradas - e.efe_salidas)::DECIMAL(12,2),
        d.dig_entradas::DECIMAL(12,2),
        d.dig_salidas::DECIMAL(12,2)
    FROM totales t, efectivo e, digital d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.caja_resumen_dia_v2(UUID, DATE) IS 'Resumen del día para un user_id específico (v2 - con parámetro explícito)';

GRANT EXECUTE ON FUNCTION public.caja_resumen_dia_v2(UUID, DATE) TO authenticated;


-- =====================================================
-- 2. FUNCIÓN: caja_totales_por_metodo_v2 (con user_id explícito)
-- =====================================================

CREATE OR REPLACE FUNCTION public.caja_totales_por_metodo_v2(
    p_user_id UUID,
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    metodo_id UUID,
    metodo_nombre VARCHAR(50),
    metodo_icono VARCHAR(50),
    es_efectivo BOOLEAN,
    total_entradas DECIMAL(12,2),
    total_salidas DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mp.id as metodo_id,
        mp.nombre as metodo_nombre,
        mp.icono as metodo_icono,
        mp.es_efectivo,
        COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN p.monto ELSE 0 END), 0)::DECIMAL(12,2) as total_entradas,
        COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN p.monto ELSE 0 END), 0)::DECIMAL(12,2) as total_salidas
    FROM public.caja_metodos_pago mp
    LEFT JOIN public.caja_movimientos_pagos p ON p.metodo_pago_id = mp.id
    LEFT JOIN public.caja_movimientos m ON m.id = p.movimiento_id
        AND m.fecha = p_fecha
        AND m.anulado = false
        AND m.user_id = p_user_id
    WHERE (mp.es_sistema = true OR mp.user_id = p_user_id)
    AND mp.activo = true
    GROUP BY mp.id, mp.nombre, mp.icono, mp.es_efectivo, mp.orden
    ORDER BY mp.orden, mp.nombre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.caja_totales_por_metodo_v2(UUID, DATE) IS 'Totales por método de pago para un user_id específico (v2 - con parámetro explícito)';

GRANT EXECUTE ON FUNCTION public.caja_totales_por_metodo_v2(UUID, DATE) TO authenticated;
