-- =============================================
-- Storage bucket para facturas
-- NOTA: El bucket debe crearse desde el Dashboard de Supabase
-- Este archivo documenta las políticas
-- =============================================

-- INSTRUCCIONES:
-- 1. Ir a Supabase Dashboard → Storage
-- 2. Crear bucket "facturas" con:
--    - Public: false
--    - File size limit: 10MB
--    - Allowed mime types: application/pdf, image/jpeg, image/png, image/webp
-- 3. Ejecutar las políticas de abajo en SQL Editor

-- =============================================
-- ESTRUCTURA DE PATHS:
-- facturas/<user_id>/<anio>/<mes>/<filename>
-- Ejemplo: facturas/abc123-uuid/2025/01/factura_001.pdf
-- =============================================

-- Policy SELECT: Usuario ve sus archivos, admin ve todo
CREATE POLICY "facturas_select_own" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'facturas'
        AND (
            public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
            OR (storage.foldername(name))[1] = auth.uid()::text
        )
    );

-- Policy INSERT: Usuario sube a su carpeta, admin a cualquiera
CREATE POLICY "facturas_insert_own" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'facturas'
        AND (
            public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
            OR (storage.foldername(name))[1] = auth.uid()::text
        )
    );

-- Policy UPDATE: Solo admin
CREATE POLICY "facturas_update_admin" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'facturas'
        AND public.get_user_role() IN ('admin', 'contadora_principal')
    );

-- Policy DELETE: Solo admin y contadora principal
CREATE POLICY "facturas_delete_admin" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'facturas'
        AND public.get_user_role() IN ('admin', 'contadora_principal')
    );
