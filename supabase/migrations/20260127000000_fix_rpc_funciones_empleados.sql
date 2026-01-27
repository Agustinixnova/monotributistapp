-- =====================================================
-- MIGRACIÓN: Arreglar funciones RPC para empleados
-- Fecha: 2026-01-27
-- Descripción:
--   - Eliminar versiones antiguas de funciones que recibían p_user_id
--   - Solo deben existir versiones que usan get_caja_owner_id() internamente
--   - Esto asegura que empleados vean la caja de su dueño correctamente
-- =====================================================

-- =====================================================
-- 1. ELIMINAR TODAS LAS VERSIONES DE FUNCIONES
-- =====================================================

-- Eliminar TODAS las versiones de caja_resumen_dia (diferentes firmas)
DROP FUNCTION IF EXISTS public.caja_resumen_dia(UUID, DATE);
DROP FUNCTION IF EXISTS public.caja_resumen_dia(DATE);

-- Eliminar TODAS las versiones de caja_totales_por_metodo (diferentes firmas)
DROP FUNCTION IF EXISTS public.caja_totales_por_metodo(UUID, DATE);
DROP FUNCTION IF EXISTS public.caja_totales_por_metodo(DATE);

-- =====================================================
-- 2. RECREAR FUNCIONES CORRECTAS (solo p_fecha, usan get_caja_owner_id)
-- =====================================================

-- Función: caja_resumen_dia (usa get_caja_owner_id internamente)
CREATE OR REPLACE FUNCTION public.caja_resumen_dia(p_fecha DATE DEFAULT CURRENT_DATE)
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
DECLARE
    v_owner_id UUID;
BEGIN
    -- Obtener el dueño de la caja (puede ser el usuario o su dueño si es empleado)
    v_owner_id := public.get_caja_owner_id();

    RETURN QUERY
    WITH movimientos_dia AS (
        SELECT
            m.tipo,
            m.monto_total
        FROM public.caja_movimientos m
        WHERE m.user_id = v_owner_id
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
        WHERE m.user_id = v_owner_id
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
        WHERE m.user_id = v_owner_id
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

COMMENT ON FUNCTION public.caja_resumen_dia(DATE) IS 'Resumen del día para el dueño de la caja (soporta empleados via get_caja_owner_id)';


-- Función: caja_totales_por_metodo (usa get_caja_owner_id internamente)
CREATE OR REPLACE FUNCTION public.caja_totales_por_metodo(p_fecha DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    metodo_id UUID,
    metodo_nombre VARCHAR(50),
    metodo_icono VARCHAR(50),
    es_efectivo BOOLEAN,
    total_entradas DECIMAL(12,2),
    total_salidas DECIMAL(12,2)
) AS $$
DECLARE
    v_owner_id UUID;
BEGIN
    v_owner_id := public.get_caja_owner_id();

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
        AND m.user_id = v_owner_id
    WHERE (mp.es_sistema = true OR mp.user_id = v_owner_id)
    AND mp.activo = true
    GROUP BY mp.id, mp.nombre, mp.icono, mp.es_efectivo, mp.orden
    ORDER BY mp.orden, mp.nombre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.caja_totales_por_metodo(DATE) IS 'Totales por método de pago para el dueño de la caja (soporta empleados via get_caja_owner_id)';


-- =====================================================
-- 3. GRANT PERMISOS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.caja_resumen_dia(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.caja_totales_por_metodo(DATE) TO authenticated;
