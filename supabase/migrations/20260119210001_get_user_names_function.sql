-- Función segura para obtener nombres de usuarios
-- Usa SECURITY DEFINER para bypasear RLS y solo devuelve nombre, apellido, email

CREATE OR REPLACE FUNCTION public.get_users_names(user_ids UUID[])
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    apellido TEXT,
    email TEXT,
    nombre_completo TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.nombre,
        p.apellido,
        p.email,
        TRIM(p.nombre || ' ' || COALESCE(p.apellido, ''))::TEXT as nombre_completo
    FROM public.profiles p
    WHERE p.id = ANY(user_ids);
END;
$$;

-- Dar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.get_users_names(UUID[]) TO authenticated;
