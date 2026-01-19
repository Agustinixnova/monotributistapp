-- =====================================================
-- Agregar tracking de quién creó cada registro
-- =====================================================

-- Agregar campo created_by_id a caja_movimientos
ALTER TABLE public.caja_movimientos
ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES auth.users(id);

-- Agregar campo created_by_id a caja_arqueos
ALTER TABLE public.caja_arqueos
ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES auth.users(id);

-- Agregar campo created_by_id a caja_cierres
ALTER TABLE public.caja_cierres
ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES auth.users(id);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_caja_movimientos_created_by ON public.caja_movimientos(created_by_id);
CREATE INDEX IF NOT EXISTS idx_caja_arqueos_created_by ON public.caja_arqueos(created_by_id);
CREATE INDEX IF NOT EXISTS idx_caja_cierres_created_by ON public.caja_cierres(created_by_id);

-- Función helper para obtener nombre completo de un usuario
CREATE OR REPLACE FUNCTION public.get_user_nombre_completo(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_nombre TEXT;
  v_apellido TEXT;
  v_nombre_completo TEXT;
  v_email TEXT;
BEGIN
  -- Intentar obtener nombre y apellido de profiles
  SELECT nombre, apellido INTO v_nombre, v_apellido
  FROM public.profiles
  WHERE id = p_user_id;

  -- Concatenar nombre y apellido
  IF v_nombre IS NOT NULL THEN
    v_nombre_completo := TRIM(v_nombre || ' ' || COALESCE(v_apellido, ''));
  END IF;

  -- Si no hay nombre completo, intentar obtener email de auth.users
  IF v_nombre_completo IS NULL OR v_nombre_completo = '' THEN
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = p_user_id;

    -- Extraer la parte antes del @ del email
    IF v_email IS NOT NULL THEN
      v_nombre_completo := split_part(v_email, '@', 1);
    END IF;
  END IF;

  RETURN COALESCE(v_nombre_completo, 'Usuario');
END;
$$;

-- Actualizar registros existentes para que created_by_id = user_id
UPDATE public.caja_movimientos SET created_by_id = user_id WHERE created_by_id IS NULL;
UPDATE public.caja_arqueos SET created_by_id = user_id WHERE created_by_id IS NULL;
UPDATE public.caja_cierres SET created_by_id = user_id WHERE created_by_id IS NULL;

-- COMENTARIO:
-- A partir de ahora, cuando un empleado cree un registro:
-- - user_id = ID del dueño (efectiveUserId)
-- - created_by_id = ID del empleado o dueño que lo creó (auth.uid())
