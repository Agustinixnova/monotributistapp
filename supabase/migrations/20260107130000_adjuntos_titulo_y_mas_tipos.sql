-- Agregar columna titulo a educacion_adjuntos
ALTER TABLE public.educacion_adjuntos
ADD COLUMN IF NOT EXISTS titulo VARCHAR(255);

-- Actualizar bucket para permitir mas tipos de archivos
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
]
WHERE id = 'educacion-impositiva';
