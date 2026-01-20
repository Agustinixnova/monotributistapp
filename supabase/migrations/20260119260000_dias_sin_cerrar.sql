-- =============================================
-- Función para obtener días con movimientos sin cerrar
-- =============================================

CREATE OR REPLACE FUNCTION public.caja_dias_sin_cerrar(
  p_user_id UUID
)
RETURNS TABLE (
  fecha DATE,
  total_movimientos BIGINT,
  total_entradas NUMERIC,
  total_salidas NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fecha_hoy DATE;
BEGIN
  -- Obtener fecha de hoy en Argentina (UTC-3)
  v_fecha_hoy := (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::DATE;

  RETURN QUERY
  SELECT
    m.fecha,
    COUNT(*)::BIGINT as total_movimientos,
    COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.monto_total ELSE 0 END), 0) as total_entradas,
    COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN m.monto_total ELSE 0 END), 0) as total_salidas
  FROM caja_movimientos m
  WHERE m.user_id = p_user_id
    AND m.anulado = false
    AND m.fecha < v_fecha_hoy  -- Solo días anteriores a hoy
    AND NOT EXISTS (
      -- No existe cierre para ese día o no está marcado como cerrado
      SELECT 1
      FROM caja_cierres c
      WHERE c.user_id = p_user_id
        AND c.fecha = m.fecha
        AND c.cerrado = true
    )
  GROUP BY m.fecha
  ORDER BY m.fecha DESC
  LIMIT 30;  -- Máximo 30 días para no sobrecargar
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.caja_dias_sin_cerrar(UUID) TO authenticated;

COMMENT ON FUNCTION public.caja_dias_sin_cerrar IS 'Obtiene días anteriores que tienen movimientos pero no fueron cerrados';
