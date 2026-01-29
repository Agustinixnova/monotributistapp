-- ============================================
-- Migración: Configuración de modalidades por servicio
-- Permite definir disponibilidad y precios diferentes
-- para cada modalidad (local, domicilio, videollamada)
-- ============================================

-- Agregar columnas de disponibilidad por modalidad
-- Por defecto todos los servicios existentes quedan disponibles en todas las modalidades
ALTER TABLE public.agenda_servicios
ADD COLUMN IF NOT EXISTS disponible_local BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS disponible_domicilio BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS disponible_videollamada BOOLEAN DEFAULT true;

-- Agregar columnas de precio por modalidad
-- NULL significa que usa el precio base del servicio
ALTER TABLE public.agenda_servicios
ADD COLUMN IF NOT EXISTS precio_local DECIMAL(12,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS precio_domicilio DECIMAL(12,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS precio_videollamada DECIMAL(12,2) DEFAULT NULL;

-- Comentarios descriptivos
COMMENT ON COLUMN public.agenda_servicios.disponible_local IS 'Si el servicio está disponible para turnos en el local';
COMMENT ON COLUMN public.agenda_servicios.disponible_domicilio IS 'Si el servicio está disponible para turnos a domicilio';
COMMENT ON COLUMN public.agenda_servicios.disponible_videollamada IS 'Si el servicio está disponible para videollamadas';

COMMENT ON COLUMN public.agenda_servicios.precio_local IS 'Precio específico para local (NULL = usa precio base)';
COMMENT ON COLUMN public.agenda_servicios.precio_domicilio IS 'Precio específico para domicilio (NULL = usa precio base)';
COMMENT ON COLUMN public.agenda_servicios.precio_videollamada IS 'Precio específico para videollamada (NULL = usa precio base)';

-- Índices para filtrar servicios por modalidad
CREATE INDEX IF NOT EXISTS idx_servicios_local ON public.agenda_servicios(duenio_id, disponible_local) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_servicios_domicilio ON public.agenda_servicios(duenio_id, disponible_domicilio) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_servicios_videollamada ON public.agenda_servicios(duenio_id, disponible_videollamada) WHERE activo = true;
