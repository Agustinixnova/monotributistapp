-- =====================================================
-- MIGRACIÓN: Actualizar RLS de tablas de caja para empleados
-- Fecha: 2026-01-19
-- Descripción:
--   Permite que los empleados accedan a los datos de caja de sus dueños
-- =====================================================

-- Función helper: verifica si el usuario actual puede acceder a datos de un user_id
-- Retorna true si:
--   1. user_id es el propio usuario (auth.uid())
--   2. El usuario actual es empleado activo del user_id
CREATE OR REPLACE FUNCTION public.puede_acceder_caja(owner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Si es el propio usuario
    IF owner_id = auth.uid() THEN
        RETURN TRUE;
    END IF;

    -- Si es empleado activo de ese dueño
    RETURN EXISTS (
        SELECT 1
        FROM public.caja_empleados
        WHERE duenio_id = owner_id
        AND empleado_id = auth.uid()
        AND activo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.puede_acceder_caja(UUID) IS 'Verifica si el usuario actual puede acceder a datos de caja del user_id especificado';

-- =====================================================
-- ACTUALIZAR POLÍTICAS DE caja_movimientos
-- =====================================================

DROP POLICY IF EXISTS "caja_movimientos_select" ON public.caja_movimientos;
CREATE POLICY "caja_movimientos_select" ON public.caja_movimientos
    FOR SELECT TO authenticated
    USING (public.puede_acceder_caja(user_id));

DROP POLICY IF EXISTS "caja_movimientos_insert" ON public.caja_movimientos;
CREATE POLICY "caja_movimientos_insert" ON public.caja_movimientos
    FOR INSERT TO authenticated
    WITH CHECK (public.puede_acceder_caja(user_id));

DROP POLICY IF EXISTS "caja_movimientos_update" ON public.caja_movimientos;
CREATE POLICY "caja_movimientos_update" ON public.caja_movimientos
    FOR UPDATE TO authenticated
    USING (public.puede_acceder_caja(user_id));

DROP POLICY IF EXISTS "caja_movimientos_delete" ON public.caja_movimientos;
CREATE POLICY "caja_movimientos_delete" ON public.caja_movimientos
    FOR DELETE TO authenticated
    USING (public.puede_acceder_caja(user_id));

-- =====================================================
-- ACTUALIZAR POLÍTICAS DE caja_cierres
-- =====================================================

DROP POLICY IF EXISTS "caja_cierres_select" ON public.caja_cierres;
CREATE POLICY "caja_cierres_select" ON public.caja_cierres
    FOR SELECT TO authenticated
    USING (public.puede_acceder_caja(user_id));

DROP POLICY IF EXISTS "caja_cierres_insert" ON public.caja_cierres;
CREATE POLICY "caja_cierres_insert" ON public.caja_cierres
    FOR INSERT TO authenticated
    WITH CHECK (public.puede_acceder_caja(user_id));

DROP POLICY IF EXISTS "caja_cierres_update" ON public.caja_cierres;
CREATE POLICY "caja_cierres_update" ON public.caja_cierres
    FOR UPDATE TO authenticated
    USING (public.puede_acceder_caja(user_id));

DROP POLICY IF EXISTS "caja_cierres_delete" ON public.caja_cierres;
CREATE POLICY "caja_cierres_delete" ON public.caja_cierres
    FOR DELETE TO authenticated
    USING (public.puede_acceder_caja(user_id));

-- =====================================================
-- ACTUALIZAR POLÍTICAS DE caja_categorias
-- =====================================================

DROP POLICY IF EXISTS "caja_categorias_select" ON public.caja_categorias;
CREATE POLICY "caja_categorias_select" ON public.caja_categorias
    FOR SELECT TO authenticated
    USING (es_sistema = true OR public.puede_acceder_caja(user_id));

DROP POLICY IF EXISTS "caja_categorias_insert" ON public.caja_categorias;
CREATE POLICY "caja_categorias_insert" ON public.caja_categorias
    FOR INSERT TO authenticated
    WITH CHECK (public.puede_acceder_caja(user_id) AND es_sistema = false);

DROP POLICY IF EXISTS "caja_categorias_update" ON public.caja_categorias;
CREATE POLICY "caja_categorias_update" ON public.caja_categorias
    FOR UPDATE TO authenticated
    USING (public.puede_acceder_caja(user_id) AND es_sistema = false);

DROP POLICY IF EXISTS "caja_categorias_delete" ON public.caja_categorias;
CREATE POLICY "caja_categorias_delete" ON public.caja_categorias
    FOR DELETE TO authenticated
    USING (public.puede_acceder_caja(user_id) AND es_sistema = false);

-- =====================================================
-- ACTUALIZAR POLÍTICAS DE caja_metodos_pago
-- =====================================================

DROP POLICY IF EXISTS "caja_metodos_select" ON public.caja_metodos_pago;
CREATE POLICY "caja_metodos_select" ON public.caja_metodos_pago
    FOR SELECT TO authenticated
    USING (es_sistema = true OR public.puede_acceder_caja(user_id));

DROP POLICY IF EXISTS "caja_metodos_insert" ON public.caja_metodos_pago;
CREATE POLICY "caja_metodos_insert" ON public.caja_metodos_pago
    FOR INSERT TO authenticated
    WITH CHECK (public.puede_acceder_caja(user_id) AND es_sistema = false);

DROP POLICY IF EXISTS "caja_metodos_update" ON public.caja_metodos_pago;
CREATE POLICY "caja_metodos_update" ON public.caja_metodos_pago
    FOR UPDATE TO authenticated
    USING (public.puede_acceder_caja(user_id) AND es_sistema = false);

DROP POLICY IF EXISTS "caja_metodos_delete" ON public.caja_metodos_pago;
CREATE POLICY "caja_metodos_delete" ON public.caja_metodos_pago
    FOR DELETE TO authenticated
    USING (public.puede_acceder_caja(user_id) AND es_sistema = false);

-- =====================================================
-- ACTUALIZAR POLÍTICAS DE caja_arqueos
-- =====================================================

DROP POLICY IF EXISTS "caja_arqueos_select" ON public.caja_arqueos;
CREATE POLICY "caja_arqueos_select" ON public.caja_arqueos
    FOR SELECT TO authenticated
    USING (public.puede_acceder_caja(user_id));

DROP POLICY IF EXISTS "caja_arqueos_insert" ON public.caja_arqueos;
CREATE POLICY "caja_arqueos_insert" ON public.caja_arqueos
    FOR INSERT TO authenticated
    WITH CHECK (public.puede_acceder_caja(user_id));

DROP POLICY IF EXISTS "caja_arqueos_update" ON public.caja_arqueos;
CREATE POLICY "caja_arqueos_update" ON public.caja_arqueos
    FOR UPDATE TO authenticated
    USING (public.puede_acceder_caja(user_id));

DROP POLICY IF EXISTS "caja_arqueos_delete" ON public.caja_arqueos;
CREATE POLICY "caja_arqueos_delete" ON public.caja_arqueos
    FOR DELETE TO authenticated
    USING (public.puede_acceder_caja(user_id));

-- =====================================================
-- ACTUALIZAR POLÍTICAS DE caja_configuracion
-- =====================================================

DROP POLICY IF EXISTS "caja_configuracion_select" ON public.caja_configuracion;
CREATE POLICY "caja_configuracion_select" ON public.caja_configuracion
    FOR SELECT TO authenticated
    USING (public.puede_acceder_caja(user_id));

DROP POLICY IF EXISTS "caja_configuracion_insert" ON public.caja_configuracion;
CREATE POLICY "caja_configuracion_insert" ON public.caja_configuracion
    FOR INSERT TO authenticated
    WITH CHECK (public.puede_acceder_caja(user_id));

DROP POLICY IF EXISTS "caja_configuracion_update" ON public.caja_configuracion;
CREATE POLICY "caja_configuracion_update" ON public.caja_configuracion
    FOR UPDATE TO authenticated
    USING (public.puede_acceder_caja(user_id));

DROP POLICY IF EXISTS "caja_configuracion_delete" ON public.caja_configuracion;
CREATE POLICY "caja_configuracion_delete" ON public.caja_configuracion
    FOR DELETE TO authenticated
    USING (public.puede_acceder_caja(user_id));
