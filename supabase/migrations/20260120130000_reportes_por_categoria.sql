-- Migración: Reportes por Categoría
-- Descripción: Funciones RPC para reportes de ingresos y egresos agrupados por categoría

-- ============================================
-- FUNCIÓN: Reporte de Ingresos por Categoría
-- ============================================
CREATE OR REPLACE FUNCTION public.caja_reporte_ingresos_por_categoria(
  p_user_id UUID,
  p_fecha_desde DATE DEFAULT NULL,
  p_fecha_hasta DATE DEFAULT NULL
)
RETURNS TABLE (
  categoria_id UUID,
  categoria_nombre VARCHAR(100),
  categoria_icono VARCHAR(50),
  cantidad INTEGER,
  total DECIMAL(12,2)
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
    c.id AS categoria_id,
    c.nombre AS categoria_nombre,
    c.icono AS categoria_icono,
    COUNT(m.id)::INTEGER AS cantidad,
    COALESCE(SUM(m.monto_total), 0)::DECIMAL(12,2) AS total
  FROM public.caja_categorias c
  LEFT JOIN public.caja_movimientos m ON m.categoria_id = c.id
    AND m.user_id = v_owner_id
    AND m.tipo = 'entrada'
    AND m.anulado = false
    AND (p_fecha_desde IS NULL OR m.fecha >= p_fecha_desde)
    AND (p_fecha_hasta IS NULL OR m.fecha <= p_fecha_hasta)
  WHERE (c.user_id = v_owner_id OR c.es_sistema = true)
    AND c.activo = true
    AND (c.tipo = 'entrada' OR c.tipo = 'ambos')
    -- Excluir categorías de sistema que no son ingresos reales de ventas
    AND c.nombre NOT IN ('Sobrante de caja', 'Ajuste de caja')
  GROUP BY c.id, c.nombre, c.icono
  HAVING COUNT(m.id) > 0
  ORDER BY total DESC;
END;
$$;

-- ============================================
-- FUNCIÓN: Reporte de Egresos por Categoría
-- ============================================
CREATE OR REPLACE FUNCTION public.caja_reporte_egresos_por_categoria(
  p_user_id UUID,
  p_fecha_desde DATE DEFAULT NULL,
  p_fecha_hasta DATE DEFAULT NULL
)
RETURNS TABLE (
  categoria_id UUID,
  categoria_nombre VARCHAR(100),
  categoria_icono VARCHAR(50),
  cantidad INTEGER,
  total DECIMAL(12,2)
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
    c.id AS categoria_id,
    c.nombre AS categoria_nombre,
    c.icono AS categoria_icono,
    COUNT(m.id)::INTEGER AS cantidad,
    COALESCE(SUM(m.monto_total), 0)::DECIMAL(12,2) AS total
  FROM public.caja_categorias c
  LEFT JOIN public.caja_movimientos m ON m.categoria_id = c.id
    AND m.user_id = v_owner_id
    AND m.tipo = 'salida'
    AND m.anulado = false
    AND (p_fecha_desde IS NULL OR m.fecha >= p_fecha_desde)
    AND (p_fecha_hasta IS NULL OR m.fecha <= p_fecha_hasta)
  WHERE (c.user_id = v_owner_id OR c.es_sistema = true)
    AND c.activo = true
    AND (c.tipo = 'salida' OR c.tipo = 'ambos')
    -- Excluir categorías de sistema que no son egresos reales
    AND c.nombre NOT IN ('Faltante de caja', 'Ajuste de caja', 'Cuenta Corriente')
  GROUP BY c.id, c.nombre, c.icono
  HAVING COUNT(m.id) > 0
  ORDER BY total DESC;
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.caja_reporte_ingresos_por_categoria(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.caja_reporte_egresos_por_categoria(UUID, DATE, DATE) TO authenticated;

-- Comentarios
COMMENT ON FUNCTION public.caja_reporte_ingresos_por_categoria IS 'Reporte de ingresos agrupados por categoría con filtro de fechas';
COMMENT ON FUNCTION public.caja_reporte_egresos_por_categoria IS 'Reporte de egresos agrupados por categoría con filtro de fechas';
