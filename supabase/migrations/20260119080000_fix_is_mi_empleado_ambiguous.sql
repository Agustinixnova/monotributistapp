-- =====================================================
-- FIX: Función is_mi_empleado con columna ambigua
-- El parámetro y la columna tenían el mismo nombre
-- =====================================================

-- 1. Eliminar políticas que dependen de la función
DROP POLICY IF EXISTS "usuarios_free_select_own" ON public.usuarios_free;
DROP POLICY IF EXISTS "usuarios_free_update_own" ON public.usuarios_free;

-- 2. Eliminar la función existente
DROP FUNCTION IF EXISTS public.is_mi_empleado(UUID);

-- 3. Recrear con el nombre de parámetro diferente para evitar ambigüedad
CREATE FUNCTION public.is_mi_empleado(p_empleado_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.caja_empleados
        WHERE duenio_id = auth.uid()
        AND caja_empleados.empleado_id = p_empleado_id
        AND activo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_mi_empleado(UUID) IS 'Verifica si un usuario es empleado del dueño actual';

-- 4. Recrear las políticas
CREATE POLICY "usuarios_free_select_own" ON public.usuarios_free
    FOR SELECT TO authenticated
    USING (
        id = auth.uid()
        OR public.is_full_access()
        OR public.is_mi_empleado(id)
    );

CREATE POLICY "usuarios_free_update_own" ON public.usuarios_free
    FOR UPDATE TO authenticated
    USING (
        id = auth.uid()
        OR public.is_full_access()
        OR public.is_mi_empleado(id)
    );
