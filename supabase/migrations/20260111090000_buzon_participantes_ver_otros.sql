-- ========================================
-- POLÍTICA PARA VER ESTADO DE LECTURA DE OTROS PARTICIPANTES
-- Permite ver si otros leyeron en conversaciones donde soy participante
-- ========================================

-- Política adicional: ver participantes de conversaciones donde soy participante
DROP POLICY IF EXISTS "participantes_select_misma_conversacion" ON public.buzon_participantes;
CREATE POLICY "participantes_select_misma_conversacion" ON public.buzon_participantes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.buzon_participantes mi_participacion
            WHERE mi_participacion.conversacion_id = buzon_participantes.conversacion_id
            AND mi_participacion.user_id = auth.uid()
        )
    );

COMMENT ON POLICY "participantes_select_misma_conversacion" ON public.buzon_participantes
    IS 'Permite ver el estado de lectura de otros participantes en conversaciones donde soy participante';
