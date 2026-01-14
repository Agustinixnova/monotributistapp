-- ========================================
-- CREAR FUNCION crear_conversacion_con_destinatarios
-- ========================================
-- Esta función permite a contadoras crear una conversación con múltiples destinatarios específicos
-- Útil para enviar mensajes masivos a clientes seleccionados

CREATE OR REPLACE FUNCTION public.crear_conversacion_con_destinatarios(
    p_iniciado_por UUID,
    p_asunto TEXT,
    p_contenido TEXT,
    p_destinatarios UUID[] DEFAULT NULL,
    p_origen TEXT DEFAULT 'general',
    p_origen_referencia JSONB DEFAULT NULL,
    p_adjuntos JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_conversacion_id UUID;
    v_destinatario_id UUID;
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

    -- Agregar al iniciador como participante (leído)
    INSERT INTO public.buzon_participantes (conversacion_id, user_id, leido)
    VALUES (v_conversacion_id, p_iniciado_por, TRUE);

    -- Agregar destinatarios como participantes (no leídos)
    IF p_destinatarios IS NOT NULL AND array_length(p_destinatarios, 1) > 0 THEN
        FOREACH v_destinatario_id IN ARRAY p_destinatarios
        LOOP
            INSERT INTO public.buzon_participantes (conversacion_id, user_id, leido)
            VALUES (v_conversacion_id, v_destinatario_id, FALSE)
            ON CONFLICT (conversacion_id, user_id) DO NOTHING;
        END LOOP;
    END IF;

    RETURN v_conversacion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.crear_conversacion_con_destinatarios(UUID, TEXT, TEXT, UUID[], TEXT, JSONB, JSONB) IS 'Crea una conversación con destinatarios específicos. Útil para envíos masivos de contadoras a clientes seleccionados.';

-- Grant execute
GRANT EXECUTE ON FUNCTION public.crear_conversacion_con_destinatarios TO authenticated;
