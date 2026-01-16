-- =============================================
-- Fix: Permitir que clientes vean vencimientos IIBB
-- Son datos públicos de configuración
-- =============================================

-- Agregar política para que clientes puedan ver vencimientos
DROP POLICY IF EXISTS "cm_vencimientos_select_cliente" ON public.convenio_multilateral_vencimientos;
CREATE POLICY "cm_vencimientos_select_cliente" ON public.convenio_multilateral_vencimientos
    FOR SELECT USING (
        public.get_user_role() IN ('monotributista', 'responsable_inscripto')
    );

-- También asegurar que client_cuota_mensual esté accesible
-- Recrear políticas por si acaso
DROP POLICY IF EXISTS "cuota_mensual_select_cliente" ON public.client_cuota_mensual;
CREATE POLICY "cuota_mensual_select_cliente" ON public.client_cuota_mensual
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );

-- Permitir que clientes vean el resumen de facturación
DROP POLICY IF EXISTS "resumen_select_cliente" ON public.client_facturacion_mensual_resumen;
CREATE POLICY "resumen_select_cliente" ON public.client_facturacion_mensual_resumen
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );
