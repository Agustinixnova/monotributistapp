-- =============================================
-- Migración: Fix RLS - Crear función is_full_access()
-- Fecha: 2025-01-06
-- Descripción: Centraliza la verificación de roles con acceso total
-- =============================================

-- =============================================
-- PASO 1: Crear función is_full_access()
-- Esta función retorna TRUE si el usuario tiene rol con acceso total
-- =============================================

CREATE OR REPLACE FUNCTION public.is_full_access()
RETURNS BOOLEAN AS $$
    SELECT public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_full_access() IS
'Retorna TRUE si el usuario tiene un rol con acceso total al sistema (admin, contadora_principal, desarrollo, comunicadora)';

-- =============================================
-- PASO 2: Actualizar is_admin() para incluir roles con acceso total
-- Esto hace que todas las políticas existentes que usan is_admin() funcionen
-- =============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT public.is_full_access()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_admin() IS
'Retorna TRUE si el usuario tiene acceso administrativo. Usa is_full_access() internamente.';

-- =============================================
-- PASO 3: Actualizar is_contador() para incluir desarrollo y comunicadora
-- =============================================

CREATE OR REPLACE FUNCTION public.is_contador()
RETURNS BOOLEAN AS $$
    SELECT public.get_user_role() IN ('admin', 'contadora_principal', 'contador_secundario', 'desarrollo', 'comunicadora')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_contador() IS
'Retorna TRUE si el usuario tiene rol de contador o superior';

-- =============================================
-- PASO 4: Arreglar políticas de alertas_config
-- =============================================
-- COMENTADO: La tabla alertas_config no existe en este punto de las migraciones
-- Se debe crear la tabla primero o mover esta sección a una migración posterior

/*
-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Admins can view alertas_config" ON public.alertas_config;
DROP POLICY IF EXISTS "Admins can update alertas_config" ON public.alertas_config;
DROP POLICY IF EXISTS "alertas_config_select" ON public.alertas_config;
DROP POLICY IF EXISTS "alertas_config_update" ON public.alertas_config;
DROP POLICY IF EXISTS "alertas_config_insert" ON public.alertas_config;
DROP POLICY IF EXISTS "alertas_config_delete" ON public.alertas_config;

-- Crear nuevas políticas usando is_full_access()
CREATE POLICY "alertas_config_select" ON public.alertas_config
    FOR SELECT USING (public.is_contador());

CREATE POLICY "alertas_config_update" ON public.alertas_config
    FOR UPDATE USING (public.is_full_access());

CREATE POLICY "alertas_config_insert" ON public.alertas_config
    FOR INSERT WITH CHECK (public.is_full_access());

CREATE POLICY "alertas_config_delete" ON public.alertas_config
    FOR DELETE USING (public.is_full_access());
*/

-- =============================================
-- PASO 5-9: Arreglar políticas de varias tablas
-- =============================================
-- COMENTADO: Estas tablas no existen en este punto de las migraciones
-- Las políticas correctas se crean junto con las tablas en sus respectivas migraciones

/*
DROP POLICY IF EXISTS "notificaciones_select_admin" ON public.notificaciones;
DROP POLICY IF EXISTS "notificaciones_delete_admin" ON public.notificaciones;
DROP POLICY IF EXISTS "notificaciones_insert_admin" ON public.notificaciones;
DROP POLICY IF EXISTS "notificaciones_update_admin" ON public.notificaciones;

CREATE POLICY "notificaciones_select_admin" ON public.notificaciones
    FOR SELECT USING (public.is_full_access());

CREATE POLICY "notificaciones_delete_admin" ON public.notificaciones
    FOR DELETE USING (public.is_full_access());

DROP POLICY IF EXISTS "facturas_update_admin" ON storage.objects;
DROP POLICY IF EXISTS "facturas_delete_admin" ON storage.objects;

CREATE POLICY "facturas_update_admin" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'facturas'
        AND public.is_full_access()
    );

CREATE POLICY "facturas_delete_admin" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'facturas'
        AND public.is_full_access()
    );

DROP POLICY IF EXISTS "facturacion_mensual_delete_admin" ON public.client_facturacion_mensual;

CREATE POLICY "facturacion_mensual_delete_admin" ON public.client_facturacion_mensual
    FOR DELETE USING (public.is_full_access());

DROP POLICY IF EXISTS "facturas_detalle_delete" ON public.client_facturas_detalle;

CREATE POLICY "facturas_detalle_delete" ON public.client_facturas_detalle
    FOR DELETE USING (public.is_full_access());

DROP POLICY IF EXISTS "cuota_mensual_delete_admin" ON public.client_cuota_mensual;

CREATE POLICY "cuota_mensual_delete_admin" ON public.client_cuota_mensual
    FOR DELETE USING (public.is_full_access());
*/

-- =============================================
-- VERIFICACIÓN
-- =============================================
-- Después de ejecutar esta migración, verificar con:
-- SELECT public.is_full_access(); -- Debería retornar TRUE para roles admin/contadora_principal/desarrollo/comunicadora
