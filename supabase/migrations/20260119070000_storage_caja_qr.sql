-- Crear bucket para QR de caja (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'caja-qr',
  'caja-qr',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

-- Políticas RLS para el bucket caja-qr

-- Permitir SELECT a todos (bucket público)
CREATE POLICY "caja_qr_select_all" ON storage.objects
FOR SELECT
USING (bucket_id = 'caja-qr');

-- Permitir INSERT solo a usuarios autenticados
CREATE POLICY "caja_qr_insert_own" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'caja-qr'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir UPDATE solo a archivos propios
CREATE POLICY "caja_qr_update_own" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'caja-qr'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir DELETE solo a archivos propios
CREATE POLICY "caja_qr_delete_own" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'caja-qr'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
