-- =====================================================
-- TRIGGER: Crear perfil en usuarios_free automáticamente
-- Descripción: Cuando se registra un usuario con tipo_usuario='free',
--              crear automáticamente su perfil en usuarios_free
-- Fecha: 2026-01-19
-- =====================================================

-- Función que se ejecuta después de crear un usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_free_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role_id UUID;
    v_nombre TEXT;
    v_apellido TEXT;
    v_tipo_usuario TEXT;
BEGIN
    -- Obtener datos del raw_user_meta_data
    v_nombre := NEW.raw_user_meta_data->>'nombre';
    v_apellido := NEW.raw_user_meta_data->>'apellido';
    v_tipo_usuario := NEW.raw_user_meta_data->>'tipo_usuario';

    -- Solo procesar si es un usuario tipo 'free' o 'empleado'
    IF v_tipo_usuario IN ('free', 'empleado') THEN
        -- Obtener el ID del rol operador_gastos
        SELECT id INTO v_role_id
        FROM public.roles
        WHERE name = 'operador_gastos'
        LIMIT 1;

        -- Si no encontramos el rol, intentar con operador_gastos_empleado para empleados
        IF v_role_id IS NULL AND v_tipo_usuario = 'empleado' THEN
            SELECT id INTO v_role_id
            FROM public.roles
            WHERE name = 'operador_gastos_empleado'
            LIMIT 1;
        END IF;

        -- Si encontramos el rol, insertar en usuarios_free
        IF v_role_id IS NOT NULL THEN
            -- Verificar si ya existe (por si acaso)
            IF NOT EXISTS (SELECT 1 FROM public.usuarios_free WHERE id = NEW.id) THEN
                INSERT INTO public.usuarios_free (
                    id,
                    email,
                    nombre,
                    apellido,
                    whatsapp,
                    role_id,
                    origen,
                    origen_detalle
                )
                VALUES (
                    NEW.id,
                    NEW.email,
                    COALESCE(v_nombre, ''),
                    COALESCE(v_apellido, ''),
                    COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
                    v_role_id,
                    COALESCE(NEW.raw_user_meta_data->>'origen', 'otros'),
                    NEW.raw_user_meta_data->>'origen_detalle'
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS on_auth_user_created_free ON auth.users;

-- Crear trigger que se ejecuta DESPUÉS de INSERT en auth.users
CREATE TRIGGER on_auth_user_created_free
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_free_user();

-- Comentario
COMMENT ON FUNCTION public.handle_new_free_user() IS 'Crea automáticamente el perfil en usuarios_free cuando se registra un usuario gratuito o empleado';
