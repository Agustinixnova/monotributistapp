-- =====================================================
-- FIX: Efectivo de caja principal DEBE incluir transferencias a/desde caja secundaria
-- Fecha: 2026-02-01
-- =====================================================

-- PROBLEMA:
-- Cuando se transfiere dinero de caja principal a caja secundaria,
-- el efectivo de caja principal no se actualiza porque la función RPC
-- excluía movimientos con categoría "caja secundaria" de TODO el cálculo.

-- SOLUCIÓN:
-- El efectivo físico (efectivo_entradas, efectivo_salidas) DEBE incluir estas transferencias
-- porque el dinero SALE físicamente de la caja principal.
-- Solo excluimos estas transferencias del "total general" (total_entradas, total_salidas)
-- para no afectar el resultado del negocio (son movimientos internos).

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
    WITH movimientos_principal AS (
        -- Movimientos de caja principal que NO sean transferencias internas (para totales generales)
        SELECT
            m.tipo,
            m.monto_total
        FROM public.caja_movimientos m
        LEFT JOIN public.caja_categorias c ON m.categoria_id = c.id
        WHERE m.user_id = p_user_id
        AND m.fecha = p_fecha
        AND m.anulado = false
        AND NOT (c.nombre ILIKE '%caja secundaria%')
    ),
    gastos_secundaria AS (
        -- Gastos reales desde caja secundaria (para incluir en totales)
        SELECT
            'salida'::TEXT as tipo,
            cs.monto as monto_total
        FROM public.caja_secundaria_movimientos cs
        WHERE cs.user_id = p_user_id
        AND cs.fecha = p_fecha
        AND cs.tipo = 'salida'
        AND cs.origen = 'gasto'
    ),
    todos_movimientos AS (
        SELECT * FROM movimientos_principal
        UNION ALL
        SELECT * FROM gastos_secundaria
    ),
    totales AS (
        SELECT
            COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN monto_total ELSE 0 END), 0) as sum_entradas,
            COALESCE(SUM(CASE WHEN tipo = 'salida' THEN monto_total ELSE 0 END), 0) as sum_salidas,
            COUNT(*)::INT as cant
        FROM todos_movimientos
    ),
    efectivo_principal AS (
        -- EFECTIVO: Incluye TODOS los movimientos en efectivo (incluyendo transferencias a/desde secundaria)
        -- Porque el dinero físico SÍ sale/entra de la caja principal
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
        -- NO excluimos transferencias a caja secundaria aquí
    ),
    digital AS (
        SELECT
            COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN p.monto ELSE 0 END), 0) as dig_entradas,
            COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN p.monto ELSE 0 END), 0) as dig_salidas
        FROM public.caja_movimientos m
        INNER JOIN public.caja_movimientos_pagos p ON p.movimiento_id = m.id
        INNER JOIN public.caja_metodos_pago mp ON mp.id = p.metodo_pago_id
        LEFT JOIN public.caja_categorias c ON m.categoria_id = c.id
        WHERE m.user_id = p_user_id
        AND m.fecha = p_fecha
        AND m.anulado = false
        AND mp.es_efectivo = false
        AND NOT (c.nombre ILIKE '%caja secundaria%')
    )
    SELECT
        t.sum_entradas,
        t.sum_salidas,
        t.sum_entradas - t.sum_salidas as saldo,
        t.cant,
        e.efe_entradas,
        e.efe_salidas,
        e.efe_entradas - e.efe_salidas,
        d.dig_entradas,
        d.dig_salidas
    FROM totales t, efectivo_principal e, digital d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.caja_resumen_dia_v2 IS
'Resumen del día: efectivo incluye transferencias a/desde caja secundaria (dinero físico), totales excluyen transferencias internas';


-- También actualizar la versión sin _v2
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
    v_owner_id := public.get_caja_owner_id();

    RETURN QUERY
    WITH movimientos_principal AS (
        SELECT
            m.tipo,
            m.monto_total
        FROM public.caja_movimientos m
        LEFT JOIN public.caja_categorias c ON m.categoria_id = c.id
        WHERE m.user_id = v_owner_id
        AND m.fecha = p_fecha
        AND m.anulado = false
        AND NOT (c.nombre ILIKE '%caja secundaria%')
    ),
    gastos_secundaria AS (
        SELECT
            'salida'::TEXT as tipo,
            cs.monto as monto_total
        FROM public.caja_secundaria_movimientos cs
        WHERE cs.user_id = v_owner_id
        AND cs.fecha = p_fecha
        AND cs.tipo = 'salida'
        AND cs.origen = 'gasto'
    ),
    todos_movimientos AS (
        SELECT * FROM movimientos_principal
        UNION ALL
        SELECT * FROM gastos_secundaria
    ),
    totales AS (
        SELECT
            COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN monto_total ELSE 0 END), 0) as sum_entradas,
            COALESCE(SUM(CASE WHEN tipo = 'salida' THEN monto_total ELSE 0 END), 0) as sum_salidas,
            COUNT(*)::INT as cant
        FROM todos_movimientos
    ),
    efectivo_principal AS (
        -- EFECTIVO: Incluye TODOS los movimientos en efectivo
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
        LEFT JOIN public.caja_categorias c ON m.categoria_id = c.id
        WHERE m.user_id = v_owner_id
        AND m.fecha = p_fecha
        AND m.anulado = false
        AND mp.es_efectivo = false
        AND NOT (c.nombre ILIKE '%caja secundaria%')
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
    FROM totales t, efectivo_principal e, digital d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.caja_resumen_dia(DATE) IS
'Resumen del día: efectivo incluye transferencias a/desde caja secundaria (dinero físico), totales excluyen transferencias internas';
