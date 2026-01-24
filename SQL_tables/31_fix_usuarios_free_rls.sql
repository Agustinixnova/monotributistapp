-- =====================================================
-- FIX: Actualizar RLS de usuarios_free para permitir ver empleados
-- Fecha: 2026-01-24
-- Problema: Dueños no pueden ver datos de sus empleados
-- =====================================================

-- Eliminar política restrictiva actual
DROP POLICY IF EXISTS "usuarios_free_select_own" ON public.usuarios_free;

-- Nueva política que permite:
-- 1. Ver tu propio registro
-- 2. Full access (admin, desarrollo, etc.)
-- 3. Dueños pueden ver a sus empleados vinculados via caja_empleados
CREATE POLICY "usuarios_free_select" ON public.usuarios_free
    FOR SELECT TO authenticated
    USING (
        id = auth.uid()
        OR public.is_full_access()
        OR EXISTS (
            SELECT 1 FROM public.caja_empleados ce
            WHERE ce.duenio_id = auth.uid()
            AND ce.empleado_id = usuarios_free.id
            AND ce.activo = true
        )
    );

COMMENT ON POLICY "usuarios_free_select" ON public.usuarios_free
    IS 'Permite ver: propio registro, full_access, o empleados vinculados al dueño';
