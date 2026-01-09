-- =============================================
-- Storage bucket para comprobantes de cuotas de monotributo
-- =============================================

-- INSTRUCCIONES PARA CREAR EL BUCKET:
-- 1. Ir a Supabase Dashboard → Storage
-- 2. Click en "New bucket"
-- 3. Nombre: comprobantes-cuotas
-- 4. Configurar:
--    - Public: false (privado)
--    - File size limit: 10485760 (10MB)
--    - Allowed MIME types: image/jpeg, image/jpg, image/png, application/pdf
-- 5. Ejecutar las políticas de abajo en SQL Editor

-- =============================================
-- ESTRUCTURA DE PATHS:
-- comprobantes-cuotas/<client_id>/<anio>-<mes>_comprobante.<ext>
-- Ejemplo: comprobantes-cuotas/abc123-uuid/2026-01_comprobante.jpg
-- =============================================

-- Policy SELECT: Cliente ve sus comprobantes, contadoras ven todo
DROP POLICY IF EXISTS "comprobantes_cuotas_select" ON storage.objects;
CREATE POLICY "comprobantes_cuotas_select" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'comprobantes-cuotas'
        AND (
            -- Contadoras ven todo
            public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
            OR
            -- Cliente ve sus propios comprobantes (la carpeta es su client_id)
            EXISTS (
                SELECT 1 FROM public.client_fiscal_data cfd
                WHERE cfd.user_id = auth.uid()
                AND (storage.foldername(name))[1] = cfd.id::text
            )
        )
    );

-- Policy INSERT: Cliente sube a su carpeta, contadoras a cualquiera
DROP POLICY IF EXISTS "comprobantes_cuotas_insert" ON storage.objects;
CREATE POLICY "comprobantes_cuotas_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'comprobantes-cuotas'
        AND (
            -- Contadoras pueden subir a cualquier carpeta
            public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
            OR
            -- Cliente sube solo a su carpeta
            (
                public.get_user_role() IN ('monotributista', 'responsable_inscripto')
                AND EXISTS (
                    SELECT 1 FROM public.client_fiscal_data cfd
                    WHERE cfd.user_id = auth.uid()
                    AND (storage.foldername(name))[1] = cfd.id::text
                )
            )
        )
    );

-- Policy UPDATE: Cliente puede actualizar sus archivos, contadoras cualquiera
DROP POLICY IF EXISTS "comprobantes_cuotas_update" ON storage.objects;
CREATE POLICY "comprobantes_cuotas_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'comprobantes-cuotas'
        AND (
            public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora')
            OR
            (
                public.get_user_role() IN ('monotributista', 'responsable_inscripto')
                AND EXISTS (
                    SELECT 1 FROM public.client_fiscal_data cfd
                    WHERE cfd.user_id = auth.uid()
                    AND (storage.foldername(name))[1] = cfd.id::text
                )
            )
        )
    );

-- Policy DELETE: Solo admin y contadora principal
DROP POLICY IF EXISTS "comprobantes_cuotas_delete" ON storage.objects;
CREATE POLICY "comprobantes_cuotas_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'comprobantes-cuotas'
        AND public.get_user_role() IN ('admin', 'contadora_principal')
    );

-- =============================================
-- COMENTARIOS
-- =============================================
-- Este bucket almacena los comprobantes de pago de la cuota mensual
-- del monotributo que suben los clientes.
--
-- Los clientes pueden:
-- - Ver sus propios comprobantes
-- - Subir nuevos comprobantes a su carpeta
-- - Actualizar/reemplazar sus comprobantes
--
-- Las contadoras pueden:
-- - Ver todos los comprobantes
-- - Subir comprobantes a cualquier cliente
-- - Eliminar comprobantes (solo admin/contadora_principal)
