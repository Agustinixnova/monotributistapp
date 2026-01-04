-- =============================================
-- Migración: Row Level Security Policies
-- Fecha: 2025-01-04
-- =============================================

-- Función helper para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
    SELECT r.name
    FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Función helper para verificar si es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT public.get_user_role() = 'admin'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Función helper para verificar si es contadora (principal o secundario)
CREATE OR REPLACE FUNCTION public.is_contador()
RETURNS BOOLEAN AS $$
    SELECT public.get_user_role() IN ('admin', 'contadora_principal', 'contador_secundario')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- ROLES - Solo admin puede modificar
-- =============================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_select_all" ON public.roles
    FOR SELECT USING (TRUE);

CREATE POLICY "roles_insert_admin" ON public.roles
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "roles_update_admin" ON public.roles
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "roles_delete_admin" ON public.roles
    FOR DELETE USING (public.is_admin() AND is_system = FALSE);

-- =============================================
-- MODULES - Solo admin puede modificar
-- =============================================
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modules_select_all" ON public.modules
    FOR SELECT USING (TRUE);

CREATE POLICY "modules_insert_admin" ON public.modules
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "modules_update_admin" ON public.modules
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "modules_delete_admin" ON public.modules
    FOR DELETE USING (public.is_admin());

-- =============================================
-- ROLE_DEFAULT_MODULES - Solo admin puede modificar
-- =============================================
ALTER TABLE public.role_default_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_default_modules_select_all" ON public.role_default_modules
    FOR SELECT USING (TRUE);

CREATE POLICY "role_default_modules_insert_admin" ON public.role_default_modules
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "role_default_modules_update_admin" ON public.role_default_modules
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "role_default_modules_delete_admin" ON public.role_default_modules
    FOR DELETE USING (public.is_admin());

-- =============================================
-- PROFILES - Usuarios ven su perfil, contadores ven sus clientes, admin ve todo
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver su propio perfil
-- Contadores ven sus clientes asignados
-- Admin y contadora_principal ven todo
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT USING (
        id = auth.uid()
        OR public.get_user_role() IN ('admin', 'contadora_principal')
        OR (public.get_user_role() = 'contador_secundario' AND assigned_to = auth.uid())
    );

-- Solo admin y contadora_principal pueden crear perfiles
CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT WITH CHECK (
        public.get_user_role() IN ('admin', 'contadora_principal')
    );

-- Usuarios pueden editar su propio perfil (campos limitados via aplicación)
-- Admin y contadora_principal pueden editar cualquiera
CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE USING (
        id = auth.uid()
        OR public.get_user_role() IN ('admin', 'contadora_principal')
    );

-- Solo admin puede eliminar perfiles
CREATE POLICY "profiles_delete" ON public.profiles
    FOR DELETE USING (public.is_admin());

-- =============================================
-- USER_MODULE_ACCESS - Admin y contadora_principal pueden modificar
-- =============================================
ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_module_access_select" ON public.user_module_access
    FOR SELECT USING (
        user_id = auth.uid()
        OR public.get_user_role() IN ('admin', 'contadora_principal')
    );

CREATE POLICY "user_module_access_insert" ON public.user_module_access
    FOR INSERT WITH CHECK (
        public.get_user_role() IN ('admin', 'contadora_principal')
    );

CREATE POLICY "user_module_access_update" ON public.user_module_access
    FOR UPDATE USING (
        public.get_user_role() IN ('admin', 'contadora_principal')
    );

CREATE POLICY "user_module_access_delete" ON public.user_module_access
    FOR DELETE USING (
        public.get_user_role() IN ('admin', 'contadora_principal')
    );

-- =============================================
-- CLIENT_FISCAL_DATA - Mismo criterio que profiles
-- =============================================
ALTER TABLE public.client_fiscal_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_fiscal_data_select" ON public.client_fiscal_data
    FOR SELECT USING (
        user_id = auth.uid()
        OR public.get_user_role() IN ('admin', 'contadora_principal')
        OR (public.get_user_role() = 'contador_secundario' AND EXISTS (
            SELECT 1 FROM public.profiles WHERE id = client_fiscal_data.user_id AND assigned_to = auth.uid()
        ))
    );

CREATE POLICY "client_fiscal_data_insert" ON public.client_fiscal_data
    FOR INSERT WITH CHECK (
        public.get_user_role() IN ('admin', 'contadora_principal')
    );

CREATE POLICY "client_fiscal_data_update" ON public.client_fiscal_data
    FOR UPDATE USING (
        public.get_user_role() IN ('admin', 'contadora_principal')
    );

CREATE POLICY "client_fiscal_data_delete" ON public.client_fiscal_data
    FOR DELETE USING (public.is_admin());

-- =============================================
-- MONOTRIBUTO_CATEGORIAS - Lectura pública, solo admin modifica
-- =============================================
ALTER TABLE public.monotributo_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monotributo_categorias_select_all" ON public.monotributo_categorias
    FOR SELECT USING (TRUE);

CREATE POLICY "monotributo_categorias_insert_admin" ON public.monotributo_categorias
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "monotributo_categorias_update_admin" ON public.monotributo_categorias
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "monotributo_categorias_delete_admin" ON public.monotributo_categorias
    FOR DELETE USING (public.is_admin());
