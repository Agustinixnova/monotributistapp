-- =====================================================
-- Migración: Agregar horarios de acceso para empleados
-- Fecha: 2026-01-21
-- =====================================================
-- Estructura del campo horarios_acceso (JSONB):
-- {
--   "lunes": [
--     {"desde": "08:00", "hasta": "10:00"},
--     {"desde": "14:00", "hasta": "18:00"}
--   ],
--   "miercoles": [
--     {"desde": "07:00", "hasta": "09:00"},
--     {"desde": "13:00", "hasta": "15:00"},
--     {"desde": "17:00", "hasta": "20:00"}
--   ]
-- }
-- Si es NULL o {}, el empleado tiene acceso sin restricciones de horario
-- Los días son: lunes, martes, miercoles, jueves, viernes, sabado, domingo
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Agregando campo horarios_acceso a caja_empleados';
  RAISE NOTICE '========================================';

  -- Agregar columna si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'caja_empleados'
    AND column_name = 'horarios_acceso'
  ) THEN
    ALTER TABLE public.caja_empleados
    ADD COLUMN horarios_acceso JSONB DEFAULT NULL;

    RAISE NOTICE 'Columna horarios_acceso agregada';
  ELSE
    RAISE NOTICE 'Columna horarios_acceso ya existe';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- Comentario documentando el campo
COMMENT ON COLUMN public.caja_empleados.horarios_acceso IS 'Horarios de acceso del empleado.
Formato: {"dia": [{"desde": "HH:MM", "hasta": "HH:MM"}, ...]}
Días válidos: lunes, martes, miercoles, jueves, viernes, sabado, domingo
Si es NULL, el empleado tiene acceso sin restricciones de horario.
Zona horaria: UTC-3 (Argentina)';
