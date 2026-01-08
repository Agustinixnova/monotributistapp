-- Crear bucket para educacion impositiva
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'educacion-impositiva',
    'educacion-impositiva',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Politica de lectura publica
DROP POLICY IF EXISTS "educacion_storage_select" ON storage.objects;
CREATE POLICY "educacion_storage_select" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'educacion-impositiva');

-- Politica de insercion para editores
DROP POLICY IF EXISTS "educacion_storage_insert" ON storage.objects;
CREATE POLICY "educacion_storage_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'educacion-impositiva'
        AND public.puede_editar_educacion()
    );

-- Politica de actualizacion para editores
DROP POLICY IF EXISTS "educacion_storage_update" ON storage.objects;
CREATE POLICY "educacion_storage_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'educacion-impositiva'
        AND public.puede_editar_educacion()
    );

-- Politica de eliminacion para editores
DROP POLICY IF EXISTS "educacion_storage_delete" ON storage.objects;
CREATE POLICY "educacion_storage_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'educacion-impositiva'
        AND public.puede_editar_educacion()
    );
