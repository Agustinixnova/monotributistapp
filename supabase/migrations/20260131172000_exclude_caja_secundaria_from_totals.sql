-- Excluir categorías de caja secundaria del cálculo de totales del día
-- Los movimientos entre caja principal y secundaria son transferencias internas,
-- no ingresos/egresos reales del negocio

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
        LEFT JOIN public.caja_categorias c ON m.categoria_id = c.id
        WHERE m.user_id = p_user_id
        AND m.fecha = p_fecha
        AND m.anulado = false
        -- Excluir movimientos internos entre cajas
        AND (c.nombre IS NULL OR (
            c.nombre NOT ILIKE 'a caja secundaria'
            AND c.nombre NOT ILIKE 'desde caja secundaria'
        ))
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
        LEFT JOIN public.caja_categorias c ON m.categoria_id = c.id
        WHERE m.user_id = p_user_id
        AND m.fecha = p_fecha
        AND m.anulado = false
        AND mp.es_efectivo = true
        -- Excluir movimientos internos entre cajas
        AND (c.nombre IS NULL OR (
            c.nombre NOT ILIKE 'a caja secundaria'
            AND c.nombre NOT ILIKE 'desde caja secundaria'
        ))
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
        -- Excluir movimientos internos entre cajas
        AND (c.nombre IS NULL OR (
            c.nombre NOT ILIKE 'a caja secundaria'
            AND c.nombre NOT ILIKE 'desde caja secundaria'
        ))
    )
    SELECT
        t.sum_entradas,
        t.sum_salidas,
        t.sum_entradas - t.sum_salidas as saldo,
        t.cant,
        e.efe_entradas,
        e.efe_salidas,
        e.efe_entradas - e.efe_salidas as efe_saldo,
        d.dig_entradas,
        d.dig_salidas
    FROM totales t, efectivo e, digital d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.caja_resumen_dia_v2 IS
'Calcula el resumen del día excluyendo transferencias internas entre caja principal y secundaria';

-- También actualizar la función de fallback (sin _v2)
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
        LEFT JOIN public.caja_categorias c ON m.categoria_id = c.id
        WHERE m.user_id = v_owner_id
        AND m.fecha = p_fecha
        AND m.anulado = false
        -- Excluir movimientos internos entre cajas
        AND (c.nombre IS NULL OR (
            c.nombre NOT ILIKE 'a caja secundaria'
            AND c.nombre NOT ILIKE 'desde caja secundaria'
        ))
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
        LEFT JOIN public.caja_categorias c ON m.categoria_id = c.id
        WHERE m.user_id = v_owner_id
        AND m.fecha = p_fecha
        AND m.anulado = false
        AND mp.es_efectivo = true
        -- Excluir movimientos internos entre cajas
        AND (c.nombre IS NULL OR (
            c.nombre NOT ILIKE 'a caja secundaria'
            AND c.nombre NOT ILIKE 'desde caja secundaria'
        ))
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
        -- Excluir movimientos internos entre cajas
        AND (c.nombre IS NULL OR (
            c.nombre NOT ILIKE 'a caja secundaria'
            AND c.nombre NOT ILIKE 'desde caja secundaria'
        ))
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

COMMENT ON FUNCTION public.caja_resumen_dia(DATE) IS
'Resumen del día para el dueño de la caja, excluyendo transferencias internas entre cajas';
