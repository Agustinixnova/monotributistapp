-- =============================================
-- FIX RLS FACTURACION - Ejecutar en SQL Editor
-- Proyecto: São Paulo (nhwiezngaprzoqcvutbx)
-- =============================================

-- =============================================
-- PASO 1: client_facturacion_cargas
-- =============================================

DROP POLICY IF EXISTS "cargas_select_admin" ON public.client_facturacion_cargas;
DROP POLICY IF EXISTS "cargas_select_contador" ON public.client_facturacion_cargas;
DROP POLICY IF EXISTS "cargas_select_cliente" ON public.client_facturacion_cargas;
DROP POLICY IF EXISTS "cargas_insert_admin" ON public.client_facturacion_cargas;
DROP POLICY IF EXISTS "cargas_insert_cliente" ON public.client_facturacion_cargas;
DROP POLICY IF EXISTS "cargas_update_admin" ON public.client_facturacion_cargas;
DROP POLICY IF EXISTS "cargas_update_cliente" ON public.client_facturacion_cargas;
DROP POLICY IF EXISTS "cargas_delete_admin" ON public.client_facturacion_cargas;

CREATE POLICY "cargas_select_admin" ON public.client_facturacion_cargas
    FOR SELECT USING (public.is_full_access());

CREATE POLICY "cargas_select_contador" ON public.client_facturacion_cargas
    FOR SELECT USING (
        public.get_user_role() = 'contador_secundario'
        AND client_id IN (
            SELECT cfd.id FROM public.client_fiscal_data cfd
            JOIN public.profiles p ON cfd.user_id = p.id
            WHERE p.assigned_to = auth.uid()
        )
    );

CREATE POLICY "cargas_select_cliente" ON public.client_facturacion_cargas
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "cargas_insert_admin" ON public.client_facturacion_cargas
    FOR INSERT WITH CHECK (public.is_contador());

CREATE POLICY "cargas_insert_cliente" ON public.client_facturacion_cargas
    FOR INSERT WITH CHECK (
        public.get_user_role() IN ('monotributista', 'responsable_inscripto')
        AND client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "cargas_update_admin" ON public.client_facturacion_cargas
    FOR UPDATE USING (public.is_contador());

CREATE POLICY "cargas_update_cliente" ON public.client_facturacion_cargas
    FOR UPDATE USING (
        public.get_user_role() IN ('monotributista', 'responsable_inscripto')
        AND client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "cargas_delete_admin" ON public.client_facturacion_cargas
    FOR DELETE USING (public.is_full_access());

-- =============================================
-- PASO 2: client_facturacion_resumen_mensual
-- =============================================

DROP POLICY IF EXISTS "resumen_select_admin" ON public.client_facturacion_resumen_mensual;
DROP POLICY IF EXISTS "resumen_select_contador" ON public.client_facturacion_resumen_mensual;
DROP POLICY IF EXISTS "resumen_select_cliente" ON public.client_facturacion_resumen_mensual;
DROP POLICY IF EXISTS "resumen_update_admin" ON public.client_facturacion_resumen_mensual;
DROP POLICY IF EXISTS "resumen_insert_admin" ON public.client_facturacion_resumen_mensual;
DROP POLICY IF EXISTS "resumen_delete_admin" ON public.client_facturacion_resumen_mensual;
DROP POLICY IF EXISTS "resumen_insert_trigger" ON public.client_facturacion_resumen_mensual;
DROP POLICY IF EXISTS "resumen_update_trigger" ON public.client_facturacion_resumen_mensual;

CREATE POLICY "resumen_select_admin" ON public.client_facturacion_resumen_mensual
    FOR SELECT USING (public.is_full_access());

CREATE POLICY "resumen_select_contador" ON public.client_facturacion_resumen_mensual
    FOR SELECT USING (
        public.get_user_role() = 'contador_secundario'
        AND client_id IN (
            SELECT cfd.id FROM public.client_fiscal_data cfd
            JOIN public.profiles p ON cfd.user_id = p.id
            WHERE p.assigned_to = auth.uid()
        )
    );

CREATE POLICY "resumen_select_cliente" ON public.client_facturacion_resumen_mensual
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "resumen_update_admin" ON public.client_facturacion_resumen_mensual
    FOR UPDATE USING (public.is_contador());

CREATE POLICY "resumen_insert_admin" ON public.client_facturacion_resumen_mensual
    FOR INSERT WITH CHECK (public.is_contador());

CREATE POLICY "resumen_delete_admin" ON public.client_facturacion_resumen_mensual
    FOR DELETE USING (public.is_full_access());

-- Políticas para triggers (necesarias para que funcione el recálculo automático)
CREATE POLICY "resumen_insert_trigger" ON public.client_facturacion_resumen_mensual
    FOR INSERT WITH CHECK (true);

CREATE POLICY "resumen_update_trigger" ON public.client_facturacion_resumen_mensual
    FOR UPDATE USING (true);

-- =============================================
-- PASO 3: client_cuota_mensual
-- =============================================

DROP POLICY IF EXISTS "cuota_mensual_select" ON public.client_cuota_mensual;
DROP POLICY IF EXISTS "cuota_mensual_insert" ON public.client_cuota_mensual;
DROP POLICY IF EXISTS "cuota_mensual_update" ON public.client_cuota_mensual;
DROP POLICY IF EXISTS "cuota_mensual_delete" ON public.client_cuota_mensual;
DROP POLICY IF EXISTS "cuota_mensual_delete_admin" ON public.client_cuota_mensual;

CREATE POLICY "cuota_mensual_select" ON public.client_cuota_mensual
    FOR SELECT USING (
        public.is_full_access()
        OR (public.get_user_role() = 'contador_secundario' AND client_id IN (
            SELECT cfd.id FROM public.client_fiscal_data cfd
            JOIN public.profiles p ON cfd.user_id = p.id
            WHERE p.assigned_to = auth.uid()
        ))
        OR client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "cuota_mensual_insert" ON public.client_cuota_mensual
    FOR INSERT WITH CHECK (public.is_contador());

CREATE POLICY "cuota_mensual_update" ON public.client_cuota_mensual
    FOR UPDATE USING (public.is_contador());

CREATE POLICY "cuota_mensual_delete" ON public.client_cuota_mensual
    FOR DELETE USING (public.is_full_access());

-- =============================================
-- VERIFICACIÓN
-- =============================================
-- Después de ejecutar, verificar con:
-- SELECT * FROM client_facturacion_cargas LIMIT 5;
-- SELECT * FROM client_facturacion_resumen_mensual LIMIT 5;
-- SELECT * FROM client_cuota_mensual LIMIT 5;
