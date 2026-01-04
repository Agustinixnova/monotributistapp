-- =============================================
-- Tabla: modules
-- Descripción: Módulos/menú del sistema
-- =============================================

CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    route TEXT NOT NULL,
    parent_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    "order" INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_modules_slug ON public.modules(slug);
CREATE INDEX IF NOT EXISTS idx_modules_parent_id ON public.modules(parent_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON public.modules("order");

-- Comentarios
COMMENT ON TABLE public.modules IS 'Módulos/menú del sistema';
COMMENT ON COLUMN public.modules.slug IS 'Identificador URL-friendly del módulo';
COMMENT ON COLUMN public.modules.icon IS 'Nombre del icono de Lucide React';
COMMENT ON COLUMN public.modules.parent_id IS 'Para submódulos, referencia al módulo padre';
COMMENT ON COLUMN public.modules."order" IS 'Orden de aparición en el menú';
