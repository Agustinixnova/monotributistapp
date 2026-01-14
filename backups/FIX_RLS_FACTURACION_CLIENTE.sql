-- =============================================
-- FIX: RLS para que clientes vean su facturación
-- =============================================

-- 1. Eliminar políticas existentes que puedan estar mal
DROP POLICY IF EXISTS "cargas_select_cliente" ON public.client_facturacion_cargas;
DROP POLICY IF EXISTS "resumen_select_cliente" ON public.client_facturacion_mensual_resumen;

-- 2. Recrear política SELECT para client_facturacion_cargas
-- El cliente puede ver sus propias cargas
CREATE POLICY "cargas_select_cliente" ON public.client_facturacion_cargas
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );

-- 3. Recrear política SELECT para client_facturacion_mensual_resumen
-- El cliente puede ver su resumen mensual
CREATE POLICY "resumen_select_cliente" ON public.client_facturacion_mensual_resumen
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );

-- 4. Verificar que RLS está habilitado
ALTER TABLE public.client_facturacion_cargas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_facturacion_mensual_resumen ENABLE ROW LEVEL SECURITY;

-- 5. Verificación - mostrar todas las políticas
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('client_facturacion_cargas', 'client_facturacion_mensual_resumen')
ORDER BY tablename, policyname;
