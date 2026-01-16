-- =============================================
-- Actualizar función responder_conversacion para soportar adjuntos y respuestas
-- =============================================

CREATE OR REPLACE FUNCTION public.responder_conversacion(
    p_conversacion_id UUID,
    p_user_id UUID,
    p_contenido TEXT,
    p_adjuntos JSONB DEFAULT '[]'::jsonb,
    p_respuesta_a UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_mensaje_id UUID;
BEGIN
    -- Verificar que el usuario es participante
    IF NOT EXISTS (
        SELECT 1 FROM public.buzon_participantes
        WHERE conversacion_id = p_conversacion_id
        AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Usuario no es participante de esta conversacion';
    END IF;

    -- Crear mensaje con adjuntos y respuesta_a
    INSERT INTO public.buzon_mensajes (
        conversacion_id, enviado_por, contenido, adjuntos, respuesta_a
    )
    VALUES (
        p_conversacion_id, p_user_id, p_contenido, p_adjuntos, p_respuesta_a
    )
    RETURNING id INTO v_mensaje_id;

    -- Marcar como leido para el que responde
    UPDATE public.buzon_participantes
    SET leido = TRUE, ultimo_leido_at = NOW()
    WHERE conversacion_id = p_conversacion_id
    AND user_id = p_user_id;

    -- Marcar como no leido para los demas participantes
    UPDATE public.buzon_participantes
    SET leido = FALSE
    WHERE conversacion_id = p_conversacion_id
    AND user_id != p_user_id;

    RETURN v_mensaje_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.responder_conversacion(UUID, UUID, TEXT, JSONB, UUID) IS 'Agrega un mensaje de respuesta a una conversación. Ahora soporta adjuntos y respuestas a mensajes específicos.';

-- Grant execute
GRANT EXECUTE ON FUNCTION public.responder_conversacion TO authenticated;
