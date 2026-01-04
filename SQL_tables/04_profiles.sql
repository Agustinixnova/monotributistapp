-- =============================================
-- Tabla: profiles
-- Descripción: Perfiles de usuario (extiende auth.users)
-- =============================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    telefono TEXT,
    whatsapp TEXT,
    dni TEXT,
    role_id UUID NOT NULL REFERENCES public.roles(id),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    notas_internas TEXT,
    direccion TEXT,
    localidad TEXT,
    codigo_postal TEXT,
    provincia TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_to ON public.profiles(assigned_to);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_dni ON public.profiles(dni);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE public.profiles IS 'Perfiles de usuario extendiendo auth.users de Supabase';
COMMENT ON COLUMN public.profiles.assigned_to IS 'Contador asignado al cliente';
COMMENT ON COLUMN public.profiles.notas_internas IS 'Notas solo visibles para contadores y admin';
COMMENT ON COLUMN public.profiles.created_by IS 'Usuario que creó este perfil';
