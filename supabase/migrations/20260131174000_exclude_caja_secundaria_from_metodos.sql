-- Excluir categorías de caja secundaria de los totales por método de pago
-- Para que el detalle del día no muestre las transferencias internas

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
    WITH movimientos_principal AS (
        -- Movimientos de caja principal (excluyendo transferencias internas)
        SELECT
            p.metodo_pago_id,
            CASE WHEN m.tipo = 'entrada' THEN p.monto ELSE 0 END as monto_entrada,
            CASE WHEN m.tipo = 'salida' THEN p.monto ELSE 0 END as monto_salida
        FROM public.caja_movimientos_pagos p
        INNER JOIN public.caja_movimientos m ON m.id = p.movimiento_id
        LEFT JOIN public.caja_categorias c ON m.categoria_id = c.id
        WHERE m.fecha = p_fecha
        AND m.anulado = false
        AND m.user_id = p_user_id
        -- Excluir movimientos internos entre cajas
        AND (c.nombre IS NULL OR (
            c.nombre NOT ILIKE 'a caja secundaria'
            AND c.nombre NOT ILIKE 'desde caja secundaria'
        ))
    ),
    gastos_secundaria AS (
        -- Gastos de caja secundaria (siempre efectivo)
        SELECT
            mp.id as metodo_pago_id,
            0::DECIMAL as monto_entrada,
            cs.monto as monto_salida
        FROM public.caja_secundaria_movimientos cs
        CROSS JOIN public.caja_metodos_pago mp
        WHERE cs.user_id = p_user_id
        AND cs.fecha = p_fecha
        AND cs.tipo = 'salida'
        AND cs.origen = 'gasto'
        AND mp.es_efectivo = true
        AND (mp.es_sistema = true OR mp.user_id = p_user_id)
        AND mp.activo = true
        LIMIT 1  -- Solo un método efectivo
    ),
    todos_movimientos AS (
        SELECT * FROM movimientos_principal
        UNION ALL
        SELECT * FROM gastos_secundaria
    )
    SELECT
        mp.id as metodo_id,
        mp.nombre as metodo_nombre,
        mp.icono as metodo_icono,
        mp.es_efectivo,
        COALESCE(SUM(tm.monto_entrada), 0)::DECIMAL(12,2) as total_entradas,
        COALESCE(SUM(tm.monto_salida), 0)::DECIMAL(12,2) as total_salidas
    FROM public.caja_metodos_pago mp
    LEFT JOIN todos_movimientos tm ON tm.metodo_pago_id = mp.id
    WHERE (mp.es_sistema = true OR mp.user_id = p_user_id)
    AND mp.activo = true
    GROUP BY mp.id, mp.nombre, mp.icono, mp.es_efectivo, mp.orden
    ORDER BY mp.orden, mp.nombre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.caja_totales_por_metodo_v2(UUID, DATE) IS
'Totales por método de pago excluyendo transferencias internas entre cajas';

-- También actualizar la función de fallback
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
    -- Obtener el dueño de la caja
    v_owner_id := public.get_caja_owner_id();

    RETURN QUERY
    WITH movimientos_principal AS (
        -- Movimientos de caja principal (excluyendo transferencias internas)
        SELECT
            p.metodo_pago_id,
            CASE WHEN m.tipo = 'entrada' THEN p.monto ELSE 0 END as monto_entrada,
            CASE WHEN m.tipo = 'salida' THEN p.monto ELSE 0 END as monto_salida
        FROM public.caja_movimientos_pagos p
        INNER JOIN public.caja_movimientos m ON m.id = p.movimiento_id
        LEFT JOIN public.caja_categorias c ON m.categoria_id = c.id
        WHERE m.fecha = p_fecha
        AND m.anulado = false
        AND m.user_id = v_owner_id
        -- Excluir movimientos internos entre cajas
        AND (c.nombre IS NULL OR (
            c.nombre NOT ILIKE 'a caja secundaria'
            AND c.nombre NOT ILIKE 'desde caja secundaria'
        ))
    ),
    gastos_secundaria AS (
        -- Gastos de caja secundaria (siempre efectivo)
        SELECT
            mp.id as metodo_pago_id,
            0::DECIMAL as monto_entrada,
            cs.monto as monto_salida
        FROM public.caja_secundaria_movimientos cs
        CROSS JOIN public.caja_metodos_pago mp
        WHERE cs.user_id = v_owner_id
        AND cs.fecha = p_fecha
        AND cs.tipo = 'salida'
        AND cs.origen = 'gasto'
        AND mp.es_efectivo = true
        AND (mp.es_sistema = true OR mp.user_id = v_owner_id)
        AND mp.activo = true
        LIMIT 1  -- Solo un método efectivo
    ),
    todos_movimientos AS (
        SELECT * FROM movimientos_principal
        UNION ALL
        SELECT * FROM gastos_secundaria
    )
    SELECT
        mp.id as metodo_id,
        mp.nombre as metodo_nombre,
        mp.icono as metodo_icono,
        mp.es_efectivo,
        COALESCE(SUM(tm.monto_entrada), 0)::DECIMAL(12,2) as total_entradas,
        COALESCE(SUM(tm.monto_salida), 0)::DECIMAL(12,2) as total_salidas
    FROM public.caja_metodos_pago mp
    LEFT JOIN todos_movimientos tm ON tm.metodo_pago_id = mp.id
    WHERE (mp.es_sistema = true OR mp.user_id = v_owner_id)
    AND mp.activo = true
    GROUP BY mp.id, mp.nombre, mp.icono, mp.es_efectivo, mp.orden
    ORDER BY mp.orden, mp.nombre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.caja_totales_por_metodo(DATE) IS
'Totales por método de pago excluyendo transferencias internas entre cajas';
