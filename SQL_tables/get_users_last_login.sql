-- Función RPC para obtener el último login de una lista de usuarios
-- Útil para obtener last_sign_in_at de empleados

CREATE OR REPLACE FUNCTION get_users_last_login(user_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  last_sign_in_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo usuarios con acceso total pueden usar esta función
  IF NOT public.is_full_access() THEN
    RAISE EXCEPTION 'No tenés permisos para ver esta información';
  END IF;

  RETURN QUERY
  SELECT
    au.id as user_id,
    au.last_sign_in_at
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION get_users_last_login(UUID[]) TO authenticated;
