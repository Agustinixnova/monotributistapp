-- =====================================================
-- Storage: Logos para facturación
-- Fecha: 2026-01-29
-- =====================================================
--
-- Bucket para almacenar logos que se muestran en las
-- facturas PDF generadas.
--
-- Estructura de archivos:
-- logos-facturacion/
--   {user_id}/
--     logo_{timestamp}.{extension}
--
-- =====================================================

-- Crear bucket para logos de facturación
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'logos-facturacion',
    'logos-facturacion',
    true,  -- público para poder mostrar en PDFs
    2097152,  -- 2MB máximo
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Usuarios autenticados pueden subir su propio logo
CREATE POLICY "usuarios_suben_su_logo" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'logos-facturacion' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Usuarios pueden ver su propio logo
CREATE POLICY "usuarios_ven_su_logo" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'logos-facturacion' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Acceso público para leer logos (necesario para PDFs)
CREATE POLICY "logos_publicos_lectura" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'logos-facturacion');

-- Usuarios pueden eliminar su propio logo
CREATE POLICY "usuarios_eliminan_su_logo" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'logos-facturacion' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Usuarios pueden actualizar su propio logo
CREATE POLICY "usuarios_actualizan_su_logo" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'logos-facturacion' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- =====================================================
-- COLUMNA EN CONFIG AFIP
-- =====================================================

-- Agregar columna logo_url a la configuración AFIP
ALTER TABLE public.agenda_config_afip
ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN public.agenda_config_afip.logo_url IS
'URL del logo para mostrar en las facturas PDF';

-- =====================================================
-- FIN
-- =====================================================
