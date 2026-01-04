-- ============================================
-- POLÍTICAS DE STORAGE PARA FACTURAS
-- Bucket: invoices (privado)
-- ============================================

-- Primero crear el bucket si no existe (ejecutar en Supabase Dashboard)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('invoices', 'invoices', false);

-- Los usuarios pueden ver sus propias facturas
CREATE POLICY "Usuarios ven sus facturas"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoices'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Los admins pueden subir facturas a cualquier carpeta de usuario
CREATE POLICY "Admins suben facturas"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM profiles
    JOIN roles ON profiles.role_id = roles.id
    WHERE profiles.id = auth.uid()
    AND roles.name = 'admin'
  )
);

-- Los admins pueden actualizar facturas
CREATE POLICY "Admins modifican facturas"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM profiles
    JOIN roles ON profiles.role_id = roles.id
    WHERE profiles.id = auth.uid()
    AND roles.name = 'admin'
  )
);

-- Los admins pueden eliminar facturas
CREATE POLICY "Admins eliminan facturas"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM profiles
    JOIN roles ON profiles.role_id = roles.id
    WHERE profiles.id = auth.uid()
    AND roles.name = 'admin'
  )
);

-- ============================================
-- NOTAS
-- ============================================
-- La estructura de carpetas será:
-- invoices/{user_id}/{invoice_number}.pdf
-- Ejemplo: invoices/abc123-uuid/INV-202601-0001.pdf
--
-- Para crear el bucket ejecutar en SQL Editor de Supabase:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'invoices',
--   'invoices',
--   false,
--   10485760, -- 10MB
--   ARRAY['application/pdf']
-- );
