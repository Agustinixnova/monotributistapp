-- ========================================
-- MODIFICAR FUNCION crear_conversacion_buzon PARA SOPORTAR ADJUNTOS
-- ========================================
CREATE OR REPLACE FUNCTION public.crear_conversacion_buzon(
    p_iniciado_por UUID,
    p_asunto TEXT,
    p_contenido TEXT,
    p_origen TEXT DEFAULT 'general',
    p_origen_referencia JSONB DEFAULT NULL,
    p_adjuntos JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_conversacion_id UUID;
    v_contador_asignado UUID;
    v_rol_iniciador TEXT;
BEGIN
    -- Crear conversacion
    INSERT INTO public.buzon_conversaciones (
        iniciado_por, asunto, origen, origen_referencia
    )
    VALUES (
        p_iniciado_por, p_asunto, p_origen, p_origen_referencia
    )
    RETURNING id INTO v_conversacion_id;

    -- Crear primer mensaje con adjuntos
    INSERT INTO public.buzon_mensajes (
        conversacion_id, enviado_por, contenido, adjuntos
    )
    VALUES (
        v_conversacion_id, p_iniciado_por, p_contenido, p_adjuntos
    );

    -- Agregar al iniciador como participante
    INSERT INTO public.buzon_participantes (conversacion_id, user_id, leido)
    VALUES (v_conversacion_id, p_iniciado_por, TRUE);

    -- Obtener rol del iniciador
    SELECT r.name INTO v_rol_iniciador
    FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = p_iniciado_por;

    -- Si es cliente, agregar contadoras como participantes
    IF v_rol_iniciador IN ('monotributista', 'responsable_inscripto') THEN
        -- Agregar admin, contadora_principal, desarrollo, comunicadora
        INSERT INTO public.buzon_participantes (conversacion_id, user_id, leido)
        SELECT v_conversacion_id, p.id, FALSE
        FROM public.profiles p
        JOIN public.roles r ON p.role_id = r.id
        WHERE r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora')
        AND p.is_active = TRUE
        ON CONFLICT (conversacion_id, user_id) DO NOTHING;

        -- Agregar contador_secundario asignado si existe
        SELECT assigned_to INTO v_contador_asignado
        FROM public.profiles
        WHERE id = p_iniciado_por;

        IF v_contador_asignado IS NOT NULL THEN
            INSERT INTO public.buzon_participantes (conversacion_id, user_id, leido)
            VALUES (v_conversacion_id, v_contador_asignado, FALSE)
            ON CONFLICT (conversacion_id, user_id) DO NOTHING;
        END IF;
    ELSE
        -- Si es contadora, agregar al cliente de la conversacion (si aplica por origen_referencia)
        -- Por ahora, las contadoras pueden iniciar conversaciones generales
        NULL;
    END IF;

    RETURN v_conversacion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.crear_conversacion_buzon(UUID, TEXT, TEXT, TEXT, JSONB, JSONB) IS 'Crea una conversación con el sistema de ruteo automático a contadoras. Ahora soporta adjuntos en el primer mensaje.';

-- ========================================
-- MODIFICAR FUNCION crear_conversacion_directa PARA SOPORTAR ADJUNTOS
-- ========================================
CREATE OR REPLACE FUNCTION public.crear_conversacion_directa(
    p_remitente_id UUID,
    p_destinatario_id UUID,
    p_asunto TEXT,
    p_contenido TEXT,
    p_origen TEXT DEFAULT 'general',
    p_origen_referencia JSONB DEFAULT NULL,
    p_adjuntos JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_conversacion_id UUID;
BEGIN
    -- Crear conversacion
    INSERT INTO public.buzon_conversaciones (
        iniciado_por, asunto, origen, origen_referencia
    )
    VALUES (
        p_remitente_id, p_asunto, p_origen, p_origen_referencia
    )
    RETURNING id INTO v_conversacion_id;

    -- Crear primer mensaje con adjuntos
    INSERT INTO public.buzon_mensajes (
        conversacion_id, enviado_por, contenido, adjuntos
    )
    VALUES (
        v_conversacion_id, p_remitente_id, p_contenido, p_adjuntos
    );

    -- Agregar remitente como participante (leído)
    INSERT INTO public.buzon_participantes (conversacion_id, user_id, leido)
    VALUES (v_conversacion_id, p_remitente_id, TRUE);

    -- Agregar destinatario como participante (no leído)
    INSERT INTO public.buzon_participantes (conversacion_id, user_id, leido)
    VALUES (v_conversacion_id, p_destinatario_id, FALSE);

    RETURN v_conversacion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.crear_conversacion_directa(UUID, UUID, TEXT, TEXT, TEXT, JSONB, JSONB) IS 'Crea una conversación 1 a 1 entre un remitente y un destinatario específico. Ahora soporta adjuntos en el primer mensaje.';
