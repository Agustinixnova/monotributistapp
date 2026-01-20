-- =====================================================
-- Funciones RPC para reportes de cuenta corriente
-- =====================================================

-- 1. Reporte de Deudores (estado actual)
-- Retorna clientes con saldo != 0, incluyendo días de deuda y última actividad
CREATE OR REPLACE FUNCTION public.caja_reporte_deudores(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  nombre VARCHAR(100),
  apellido VARCHAR(100),
  telefono VARCHAR(50),
  limite_credito DECIMAL(12,2),
  saldo DECIMAL(12,2),
  dias_deuda INTEGER,
  ultima_actividad DATE,
  comentario VARCHAR(500)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.nombre,
    c.apellido,
    c.telefono,
    c.limite_credito,
    public.caja_cliente_deuda(c.id) AS saldo,
    -- Días de deuda: desde el fiado impago más antiguo hasta hoy
    CASE
      WHEN public.caja_cliente_deuda(c.id) > 0 THEN
        COALESCE(
          (SELECT EXTRACT(DAY FROM (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires') - MIN(f.fecha))::INTEGER
           FROM public.caja_fiados f
           WHERE f.cliente_id = c.id AND f.saldado = false),
          0
        )
      ELSE 0
    END AS dias_deuda,
    -- Última actividad: fecha más reciente entre fiados y pagos
    (
      SELECT MAX(fecha)::DATE
      FROM (
        SELECT fecha FROM public.caja_fiados WHERE cliente_id = c.id
        UNION ALL
        SELECT fecha FROM public.caja_pagos_fiado WHERE cliente_id = c.id
      ) actividades
    ) AS ultima_actividad,
    c.comentario
  FROM public.caja_clientes_fiado c
  WHERE c.user_id = p_user_id
    AND c.activo = true
    AND public.caja_cliente_deuda(c.id) != 0
  ORDER BY
    CASE WHEN public.caja_cliente_deuda(c.id) > 0 THEN 0 ELSE 1 END,
    ABS(public.caja_cliente_deuda(c.id)) DESC;
END;
$$;

-- 2. Reporte de Movimientos de Cuenta Corriente
-- Retorna historial de fiados y pagos, con filtro opcional de fechas y cliente
CREATE OR REPLACE FUNCTION public.caja_reporte_movimientos_cuenta(
  p_user_id UUID,
  p_fecha_desde DATE DEFAULT NULL,
  p_fecha_hasta DATE DEFAULT NULL,
  p_cliente_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  tipo VARCHAR(10),
  fecha DATE,
  hora TIME,
  cliente_id UUID,
  cliente_nombre TEXT,
  cliente_apellido VARCHAR(100),
  monto DECIMAL(12,2),
  descripcion VARCHAR(200),
  metodo_pago VARCHAR(100),
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Fiados
  SELECT
    f.id,
    'fiado'::VARCHAR(10) AS tipo,
    f.fecha,
    f.hora,
    f.cliente_id,
    c.nombre::TEXT AS cliente_nombre,
    c.apellido,
    f.monto,
    f.descripcion,
    NULL::VARCHAR(100) AS metodo_pago,
    f.created_at
  FROM public.caja_fiados f
  INNER JOIN public.caja_clientes_fiado c ON c.id = f.cliente_id
  WHERE f.user_id = p_user_id
    AND (p_fecha_desde IS NULL OR f.fecha >= p_fecha_desde)
    AND (p_fecha_hasta IS NULL OR f.fecha <= p_fecha_hasta)
    AND (p_cliente_id IS NULL OR f.cliente_id = p_cliente_id)

  UNION ALL

  -- Pagos
  SELECT
    p.id,
    'pago'::VARCHAR(10) AS tipo,
    p.fecha,
    p.hora,
    p.cliente_id,
    c.nombre::TEXT AS cliente_nombre,
    c.apellido,
    p.monto,
    p.nota AS descripcion,
    mp.nombre AS metodo_pago,
    p.created_at
  FROM public.caja_pagos_fiado p
  INNER JOIN public.caja_clientes_fiado c ON c.id = p.cliente_id
  LEFT JOIN public.caja_metodos_pago mp ON mp.id = p.metodo_pago_id
  WHERE p.user_id = p_user_id
    AND (p_fecha_desde IS NULL OR p.fecha >= p_fecha_desde)
    AND (p_fecha_hasta IS NULL OR p.fecha <= p_fecha_hasta)
    AND (p_cliente_id IS NULL OR p.cliente_id = p_cliente_id)

  ORDER BY fecha DESC, hora DESC, created_at DESC;
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.caja_reporte_deudores(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.caja_reporte_movimientos_cuenta(UUID, DATE, DATE, UUID) TO authenticated;
