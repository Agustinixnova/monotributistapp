-- =====================================================
-- Funciones RPC para Estadísticas de Caja Diaria
-- =====================================================

-- 1. Estadísticas generales del período
CREATE OR REPLACE FUNCTION public.caja_estadisticas_resumen(
  p_user_id UUID,
  p_fecha_desde DATE,
  p_fecha_hasta DATE
)
RETURNS TABLE (
  total_ingresos DECIMAL(12,2),
  total_egresos DECIMAL(12,2),
  balance DECIMAL(12,2),
  cantidad_operaciones INTEGER,
  ticket_promedio DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Obtener owner (puede ser el usuario directo o su empleador)
  SELECT COALESCE(
    (SELECT duenio_id FROM public.caja_empleados WHERE empleado_id = p_user_id AND activo = true),
    p_user_id
  ) INTO v_owner_id;

  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.monto_total ELSE 0 END), 0) AS total_ingresos,
    COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN m.monto_total ELSE 0 END), 0) AS total_egresos,
    COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.monto_total ELSE -m.monto_total END), 0) AS balance,
    COUNT(*)::INTEGER AS cantidad_operaciones,
    CASE
      WHEN COUNT(*) > 0 THEN
        COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.monto_total ELSE 0 END), 0) / COUNT(*)::DECIMAL
      ELSE 0
    END AS ticket_promedio
  FROM public.caja_movimientos m
  WHERE m.user_id = v_owner_id
    AND m.fecha BETWEEN p_fecha_desde AND p_fecha_hasta
    AND m.anulado = false;
END;
$$;

-- 2. Evolución diaria (ingresos y egresos por día)
CREATE OR REPLACE FUNCTION public.caja_estadisticas_evolucion_diaria(
  p_user_id UUID,
  p_fecha_desde DATE,
  p_fecha_hasta DATE
)
RETURNS TABLE (
  fecha DATE,
  ingresos DECIMAL(12,2),
  egresos DECIMAL(12,2),
  balance DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT COALESCE(
    (SELECT duenio_id FROM public.caja_empleados WHERE empleado_id = p_user_id AND activo = true),
    p_user_id
  ) INTO v_owner_id;

  RETURN QUERY
  SELECT
    m.fecha,
    COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.monto_total ELSE 0 END), 0) AS ingresos,
    COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN m.monto_total ELSE 0 END), 0) AS egresos,
    COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.monto_total ELSE -m.monto_total END), 0) AS balance
  FROM public.caja_movimientos m
  WHERE m.user_id = v_owner_id
    AND m.fecha BETWEEN p_fecha_desde AND p_fecha_hasta
    AND m.anulado = false
  GROUP BY m.fecha
  ORDER BY m.fecha ASC;
END;
$$;

-- 3. Distribución por categorías (solo ingresos o solo egresos)
CREATE OR REPLACE FUNCTION public.caja_estadisticas_categorias(
  p_user_id UUID,
  p_fecha_desde DATE,
  p_fecha_hasta DATE,
  p_tipo VARCHAR(10) -- 'entrada' o 'salida'
)
RETURNS TABLE (
  categoria_nombre VARCHAR(100),
  categoria_icono VARCHAR(50),
  total DECIMAL(12,2),
  cantidad INTEGER,
  porcentaje DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID;
  v_total_general DECIMAL(12,2);
BEGIN
  SELECT COALESCE(
    (SELECT duenio_id FROM public.caja_empleados WHERE empleado_id = p_user_id AND activo = true),
    p_user_id
  ) INTO v_owner_id;

  -- Calcular total general para porcentajes
  SELECT COALESCE(SUM(m.monto_total), 0)
  INTO v_total_general
  FROM public.caja_movimientos m
  WHERE m.user_id = v_owner_id
    AND m.fecha BETWEEN p_fecha_desde AND p_fecha_hasta
    AND m.tipo = p_tipo
    AND m.anulado = false;

  RETURN QUERY
  SELECT
    c.nombre AS categoria_nombre,
    c.icono AS categoria_icono,
    COALESCE(SUM(m.monto_total), 0) AS total,
    COUNT(*)::INTEGER AS cantidad,
    CASE
      WHEN v_total_general > 0 THEN (COALESCE(SUM(m.monto_total), 0) / v_total_general * 100)::DECIMAL(5,2)
      ELSE 0
    END AS porcentaje
  FROM public.caja_movimientos m
  JOIN public.caja_categorias c ON c.id = m.categoria_id
  WHERE m.user_id = v_owner_id
    AND m.fecha BETWEEN p_fecha_desde AND p_fecha_hasta
    AND m.tipo = p_tipo
    AND m.anulado = false
  GROUP BY c.id, c.nombre, c.icono
  ORDER BY total DESC;
END;
$$;

-- 4. Distribución por métodos de pago
CREATE OR REPLACE FUNCTION public.caja_estadisticas_metodos_pago(
  p_user_id UUID,
  p_fecha_desde DATE,
  p_fecha_hasta DATE
)
RETURNS TABLE (
  metodo_nombre VARCHAR(100),
  metodo_icono VARCHAR(50),
  total DECIMAL(12,2),
  cantidad INTEGER,
  porcentaje DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID;
  v_total_general DECIMAL(12,2);
BEGIN
  SELECT COALESCE(
    (SELECT duenio_id FROM public.caja_empleados WHERE empleado_id = p_user_id AND activo = true),
    p_user_id
  ) INTO v_owner_id;

  -- Total general de ingresos (solo contamos ingresos)
  SELECT COALESCE(SUM(mp.monto), 0)
  INTO v_total_general
  FROM public.caja_movimientos m
  JOIN public.caja_movimientos_pagos mp ON mp.movimiento_id = m.id
  WHERE m.user_id = v_owner_id
    AND m.fecha BETWEEN p_fecha_desde AND p_fecha_hasta
    AND m.tipo = 'entrada'
    AND m.anulado = false;

  RETURN QUERY
  SELECT
    metodo.nombre AS metodo_nombre,
    metodo.icono AS metodo_icono,
    COALESCE(SUM(mp.monto), 0) AS total,
    COUNT(DISTINCT m.id)::INTEGER AS cantidad,
    CASE
      WHEN v_total_general > 0 THEN (COALESCE(SUM(mp.monto), 0) / v_total_general * 100)::DECIMAL(5,2)
      ELSE 0
    END AS porcentaje
  FROM public.caja_movimientos m
  JOIN public.caja_movimientos_pagos mp ON mp.movimiento_id = m.id
  JOIN public.caja_metodos_pago metodo ON metodo.id = mp.metodo_pago_id
  WHERE m.user_id = v_owner_id
    AND m.fecha BETWEEN p_fecha_desde AND p_fecha_hasta
    AND m.tipo = 'entrada'
    AND m.anulado = false
  GROUP BY metodo.id, metodo.nombre, metodo.icono
  ORDER BY total DESC;
END;
$$;

-- 5. Distribución por días de la semana
CREATE OR REPLACE FUNCTION public.caja_estadisticas_dias_semana(
  p_user_id UUID,
  p_fecha_desde DATE,
  p_fecha_hasta DATE
)
RETURNS TABLE (
  dia_semana INTEGER, -- 0=Domingo, 1=Lunes, ..., 6=Sábado
  dia_nombre VARCHAR(10),
  ingresos DECIMAL(12,2),
  egresos DECIMAL(12,2),
  cantidad_operaciones INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT COALESCE(
    (SELECT duenio_id FROM public.caja_empleados WHERE empleado_id = p_user_id AND activo = true),
    p_user_id
  ) INTO v_owner_id;

  RETURN QUERY
  SELECT
    EXTRACT(DOW FROM m.fecha)::INTEGER AS dia_semana,
    CASE EXTRACT(DOW FROM m.fecha)
      WHEN 0 THEN 'Dom'
      WHEN 1 THEN 'Lun'
      WHEN 2 THEN 'Mar'
      WHEN 3 THEN 'Mié'
      WHEN 4 THEN 'Jue'
      WHEN 5 THEN 'Vie'
      WHEN 6 THEN 'Sáb'
    END AS dia_nombre,
    COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.monto_total ELSE 0 END), 0) AS ingresos,
    COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN m.monto_total ELSE 0 END), 0) AS egresos,
    COUNT(*)::INTEGER AS cantidad_operaciones
  FROM public.caja_movimientos m
  WHERE m.user_id = v_owner_id
    AND m.fecha BETWEEN p_fecha_desde AND p_fecha_hasta
    AND m.anulado = false
  GROUP BY EXTRACT(DOW FROM m.fecha)
  ORDER BY dia_semana;
END;
$$;

-- 6. Estadísticas de cuenta corriente
CREATE OR REPLACE FUNCTION public.caja_estadisticas_cuenta_corriente(
  p_user_id UUID,
  p_fecha_desde DATE,
  p_fecha_hasta DATE
)
RETURNS TABLE (
  nuevas_deudas DECIMAL(12,2),
  cobros_realizados DECIMAL(12,2),
  deuda_total_actual DECIMAL(12,2),
  clientes_con_deuda INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT COALESCE(
    (SELECT duenio_id FROM public.caja_empleados WHERE empleado_id = p_user_id AND activo = true),
    p_user_id
  ) INTO v_owner_id;

  RETURN QUERY
  SELECT
    -- Nuevas deudas en el período
    COALESCE(
      (SELECT SUM(f.monto)
       FROM public.caja_fiados f
       WHERE f.user_id = v_owner_id
         AND f.fecha BETWEEN p_fecha_desde AND p_fecha_hasta),
      0
    ) AS nuevas_deudas,
    -- Cobros realizados en el período
    COALESCE(
      (SELECT SUM(pf.monto)
       FROM public.caja_pagos_fiado pf
       WHERE pf.user_id = v_owner_id
         AND pf.fecha BETWEEN p_fecha_desde AND p_fecha_hasta),
      0
    ) AS cobros_realizados,
    -- Deuda total actual (no solo del período)
    COALESCE(
      (SELECT SUM(public.caja_cliente_deuda(c.id))
       FROM public.caja_clientes_fiado c
       WHERE c.user_id = v_owner_id
         AND c.activo = true
         AND public.caja_cliente_deuda(c.id) > 0),
      0
    ) AS deuda_total_actual,
    -- Cantidad de clientes con deuda
    COALESCE(
      (SELECT COUNT(*)
       FROM public.caja_clientes_fiado c
       WHERE c.user_id = v_owner_id
         AND c.activo = true
         AND public.caja_cliente_deuda(c.id) > 0),
      0
    )::INTEGER AS clientes_con_deuda;
END;
$$;

-- Comentarios
COMMENT ON FUNCTION public.caja_estadisticas_resumen IS 'Resumen general: ingresos, egresos, balance, cantidad operaciones';
COMMENT ON FUNCTION public.caja_estadisticas_evolucion_diaria IS 'Evolución de ingresos/egresos por día';
COMMENT ON FUNCTION public.caja_estadisticas_categorias IS 'Distribución por categorías (entrada o salida)';
COMMENT ON FUNCTION public.caja_estadisticas_metodos_pago IS 'Distribución por métodos de pago';
COMMENT ON FUNCTION public.caja_estadisticas_dias_semana IS 'Distribución por días de la semana';
COMMENT ON FUNCTION public.caja_estadisticas_cuenta_corriente IS 'Estadísticas de cuenta corriente';

-- Permisos
GRANT EXECUTE ON FUNCTION public.caja_estadisticas_resumen TO authenticated;
GRANT EXECUTE ON FUNCTION public.caja_estadisticas_evolucion_diaria TO authenticated;
GRANT EXECUTE ON FUNCTION public.caja_estadisticas_categorias TO authenticated;
GRANT EXECUTE ON FUNCTION public.caja_estadisticas_metodos_pago TO authenticated;
GRANT EXECUTE ON FUNCTION public.caja_estadisticas_dias_semana TO authenticated;
GRANT EXECUTE ON FUNCTION public.caja_estadisticas_cuenta_corriente TO authenticated;
