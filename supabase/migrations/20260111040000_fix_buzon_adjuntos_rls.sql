-- ========================================
-- MODIFICAR POLITICA RLS PARA PERMITIR UPLOAD DE ADJUNTOS
-- ========================================

-- La política de INSERT ahora permite a cualquier usuario autenticado subir archivos
-- La seguridad se mantiene en SELECT, donde solo los participantes pueden ver los adjuntos
-- Esto permite el flujo donde se suben archivos antes de crear la conversación

DROP POLICY IF EXISTS "buzon_adjuntos_insert" ON storage.objects;
CREATE POLICY "buzon_adjuntos_insert" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'buzon-adjuntos'
        AND auth.uid() IS NOT NULL  -- Solo usuarios autenticados
    );
