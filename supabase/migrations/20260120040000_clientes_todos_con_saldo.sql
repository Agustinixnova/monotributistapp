-- =====================================================
-- Función para obtener TODOS los clientes activos con su saldo
-- Descripción: Retorna todos los clientes activos, no solo los que tienen deuda
--              El saldo puede ser positivo (deuda), cero, o negativo (a favor)
-- Fecha: 2026-01-20
-- =====================================================

-- Función para obtener todos los clientes activos con su saldo
CREATE OR REPLACE FUNCTION public.caja_todos_clientes_con_saldo(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  nombre VARCHAR(100),
  apellido VARCHAR(100),
  telefono VARCHAR(50),
  limite_credito DECIMAL(12,2),
  deuda_total DECIMAL(12,2)
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
    public.caja_cliente_deuda(c.id) AS deuda_total
  FROM public.caja_clientes_fiado c
  WHERE c.user_id = p_user_id
    AND c.activo = true
  ORDER BY c.nombre ASC, c.apellido ASC;
END;
$$;

-- Comentario
COMMENT ON FUNCTION public.caja_todos_clientes_con_saldo(UUID) IS
'Retorna todos los clientes activos con su saldo actual (deuda positiva, cero, o saldo a favor negativo)';
