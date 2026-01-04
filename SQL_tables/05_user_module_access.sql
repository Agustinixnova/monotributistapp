-- =============================================
-- Tabla: user_module_access
-- Descripción: Accesos extra a módulos por usuario
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_module_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_module_access_user_id ON public.user_module_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_access_module_id ON public.user_module_access(module_id);

-- Comentarios
COMMENT ON TABLE public.user_module_access IS 'Accesos adicionales a módulos otorgados individualmente a usuarios';
COMMENT ON COLUMN public.user_module_access.granted_by IS 'Usuario que otorgó el acceso';
