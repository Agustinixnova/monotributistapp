-- =============================================
-- TABLAS DE SOPORTE
-- Sistema de soporte y sesiones remotas
-- =============================================

-- 1. Tabla soporte_sesiones
CREATE TABLE IF NOT EXISTS public.soporte_sesiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(6) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES auth.users(id),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'activa', 'finalizada', 'expirada')),
    jitsi_room VARCHAR(100),
    datos_capturados JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    connected_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

-- 2. Tabla soporte_logs
CREATE TABLE IF NOT EXISTS public.soporte_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('sesion_creada', 'sesion_iniciada', 'sesion_finalizada', 'captura_pantalla', 'accion_admin', 'error')),
    admin_id UUID REFERENCES auth.users(id),
    target_user_id UUID REFERENCES auth.users(id),
    sesion_id UUID REFERENCES public.soporte_sesiones(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_soporte_sesiones_codigo ON public.soporte_sesiones(codigo);
CREATE INDEX IF NOT EXISTS idx_soporte_sesiones_user ON public.soporte_sesiones(user_id);
CREATE INDEX IF NOT EXISTS idx_soporte_sesiones_estado ON public.soporte_sesiones(estado);
CREATE INDEX IF NOT EXISTS idx_soporte_logs_sesion ON public.soporte_logs(sesion_id);
CREATE INDEX IF NOT EXISTS idx_soporte_logs_tipo ON public.soporte_logs(tipo);
CREATE INDEX IF NOT EXISTS idx_soporte_logs_created ON public.soporte_logs(created_at DESC);

COMMENT ON TABLE public.soporte_sesiones IS 'Sesiones de soporte remoto entre admin y usuarios';
COMMENT ON TABLE public.soporte_logs IS 'Registro de eventos del sistema de soporte';

-- RLS
ALTER TABLE public.soporte_sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soporte_logs ENABLE ROW LEVEL SECURITY;

-- Políticas soporte_sesiones
-- Admin puede ver todas
CREATE POLICY "soporte_sesiones_select_admin" ON public.soporte_sesiones
    FOR SELECT USING (public.is_full_access());

-- Usuario puede ver solo las suyas
CREATE POLICY "soporte_sesiones_select_own" ON public.soporte_sesiones
    FOR SELECT USING (user_id = auth.uid());

-- Solo admin puede crear/modificar
CREATE POLICY "soporte_sesiones_insert_admin" ON public.soporte_sesiones
    FOR INSERT WITH CHECK (public.is_full_access());

CREATE POLICY "soporte_sesiones_update_admin" ON public.soporte_sesiones
    FOR UPDATE USING (public.is_full_access());

CREATE POLICY "soporte_sesiones_delete_admin" ON public.soporte_sesiones
    FOR DELETE USING (public.is_full_access());

-- Políticas soporte_logs
-- Solo admin puede ver logs
CREATE POLICY "soporte_logs_select_admin" ON public.soporte_logs
    FOR SELECT USING (public.is_full_access());

-- Solo admin puede insertar logs
CREATE POLICY "soporte_logs_insert_admin" ON public.soporte_logs
    FOR INSERT WITH CHECK (public.is_full_access());
