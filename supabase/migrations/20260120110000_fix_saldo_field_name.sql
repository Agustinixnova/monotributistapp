-- =====================================================
-- Fix: Cambiar nombre de campo 'saldo' a 'deuda_total'
-- para consistencia con el frontend
-- =====================================================

DROP FUNCTION IF EXISTS public.caja_todos_clientes_con_saldo(UUID);

CREATE OR REPLACE FUNCTION public.caja_todos_clientes_con_saldo(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  nombre VARCHAR(100),
  apellido VARCHAR(100),
  telefono VARCHAR(50),
  limite_credito DECIMAL(12,2),
  deuda_total DECIMAL(12,2),
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
    public.caja_cliente_deuda(c.id) AS deuda_total,
    c.comentario
  FROM public.caja_clientes_fiado c
  WHERE c.user_id = p_user_id
    AND c.activo = true
  ORDER BY c.nombre, c.apellido;
END;
$$;

GRANT EXECUTE ON FUNCTION public.caja_todos_clientes_con_saldo(UUID) TO authenticated;
