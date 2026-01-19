-- =====================================================
-- TABLA: caja_configuracion
-- Configuración general de caja diaria por usuario
-- =====================================================

CREATE TABLE IF NOT EXISTS public.caja_configuracion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_negocio VARCHAR(100) DEFAULT 'Mi Negocio',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_caja_configuracion_user ON public.caja_configuracion(user_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.caja_configuracion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "caja_configuracion_select" ON public.caja_configuracion;
CREATE POLICY "caja_configuracion_select" ON public.caja_configuracion
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "caja_configuracion_insert" ON public.caja_configuracion;
CREATE POLICY "caja_configuracion_insert" ON public.caja_configuracion
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "caja_configuracion_update" ON public.caja_configuracion;
CREATE POLICY "caja_configuracion_update" ON public.caja_configuracion
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "caja_configuracion_delete" ON public.caja_configuracion;
CREATE POLICY "caja_configuracion_delete" ON public.caja_configuracion
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());
