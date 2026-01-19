-- Función para obtener totales por método de pago en un período de fechas
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.caja_reporte_periodo(
    p_user_id UUID,
    p_fecha_desde DATE,
    p_fecha_hasta DATE
)
RETURNS TABLE (
    metodo_id UUID,
    metodo_nombre VARCHAR,
    metodo_icono VARCHAR,
    es_efectivo BOOLEAN,
    total_entradas DECIMAL,
    total_salidas DECIMAL,
    cantidad_entradas BIGINT,
    cantidad_salidas BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        met.id,
        met.nombre,
        met.icono,
        met.es_efectivo,
        COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN mp.monto END), 0)::DECIMAL as total_entradas,
        COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN mp.monto END), 0)::DECIMAL as total_salidas,
        COALESCE(COUNT(CASE WHEN m.tipo = 'entrada' THEN 1 END), 0)::BIGINT as cantidad_entradas,
        COALESCE(COUNT(CASE WHEN m.tipo = 'salida' THEN 1 END), 0)::BIGINT as cantidad_salidas
    FROM public.caja_metodos_pago met
    LEFT JOIN public.caja_movimientos_pagos mp ON mp.metodo_pago_id = met.id
    LEFT JOIN public.caja_movimientos m ON m.id = mp.movimiento_id
        AND m.user_id = p_user_id
        AND m.fecha >= p_fecha_desde
        AND m.fecha <= p_fecha_hasta
        AND m.anulado = false
    WHERE met.es_sistema = true OR met.user_id = p_user_id
    GROUP BY met.id, met.nombre, met.icono, met.es_efectivo, met.orden
    HAVING COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN mp.monto END), 0) > 0
        OR COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN mp.monto END), 0) > 0
    ORDER BY met.orden;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.caja_reporte_periodo(UUID, DATE, DATE) TO authenticated;
