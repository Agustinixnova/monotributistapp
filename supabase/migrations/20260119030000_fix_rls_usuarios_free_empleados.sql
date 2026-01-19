-- =====================================================
-- MIGRACIÓN: Arreglar RLS para permitir creación de empleados
-- Fecha: 2026-01-19
-- Descripción:
--   - Función helper para verificar si el usuario es operador_gastos (dueño)
--   - Actualizar política INSERT para permitir que dueños creen empleados
--   - Permitir que dueños lean datos de sus empleados
-- =====================================================

-- Función para verificar si el usuario actual es un operador_gastos (dueño)
CREATE OR REPLACE FUNCTION public.is_operador_gastos()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.usuarios_free uf
        JOIN public.roles r ON uf.role_id = r.id
        WHERE uf.id = auth.uid()
        AND r.name = 'operador_gastos'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Función para verificar si un usuario es empleado del dueño actual
CREATE OR REPLACE FUNCTION public.is_mi_empleado(empleado_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.caja_empleados
        WHERE duenio_id = auth.uid()
        AND empleado_id = empleado_id
        AND activo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Actualizar política de SELECT para que dueños vean sus empleados
DROP POLICY IF EXISTS "usuarios_free_select_own" ON public.usuarios_free;
CREATE POLICY "usuarios_free_select_own" ON public.usuarios_free
    FOR SELECT TO authenticated
    USING (
        id = auth.uid()
        OR public.is_full_access()
        OR public.is_mi_empleado(id)
    );

-- Actualizar política de INSERT para permitir que dueños creen empleados
DROP POLICY IF EXISTS "usuarios_free_insert" ON public.usuarios_free;
CREATE POLICY "usuarios_free_insert" ON public.usuarios_free
    FOR INSERT TO authenticated
    WITH CHECK (
        id = auth.uid()  -- Puede insertarse a sí mismo (registro normal)
        OR public.is_operador_gastos()  -- O es un dueño creando empleado
    );

-- Actualizar política de UPDATE para que dueños puedan actualizar empleados
DROP POLICY IF EXISTS "usuarios_free_update_own" ON public.usuarios_free;
CREATE POLICY "usuarios_free_update_own" ON public.usuarios_free
    FOR UPDATE TO authenticated
    USING (
        id = auth.uid()
        OR public.is_full_access()
        OR public.is_mi_empleado(id)
    );

COMMENT ON FUNCTION public.is_operador_gastos() IS 'Verifica si el usuario actual es un operador_gastos (dueño)';
COMMENT ON FUNCTION public.is_mi_empleado(UUID) IS 'Verifica si un usuario es empleado del dueño actual';
