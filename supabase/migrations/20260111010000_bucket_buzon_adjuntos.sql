-- ========================================
-- BUCKET PARA ADJUNTOS DEL BUZON
-- ========================================

-- Crear bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'buzon-adjuntos',
  'buzon-adjuntos',
  false,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- POLITICAS RLS PARA BUCKET
-- ========================================

-- SELECT: Solo participantes de la conversación pueden ver adjuntos
DROP POLICY IF EXISTS "buzon_adjuntos_select" ON storage.objects;
CREATE POLICY "buzon_adjuntos_select" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'buzon-adjuntos'
        AND (
            -- Extraer conversacion_id del path (formato: conversacion_id/filename)
            EXISTS (
                SELECT 1
                FROM public.buzon_participantes bp
                WHERE bp.conversacion_id = (storage.foldername(name))[1]::uuid
                AND bp.user_id = auth.uid()
            )
        )
    );

-- INSERT: Solo participantes pueden subir adjuntos
DROP POLICY IF EXISTS "buzon_adjuntos_insert" ON storage.objects;
CREATE POLICY "buzon_adjuntos_insert" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'buzon-adjuntos'
        AND (
            EXISTS (
                SELECT 1
                FROM public.buzon_participantes bp
                WHERE bp.conversacion_id = (storage.foldername(name))[1]::uuid
                AND bp.user_id = auth.uid()
            )
        )
    );

-- DELETE: Solo quien subió puede eliminar
DROP POLICY IF EXISTS "buzon_adjuntos_delete" ON storage.objects;
CREATE POLICY "buzon_adjuntos_delete" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'buzon-adjuntos'
        AND owner = auth.uid()
    );
