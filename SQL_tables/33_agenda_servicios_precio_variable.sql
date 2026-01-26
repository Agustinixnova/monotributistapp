-- =====================================================
-- MIGRACIÓN: Agregar precio variable a servicios
-- Permite marcar servicios con precio "desde" que puede aumentar
-- =====================================================

-- Agregar columna precio_variable
ALTER TABLE public.agenda_servicios
ADD COLUMN IF NOT EXISTS precio_variable BOOLEAN DEFAULT false;

-- Comentario
COMMENT ON COLUMN public.agenda_servicios.precio_variable IS 'Si es true, el precio es un precio base/desde que puede aumentar con adicionales';
