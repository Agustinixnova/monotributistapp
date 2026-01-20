-- Fix: La columna se llama 'descripcion', no 'detalle'

CREATE OR REPLACE FUNCTION public.caja_detalle_movimientos_categoria(
  p_user_id UUID,
  p_categoria_id UUID,
  p_tipo VARCHAR(10),
  p_fecha_desde DATE DEFAULT NULL,
  p_fecha_hasta DATE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  fecha DATE,
  hora TIME,
  detalle VARCHAR(200),
  monto DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Obtener el owner (puede ser el usuario directo o su empleador)
  SELECT COALESCE(
    (SELECT duenio_id FROM public.caja_empleados WHERE empleado_id = p_user_id AND activo = true),
    p_user_id
  ) INTO v_owner_id;

  RETURN QUERY
  SELECT
    m.id,
    m.fecha,
    m.hora,
    m.descripcion AS detalle,
    m.monto_total AS monto
  FROM public.caja_movimientos m
  WHERE m.user_id = v_owner_id
    AND m.categoria_id = p_categoria_id
    AND m.tipo = p_tipo
    AND m.anulado = false
    AND (p_fecha_desde IS NULL OR m.fecha >= p_fecha_desde)
    AND (p_fecha_hasta IS NULL OR m.fecha <= p_fecha_hasta)
  ORDER BY m.fecha DESC, m.hora DESC;
END;
$$;
