-- Migración consolidada: Correcciones para arqueos y tracking de creadores
-- Ejecutar en Supabase SQL Editor

-- 1. Función para obtener nombres de usuarios (bypass RLS)
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
        p.id,
        p.nombre,
        p.apellido,
        p.email,
        TRIM(p.nombre || ' ' || COALESCE(p.apellido, ''))::TEXT as nombre_completo
    FROM public.profiles p
    WHERE p.id = ANY(user_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_users_names(UUID[]) TO authenticated;

-- 2. Agregar columnas created_by_id si no existen
DO $$
BEGIN
    -- caja_movimientos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'caja_movimientos'
                   AND column_name = 'created_by_id') THEN
        ALTER TABLE public.caja_movimientos ADD COLUMN created_by_id UUID REFERENCES auth.users(id);
    END IF;

    -- caja_arqueos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'caja_arqueos'
                   AND column_name = 'created_by_id') THEN
        ALTER TABLE public.caja_arqueos ADD COLUMN created_by_id UUID REFERENCES auth.users(id);
    END IF;

    -- caja_cierres
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'caja_cierres'
                   AND column_name = 'created_by_id') THEN
        ALTER TABLE public.caja_cierres ADD COLUMN created_by_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 3. Función corregida caja_arqueos_del_dia (sin ambigüedad de columnas)
DROP FUNCTION IF EXISTS public.caja_arqueos_del_dia(UUID, DATE);

CREATE OR REPLACE FUNCTION public.caja_arqueos_del_dia(
    p_user_id UUID,
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    id UUID,
    hora TIME,
    efectivo_esperado DECIMAL,
    efectivo_real DECIMAL,
    diferencia DECIMAL,
    motivo_diferencia VARCHAR,
    notas VARCHAR,
    created_at TIMESTAMPTZ,
    created_by_id UUID,
    creador_nombre TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id AS id,
        a.hora AS hora,
        a.efectivo_esperado AS efectivo_esperado,
        a.efectivo_real AS efectivo_real,
        a.diferencia AS diferencia,
        a.motivo_diferencia AS motivo_diferencia,
        a.notas AS notas,
        a.created_at AS created_at,
        a.created_by_id AS created_by_id,
        COALESCE(
            TRIM(p.nombre || ' ' || COALESCE(p.apellido, '')),
            split_part((SELECT u.email FROM auth.users u WHERE u.id = a.created_by_id), '@', 1),
            'Usuario'
        )::TEXT AS creador_nombre
    FROM public.caja_arqueos a
    LEFT JOIN public.profiles p ON p.id = a.created_by_id
    WHERE a.user_id = p_user_id
    AND a.fecha = p_fecha
    ORDER BY a.hora DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Comentario de verificación
COMMENT ON FUNCTION public.caja_arqueos_del_dia IS 'Lista arqueos del día con nombre del creador - Corregido ambigüedad de columnas';
COMMENT ON FUNCTION public.get_users_names IS 'Obtiene nombres de usuarios por IDs - SECURITY DEFINER para bypass RLS';

