-- =====================================================
-- Fix FINAL: Recrear caja_cliente_historial completamente
-- Fecha: 2026-01-20
-- =====================================================

-- Eliminar función existente
DROP FUNCTION IF EXISTS public.caja_cliente_historial(UUID);

-- Crear versión simplificada y funcional
CREATE OR REPLACE FUNCTION public.caja_cliente_historial(p_cliente_id UUID)
RETURNS TABLE (
  id UUID,
  tipo TEXT,
  fecha DATE,
  hora TIME,
  monto DECIMAL(12,2),
  descripcion TEXT,
  metodo_pago TEXT,
  saldado BOOLEAN,
  created_at TIMESTAMPTZ,
  created_by_nombre TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- Fiados (cuentas corrientes)
  SELECT
    f.id,
    'fiado'::TEXT AS tipo,
    f.fecha,
    f.hora,
    f.monto,
    f.descripcion::TEXT,
    NULL::TEXT AS metodo_pago,
    f.saldado,
    f.created_at,
    COALESCE(
      NULLIF(TRIM(COALESCE(pr.nombre, '') || ' ' || COALESCE(pr.apellido, '')), ''),
      'Usuario'
    )::TEXT AS created_by_nombre
  FROM public.caja_fiados f
  LEFT JOIN public.profiles pr ON pr.id = f.created_by_id
  WHERE f.cliente_id = p_cliente_id

  UNION ALL

  -- Pagos
  SELECT
    pf.id,
    'pago'::TEXT AS tipo,
    pf.fecha,
    pf.hora,
    pf.monto,
    pf.nota::TEXT AS descripcion,
    mp.nombre::TEXT AS metodo_pago,
    NULL::BOOLEAN AS saldado,
    pf.created_at,
    COALESCE(
      NULLIF(TRIM(COALESCE(pr2.nombre, '') || ' ' || COALESCE(pr2.apellido, '')), ''),
      'Usuario'
    )::TEXT AS created_by_nombre
  FROM public.caja_pagos_fiado pf
  LEFT JOIN public.caja_metodos_pago mp ON mp.id = pf.metodo_pago_id
  LEFT JOIN public.profiles pr2 ON pr2.id = pf.created_by_id
  WHERE pf.cliente_id = p_cliente_id

  ORDER BY created_at DESC;
$$;
