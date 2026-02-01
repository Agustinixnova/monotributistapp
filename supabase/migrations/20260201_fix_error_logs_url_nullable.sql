-- Fix: Hacer que url sea nullable para errores que ocurren muy temprano
-- (antes de que la página esté completamente cargada)

ALTER TABLE public.error_logs ALTER COLUMN url DROP NOT NULL;

-- Actualizar la función para usar COALESCE con valor por defecto
CREATE OR REPLACE FUNCTION public.registrar_error(
    p_error_hash TEXT,
    p_mensaje TEXT,
    p_stack_trace TEXT DEFAULT NULL,
    p_component_stack TEXT DEFAULT NULL,
    p_url TEXT DEFAULT NULL,
    p_navegador TEXT DEFAULT NULL,
    p_viewport TEXT DEFAULT NULL,
    p_modulo TEXT DEFAULT NULL,
    p_severidad TEXT DEFAULT 'error',
    p_tipo TEXT DEFAULT 'javascript',
    p_accion_previa TEXT DEFAULT NULL,
    p_contexto JSONB DEFAULT '{}',
    p_request_data JSONB DEFAULT NULL,
    p_supabase_code TEXT DEFAULT NULL,
    p_version_app TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_error_id UUID;
    v_usuario_id UUID;
    v_usuario_email TEXT;
BEGIN
    -- Obtener usuario actual
    v_usuario_id := auth.uid();

    -- Obtener email del usuario
    SELECT email INTO v_usuario_email
    FROM auth.users
    WHERE id = v_usuario_id;

    -- Buscar si ya existe un error con el mismo hash que no esté resuelto
    SELECT id INTO v_error_id
    FROM public.error_logs
    WHERE error_hash = p_error_hash
      AND estado NOT IN ('resuelto', 'ignorado')
    LIMIT 1;

    IF v_error_id IS NOT NULL THEN
        -- Incrementar ocurrencias y actualizar última vez
        UPDATE public.error_logs
        SET ocurrencias = ocurrencias + 1,
            ultima_vez = NOW(),
            -- Actualizar usuario si es diferente (último usuario afectado)
            usuario_id = COALESCE(v_usuario_id, usuario_id),
            usuario_email = COALESCE(v_usuario_email, usuario_email)
        WHERE id = v_error_id;
    ELSE
        -- Insertar nuevo error
        INSERT INTO public.error_logs (
            error_hash, mensaje, stack_trace, component_stack,
            usuario_id, usuario_email, url, navegador, viewport,
            modulo, severidad, tipo, accion_previa, contexto,
            request_data, supabase_code, version_app
        ) VALUES (
            p_error_hash,
            p_mensaje,
            p_stack_trace,
            p_component_stack,
            v_usuario_id,
            v_usuario_email,
            COALESCE(p_url, 'unknown'), -- Valor por defecto si es null
            p_navegador,
            p_viewport,
            COALESCE(p_modulo, 'unknown'), -- Valor por defecto si es null
            p_severidad,
            p_tipo,
            p_accion_previa,
            p_contexto,
            p_request_data,
            p_supabase_code,
            p_version_app
        )
        RETURNING id INTO v_error_id;
    END IF;

    RETURN v_error_id;
END;
$$;
