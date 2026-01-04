-- =============================================
-- Tabla: roles
-- Descripción: Roles del sistema para control de acceso
-- =============================================

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);

-- Comentarios
COMMENT ON TABLE public.roles IS 'Roles del sistema para control de acceso';
COMMENT ON COLUMN public.roles.name IS 'Identificador único del rol: admin, contadora_principal, contador_secundario, monotributista, responsable_inscripto, operador_gastos';
COMMENT ON COLUMN public.roles.is_system IS 'Si es TRUE, el rol no puede ser eliminado';
