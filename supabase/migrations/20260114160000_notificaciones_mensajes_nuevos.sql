-- =============================================
-- Trigger para crear notificaciones cuando llegan mensajes nuevos
-- =============================================

CREATE OR REPLACE FUNCTION public.notificar_mensaje_nuevo()
RETURNS TRIGGER AS $$
DECLARE
    v_participante_id UUID;
    v_conversacion_asunto TEXT;
    v_remitente_nombre TEXT;
    v_contador INT := 0;
BEGIN
    -- Obtener asunto de la conversación
    SELECT asunto INTO v_conversacion_asunto
    FROM public.buzon_conversaciones
    WHERE id = NEW.conversacion_id;

    -- Obtener nombre del remitente
    SELECT COALESCE(nombre || ' ' || apellido, email) INTO v_remitente_nombre
    FROM public.profiles
    WHERE id = NEW.enviado_por;

    -- Para cada participante de la conversación (excepto el remitente)
    FOR v_participante_id IN
        SELECT user_id
        FROM public.buzon_participantes
        WHERE conversacion_id = NEW.conversacion_id
        AND user_id != NEW.enviado_por
    LOOP
        -- Crear notificación para este participante
        INSERT INTO public.client_notifications (
            user_id,
            tipo,
            titulo,
            mensaje,
            metadata,
            leido
        ) VALUES (
            v_participante_id,
            'mensaje_nuevo',
            'Nuevo mensaje en ' || v_conversacion_asunto,
            v_remitente_nombre || ' te ha enviado un mensaje',
            jsonb_build_object(
                'conversacion_id', NEW.conversacion_id,
                'mensaje_id', NEW.id,
                'remitente_id', NEW.enviado_por
            ),
            FALSE
        );

        v_contador := v_contador + 1;
    END LOOP;

    RAISE NOTICE 'Notificaciones creadas para % participantes', v_contador;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_notificar_mensaje_nuevo ON public.buzon_mensajes;

CREATE TRIGGER trigger_notificar_mensaje_nuevo
    AFTER INSERT ON public.buzon_mensajes
    FOR EACH ROW
    EXECUTE FUNCTION public.notificar_mensaje_nuevo();

COMMENT ON FUNCTION public.notificar_mensaje_nuevo() IS 'Crea notificaciones para todos los participantes de una conversación cuando llega un mensaje nuevo (excepto el remitente)';

-- Grant execute
GRANT EXECUTE ON FUNCTION public.notificar_mensaje_nuevo() TO authenticated;
