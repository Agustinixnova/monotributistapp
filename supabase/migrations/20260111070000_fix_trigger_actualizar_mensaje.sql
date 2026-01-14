-- ========================================
-- FIX: Trigger para actualizar ultimo_mensaje_at con SECURITY DEFINER
-- El trigger necesita permisos elevados para actualizar filas de otros usuarios
-- ========================================

CREATE OR REPLACE FUNCTION public.actualizar_ultimo_mensaje()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Actualizar timestamp de último mensaje en la conversación
    UPDATE public.buzon_conversaciones
    SET ultimo_mensaje_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversacion_id;

    -- Marcar como no leído para todos los participantes excepto el que envió
    UPDATE public.buzon_participantes
    SET leido = FALSE
    WHERE conversacion_id = NEW.conversacion_id
    AND user_id != NEW.enviado_por;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger para asegurar que use la función actualizada
DROP TRIGGER IF EXISTS trigger_actualizar_ultimo_mensaje ON public.buzon_mensajes;
CREATE TRIGGER trigger_actualizar_ultimo_mensaje
    AFTER INSERT ON public.buzon_mensajes
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_ultimo_mensaje();

COMMENT ON FUNCTION public.actualizar_ultimo_mensaje IS 'Actualiza timestamp de conversación y marca como no leído para otros participantes. Usa SECURITY DEFINER para bypasear RLS.';
