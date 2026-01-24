-- Función RPC para obtener usuarios free con su último login
-- El last_sign_in_at está en auth.users y no es accesible directamente desde el cliente

CREATE OR REPLACE FUNCTION get_free_users_with_last_login()
RETURNS TABLE (
  id UUID,
  email TEXT,
  nombre TEXT,
  apellido TEXT,
  whatsapp TEXT,
  role_id UUID,
  origen TEXT,
  origen_detalle TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  role_name VARCHAR,
  role_display_name VARCHAR,
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
    uf.id,
    uf.email::TEXT,
    uf.nombre::TEXT,
    uf.apellido::TEXT,
    uf.whatsapp::TEXT,
    uf.role_id,
    uf.origen::TEXT,
    uf.origen_detalle::TEXT,
    uf.is_active,
    uf.created_at,
    uf.updated_at,
    r.name as role_name,
    r.display_name as role_display_name,
    au.last_sign_in_at
  FROM usuarios_free uf
  LEFT JOIN roles r ON r.id = uf.role_id
  LEFT JOIN auth.users au ON au.id = uf.id
  ORDER BY uf.created_at DESC;
END;
$$;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION get_free_users_with_last_login() TO authenticated;
