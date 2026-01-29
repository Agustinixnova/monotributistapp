-- ============================================
-- Migración: Agregar campos de dirección a agenda_clientes
-- Para soportar servicios a domicilio
-- ============================================

-- Agregar columnas de dirección
ALTER TABLE public.agenda_clientes
ADD COLUMN IF NOT EXISTS direccion VARCHAR(255),
ADD COLUMN IF NOT EXISTS piso VARCHAR(10),
ADD COLUMN IF NOT EXISTS departamento VARCHAR(10),
ADD COLUMN IF NOT EXISTS localidad VARCHAR(100),
ADD COLUMN IF NOT EXISTS provincia VARCHAR(50),
ADD COLUMN IF NOT EXISTS indicaciones_ubicacion TEXT;

-- Comentarios
COMMENT ON COLUMN public.agenda_clientes.direccion IS 'Calle y número para servicios a domicilio';
COMMENT ON COLUMN public.agenda_clientes.piso IS 'Piso del edificio (opcional)';
COMMENT ON COLUMN public.agenda_clientes.departamento IS 'Número o letra de departamento (opcional)';
COMMENT ON COLUMN public.agenda_clientes.localidad IS 'Barrio o localidad';
COMMENT ON COLUMN public.agenda_clientes.provincia IS 'Provincia de Argentina';
COMMENT ON COLUMN public.agenda_clientes.indicaciones_ubicacion IS 'Indicaciones adicionales: timbre, portón, referencias';
