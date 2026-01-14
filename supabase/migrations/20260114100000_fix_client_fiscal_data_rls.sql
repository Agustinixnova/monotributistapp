-- =============================================
-- Migración: Fix client_fiscal_data RLS
-- Fecha: 2026-01-14
-- Descripción: Actualiza políticas para usar is_full_access()
-- =============================================

-- =============================================
-- PASO 1: Actualizar políticas de client_fiscal_data
-- Para incluir roles desarrollo y comunicadora
-- =============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "client_fiscal_data_select" ON public.client_fiscal_data;
DROP POLICY IF EXISTS "client_fiscal_data_insert" ON public.client_fiscal_data;
DROP POLICY IF EXISTS "client_fiscal_data_update" ON public.client_fiscal_data;
DROP POLICY IF EXISTS "client_fiscal_data_delete" ON public.client_fiscal_data;

-- Recrear políticas usando is_full_access()
CREATE POLICY "client_fiscal_data_select" ON public.client_fiscal_data
    FOR SELECT USING (
        user_id = auth.uid()
        OR public.is_full_access()
        OR (public.get_user_role() = 'contador_secundario' AND EXISTS (
            SELECT 1 FROM public.profiles WHERE id = client_fiscal_data.user_id AND assigned_to = auth.uid()
        ))
    );

CREATE POLICY "client_fiscal_data_insert" ON public.client_fiscal_data
    FOR INSERT WITH CHECK (
        public.is_full_access()
    );

CREATE POLICY "client_fiscal_data_update" ON public.client_fiscal_data
    FOR UPDATE USING (
        public.is_full_access()
    );

CREATE POLICY "client_fiscal_data_delete" ON public.client_fiscal_data
    FOR DELETE USING (public.is_full_access());

-- =============================================
-- PASO 2: Actualizar políticas de profiles
-- Para incluir roles desarrollo y comunicadora
-- =============================================

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT USING (
        id = auth.uid()
        OR public.is_full_access()
        OR (public.get_user_role() = 'contador_secundario' AND assigned_to = auth.uid())
    );

CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT WITH CHECK (
        public.is_full_access()
    );

CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE USING (
        id = auth.uid()
        OR public.is_full_access()
    );

-- =============================================
-- PASO 3: Actualizar user_module_access
-- =============================================

DROP POLICY IF EXISTS "user_module_access_select" ON public.user_module_access;
DROP POLICY IF EXISTS "user_module_access_insert" ON public.user_module_access;
DROP POLICY IF EXISTS "user_module_access_update" ON public.user_module_access;
DROP POLICY IF EXISTS "user_module_access_delete" ON public.user_module_access;

CREATE POLICY "user_module_access_select" ON public.user_module_access
    FOR SELECT USING (
        user_id = auth.uid()
        OR public.is_full_access()
    );

CREATE POLICY "user_module_access_insert" ON public.user_module_access
    FOR INSERT WITH CHECK (
        public.is_full_access()
    );

CREATE POLICY "user_module_access_update" ON public.user_module_access
    FOR UPDATE USING (
        public.is_full_access()
    );

CREATE POLICY "user_module_access_delete" ON public.user_module_access
    FOR DELETE USING (
        public.is_full_access()
    );
