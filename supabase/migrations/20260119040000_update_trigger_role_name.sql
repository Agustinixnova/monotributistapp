-- =====================================================
-- MIGRACIÓN: Actualizar trigger para usar role_name del metadata
-- Fecha: 2026-01-19
-- Descripción:
--   Permite especificar el rol directamente en raw_user_meta_data->>'role_name'
--   para mayor flexibilidad al crear usuarios (especialmente empleados)
-- =====================================================

-- Actualizar la función del trigger
CREATE OR REPLACE FUNCTION public.handle_new_free_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role_id UUID;
    v_nombre TEXT;
    v_apellido TEXT;
    v_tipo_usuario TEXT;
    v_role_name TEXT;
BEGIN
    -- Obtener datos del raw_user_meta_data
    v_nombre := NEW.raw_user_meta_data->>'nombre';
    v_apellido := NEW.raw_user_meta_data->>'apellido';
    v_tipo_usuario := NEW.raw_user_meta_data->>'tipo_usuario';
    v_role_name := NEW.raw_user_meta_data->>'role_name';

    -- Solo procesar si es un usuario tipo 'free' o 'empleado'
    IF v_tipo_usuario IN ('free', 'empleado') THEN
        -- Si hay un role_name específico en el metadata, usarlo
        IF v_role_name IS NOT NULL THEN
            SELECT id INTO v_role_id
            FROM public.roles
            WHERE name = v_role_name
            LIMIT 1;
        END IF;

        -- Si no hay role_name o no se encontró, usar lógica por defecto
        IF v_role_id IS NULL THEN
            -- Obtener el ID del rol operador_gastos por defecto
            SELECT id INTO v_role_id
            FROM public.roles
            WHERE name = 'operador_gastos'
            LIMIT 1;

            -- Si no encontramos el rol y es empleado, usar operador_gastos_empleado
            IF v_role_id IS NULL AND v_tipo_usuario = 'empleado' THEN
                SELECT id INTO v_role_id
                FROM public.roles
                WHERE name = 'operador_gastos_empleado'
                LIMIT 1;
            END IF;
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

COMMENT ON FUNCTION public.handle_new_free_user() IS 'Crea automáticamente el perfil en usuarios_free. Usa role_name del metadata si está disponible, sino aplica lógica por defecto.';
