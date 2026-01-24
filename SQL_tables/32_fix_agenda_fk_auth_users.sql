-- =====================================================
-- FIX: Cambiar todos los FK de agenda_* para usar auth.users
-- Fecha: 2026-01-24
-- Problema: No todos los usuarios están en usuarios_free
-- =====================================================

-- =====================================================
-- agenda_servicios
-- =====================================================
ALTER TABLE public.agenda_servicios
DROP CONSTRAINT IF EXISTS agenda_servicios_duenio_id_fkey;

ALTER TABLE public.agenda_servicios
ADD CONSTRAINT agenda_servicios_duenio_id_fkey
FOREIGN KEY (duenio_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =====================================================
-- agenda_servicio_profesionales
-- =====================================================
ALTER TABLE public.agenda_servicio_profesionales
DROP CONSTRAINT IF EXISTS agenda_servicio_profesionales_profesional_id_fkey;

ALTER TABLE public.agenda_servicio_profesionales
ADD CONSTRAINT agenda_servicio_profesionales_profesional_id_fkey
FOREIGN KEY (profesional_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =====================================================
-- agenda_clientes
-- =====================================================
ALTER TABLE public.agenda_clientes
DROP CONSTRAINT IF EXISTS agenda_clientes_duenio_id_fkey;

ALTER TABLE public.agenda_clientes
DROP CONSTRAINT IF EXISTS agenda_clientes_creado_por_fkey;

ALTER TABLE public.agenda_clientes
ADD CONSTRAINT agenda_clientes_duenio_id_fkey
FOREIGN KEY (duenio_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.agenda_clientes
ADD CONSTRAINT agenda_clientes_creado_por_fkey
FOREIGN KEY (creado_por) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =====================================================
-- agenda_disponibilidad
-- =====================================================
ALTER TABLE public.agenda_disponibilidad
DROP CONSTRAINT IF EXISTS agenda_disponibilidad_profesional_id_fkey;

ALTER TABLE public.agenda_disponibilidad
ADD CONSTRAINT agenda_disponibilidad_profesional_id_fkey
FOREIGN KEY (profesional_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =====================================================
-- agenda_excepciones
-- =====================================================
ALTER TABLE public.agenda_excepciones
DROP CONSTRAINT IF EXISTS agenda_excepciones_profesional_id_fkey;

ALTER TABLE public.agenda_excepciones
ADD CONSTRAINT agenda_excepciones_profesional_id_fkey
FOREIGN KEY (profesional_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =====================================================
-- agenda_turnos
-- =====================================================
ALTER TABLE public.agenda_turnos
DROP CONSTRAINT IF EXISTS agenda_turnos_duenio_id_fkey;

ALTER TABLE public.agenda_turnos
DROP CONSTRAINT IF EXISTS agenda_turnos_profesional_id_fkey;

ALTER TABLE public.agenda_turnos
ADD CONSTRAINT agenda_turnos_duenio_id_fkey
FOREIGN KEY (duenio_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.agenda_turnos
ADD CONSTRAINT agenda_turnos_profesional_id_fkey
FOREIGN KEY (profesional_id) REFERENCES auth.users(id) ON DELETE CASCADE;
