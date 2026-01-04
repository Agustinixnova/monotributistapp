-- =============================================
-- Migración: Agregar columnas de dirección a profiles
-- Descripción: Agrega direccion, localidad, codigo_postal y provincia
-- Fecha: 2026-01-04
-- =============================================

-- Agregar columnas de dirección a profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS localidad TEXT,
ADD COLUMN IF NOT EXISTS codigo_postal TEXT,
ADD COLUMN IF NOT EXISTS provincia TEXT;

-- Comentarios
COMMENT ON COLUMN public.profiles.direccion IS 'Dirección del usuario';
COMMENT ON COLUMN public.profiles.localidad IS 'Localidad/Ciudad del usuario';
COMMENT ON COLUMN public.profiles.codigo_postal IS 'Código postal del usuario';
COMMENT ON COLUMN public.profiles.provincia IS 'Provincia del usuario';

-- Crear índice para búsquedas por provincia (opcional, útil para filtros)
CREATE INDEX IF NOT EXISTS idx_profiles_provincia ON public.profiles(provincia);
