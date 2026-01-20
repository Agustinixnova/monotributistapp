-- =====================================================
-- Fix: Corregir referencia a full_name en caja_cliente_historial
-- Descripción: La tabla profiles tiene nombre y apellido, no full_name
-- Fecha: 2026-01-20
-- =====================================================

-- Recrear función con columnas correctas
CREATE OR REPLACE FUNCTION public.caja_cliente_historial(p_cliente_id UUID)
RETURNS TABLE (
  id UUID,
  tipo VARCHAR(10),
  fecha DATE,
  hora TIME,
  monto DECIMAL(12,2),
  descripcion VARCHAR(200),
  metodo_pago VARCHAR(100),
  saldado BOOLEAN,
  created_at TIMESTAMPTZ,
  created_by_email VARCHAR(255),
  created_by_nombre VARCHAR(255)
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
    f.monto,
    f.descripcion,
    NULL::VARCHAR(100) AS metodo_pago,
    f.saldado,
    f.created_at,
    COALESCE(u.email, '')::VARCHAR(255) AS created_by_email,
    COALESCE(
      NULLIF(TRIM(COALESCE(p.nombre, '') || ' ' || COALESCE(p.apellido, '')), ''),
      u.email,
      'Usuario'
    )::VARCHAR(255) AS created_by_nombre
  FROM public.caja_fiados f
  LEFT JOIN auth.users u ON u.id = f.created_by_id
  LEFT JOIN public.profiles p ON p.id = f.created_by_id
  WHERE f.cliente_id = p_cliente_id

  UNION ALL

  -- Pagos
  SELECT
    pf.id,
    'pago'::VARCHAR(10) AS tipo,
    pf.fecha,
    pf.hora,
    pf.monto,
    pf.nota AS descripcion,
    mp.nombre AS metodo_pago,
    NULL::BOOLEAN AS saldado,
    pf.created_at,
    COALESCE(u2.email, '')::VARCHAR(255) AS created_by_email,
    COALESCE(
      NULLIF(TRIM(COALESCE(p2.nombre, '') || ' ' || COALESCE(p2.apellido, '')), ''),
      u2.email,
      'Usuario'
    )::VARCHAR(255) AS created_by_nombre
  FROM public.caja_pagos_fiado pf
  LEFT JOIN public.caja_metodos_pago mp ON mp.id = pf.metodo_pago_id
  LEFT JOIN auth.users u2 ON u2.id = pf.created_by_id
  LEFT JOIN public.profiles p2 ON p2.id = pf.created_by_id
  WHERE pf.cliente_id = p_cliente_id

  ORDER BY created_at DESC;
END;
$$;
