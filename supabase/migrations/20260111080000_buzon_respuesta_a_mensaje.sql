-- ========================================
-- AGREGAR CAMPO PARA RESPONDER A MENSAJE ESPECÍFICO
-- Similar a WhatsApp, permite citar un mensaje al responder
-- ========================================

-- Agregar columna para referenciar mensaje al que se responde
ALTER TABLE public.buzon_mensajes
ADD COLUMN IF NOT EXISTS respuesta_a UUID REFERENCES public.buzon_mensajes(id) ON DELETE SET NULL;

-- Índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_mensajes_respuesta_a ON public.buzon_mensajes(respuesta_a);

COMMENT ON COLUMN public.buzon_mensajes.respuesta_a IS 'ID del mensaje al que se está respondiendo (cita/reply)';
