-- ========================================
-- FUNCION PARA CREAR CONVERSACION DIRECTA (1 a 1)
-- ========================================
CREATE OR REPLACE FUNCTION public.crear_conversacion_directa(
    p_remitente_id UUID,
    p_destinatario_id UUID,
    p_asunto TEXT,
    p_contenido TEXT,
    p_origen TEXT DEFAULT 'general',
    p_origen_referencia JSONB DEFAULT NULL
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

    -- Crear primer mensaje
    INSERT INTO public.buzon_mensajes (
        conversacion_id, enviado_por, contenido
    )
    VALUES (
        v_conversacion_id, p_remitente_id, p_contenido
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

COMMENT ON FUNCTION public.crear_conversacion_directa IS 'Crea una conversación 1 a 1 entre un remitente y un destinatario específico';
