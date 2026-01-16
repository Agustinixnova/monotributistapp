-- =============================================
-- Storage: Políticas para subir boletas de pago
-- Todos los roles autenticados pueden subir archivos
-- =============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir archivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar archivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer archivos" ON storage.objects;
DROP POLICY IF EXISTS "Contadores pueden eliminar archivos" ON storage.objects;

-- Permitir INSERT (upload) a todos los usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden subir archivos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'buzon-adjuntos');

-- Permitir UPDATE (sobrescribir) a todos los usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden actualizar archivos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'buzon-adjuntos');

-- Permitir SELECT (leer/descargar) a todos los usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden leer archivos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'buzon-adjuntos');

-- Permitir DELETE solo a contadores y al dueño del archivo
CREATE POLICY "Contadores pueden eliminar archivos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'buzon-adjuntos' AND (
    public.is_contador() OR
    auth.uid() = owner
  )
);
