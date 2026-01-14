-- ========================================
-- POLITICA PARA ACTUALIZAR MENSAJES DEL BUZON
-- Necesaria para agregar adjuntos después de crear el mensaje
-- ========================================

-- Permitir al autor del mensaje actualizar su propio mensaje
DROP POLICY IF EXISTS "mensajes_update" ON public.buzon_mensajes;
CREATE POLICY "mensajes_update" ON public.buzon_mensajes
    FOR UPDATE USING (
        enviado_por = auth.uid()
    );

-- Nota: Esta política permite a los usuarios actualizar sus propios mensajes.
-- Principalmente usado para agregar adjuntos después de crear la conversación.
