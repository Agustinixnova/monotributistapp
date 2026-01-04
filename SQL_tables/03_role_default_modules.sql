-- =============================================
-- Tabla: role_default_modules
-- Descripción: Módulos por defecto asignados a cada rol
-- =============================================

CREATE TABLE IF NOT EXISTS public.role_default_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, module_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_role_default_modules_role_id ON public.role_default_modules(role_id);
CREATE INDEX IF NOT EXISTS idx_role_default_modules_module_id ON public.role_default_modules(module_id);

-- Comentarios
COMMENT ON TABLE public.role_default_modules IS 'Módulos por defecto que se asignan automáticamente a cada rol';
