-- Corregir función get_users_names para buscar en auth.users si no hay perfil
-- Ejecutar en Supabase SQL Editor

DROP FUNCTION IF EXISTS public.get_users_names(UUID[]);

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
        u.id,
        p.nombre,
        p.apellido,
        COALESCE(p.email, u.email) as email,
        COALESCE(
            NULLIF(TRIM(COALESCE(p.nombre, '') || ' ' || COALESCE(p.apellido, '')), ''),
            split_part(COALESCE(p.email, u.email), '@', 1),
            'Usuario'
        )::TEXT as nombre_completo
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE u.id = ANY(user_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_users_names(UUID[]) TO authenticated;

-- Actualizar movimientos existentes sin created_by_id (asumir que los creó el dueño)
UPDATE public.caja_movimientos
SET created_by_id = user_id
WHERE created_by_id IS NULL;

-- Actualizar arqueos existentes sin created_by_id
UPDATE public.caja_arqueos
SET created_by_id = user_id
WHERE created_by_id IS NULL;

-- Actualizar cierres existentes sin created_by_id
UPDATE public.caja_cierres
SET created_by_id = user_id
WHERE created_by_id IS NULL;
