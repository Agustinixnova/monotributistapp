-- =====================================================
-- MIGRACIÓN: Trazabilidad y Mejora de Índices
-- Fecha: 2026-01-29
-- =====================================================
--
-- CONVENCIÓN DE NOMENCLATURA:
-- duenio_id = tenant_id (identificador del negocio/dueño)
--
-- Este campo actúa como tenant_id para multi-tenancy.
-- Se mantiene "duenio_id" por consistencia con el código existente.
--
-- Diferencia importante:
-- - duenio_id / tenant_id: dueño del negocio (a quién pertenecen los datos)
-- - profesional_id: quién atiende/realiza el servicio
-- - created_by: quién cargó el registro en el sistema
-- - updated_by: quién modificó el registro por última vez
-- =====================================================

-- =====================================================
-- 1. AGREGAR COLUMNAS DE TRAZABILIDAD
-- =====================================================

-- agenda_turnos: agregar created_by y updated_by
ALTER TABLE public.agenda_turnos
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

ALTER TABLE public.agenda_turnos
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.agenda_turnos.created_by IS 'Usuario que creó el turno (puede ser dueño o empleado)';
COMMENT ON COLUMN public.agenda_turnos.updated_by IS 'Usuario que modificó el turno por última vez';
COMMENT ON COLUMN public.agenda_turnos.duenio_id IS 'Tenant ID - Dueño del negocio al que pertenece el turno';

-- agenda_turno_pagos: agregar created_by (quién registró el pago)
ALTER TABLE public.agenda_turno_pagos
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.agenda_turno_pagos.created_by IS 'Usuario que registró el pago (puede ser dueño o empleado)';

-- agenda_servicios: agregar created_by y updated_by
ALTER TABLE public.agenda_servicios
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

ALTER TABLE public.agenda_servicios
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.agenda_servicios.created_by IS 'Usuario que creó el servicio';
COMMENT ON COLUMN public.agenda_servicios.updated_by IS 'Usuario que modificó el servicio por última vez';
COMMENT ON COLUMN public.agenda_servicios.duenio_id IS 'Tenant ID - Dueño del negocio al que pertenece el servicio';

-- agenda_clientes: agregar updated_by (ya tiene creado_por)
ALTER TABLE public.agenda_clientes
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.agenda_clientes.creado_por IS 'Usuario que creó el cliente (created_by)';
COMMENT ON COLUMN public.agenda_clientes.updated_by IS 'Usuario que modificó el cliente por última vez';
COMMENT ON COLUMN public.agenda_clientes.duenio_id IS 'Tenant ID - Dueño del negocio al que pertenece el cliente';

-- =====================================================
-- 2. TRIGGERS PARA updated_by AUTOMÁTICO
-- =====================================================

-- Función genérica para setear updated_by
CREATE OR REPLACE FUNCTION public.set_updated_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_by = auth.uid();
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en agenda_turnos
DROP TRIGGER IF EXISTS tr_agenda_turnos_updated_by ON public.agenda_turnos;
CREATE TRIGGER tr_agenda_turnos_updated_by
    BEFORE UPDATE ON public.agenda_turnos
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

-- Trigger en agenda_servicios
DROP TRIGGER IF EXISTS tr_agenda_servicios_updated_by ON public.agenda_servicios;
CREATE TRIGGER tr_agenda_servicios_updated_by
    BEFORE UPDATE ON public.agenda_servicios
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

-- Trigger en agenda_clientes
DROP TRIGGER IF EXISTS tr_agenda_clientes_updated_by ON public.agenda_clientes;
CREATE TRIGGER tr_agenda_clientes_updated_by
    BEFORE UPDATE ON public.agenda_clientes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

-- =====================================================
-- 3. MEJORA DE ÍNDICES
-- =====================================================

-- agenda_turno_pagos: índice compuesto para consultas de pagos por turno y fecha
DROP INDEX IF EXISTS idx_agenda_turno_pagos_turno_fecha;
CREATE INDEX idx_agenda_turno_pagos_turno_fecha
ON public.agenda_turno_pagos(turno_id, fecha_pago DESC);

-- agenda_turnos: índice para búsquedas por estado y fecha (muy común)
DROP INDEX IF EXISTS idx_agenda_turnos_duenio_estado_fecha;
CREATE INDEX idx_agenda_turnos_duenio_estado_fecha
ON public.agenda_turnos(duenio_id, estado, fecha DESC);

-- agenda_turnos: índice para búsquedas por profesional y fecha
DROP INDEX IF EXISTS idx_agenda_turnos_profesional_fecha;
CREATE INDEX idx_agenda_turnos_profesional_fecha
ON public.agenda_turnos(profesional_id, fecha DESC);

-- agenda_clientes: índice para búsqueda por teléfono/whatsapp (común en reservas)
DROP INDEX IF EXISTS idx_agenda_clientes_duenio_whatsapp;
CREATE INDEX idx_agenda_clientes_duenio_whatsapp
ON public.agenda_clientes(duenio_id, whatsapp)
WHERE whatsapp IS NOT NULL;

-- =====================================================
-- 4. ACTUALIZAR REGISTROS EXISTENTES (opcional)
-- =====================================================
-- Setear created_by = duenio_id para registros existentes que no tienen created_by
-- Esto asume que los registros viejos fueron creados por el dueño

UPDATE public.agenda_turnos
SET created_by = duenio_id
WHERE created_by IS NULL;

UPDATE public.agenda_servicios
SET created_by = duenio_id
WHERE created_by IS NULL;

UPDATE public.agenda_turno_pagos p
SET created_by = t.duenio_id
FROM public.agenda_turnos t
WHERE p.turno_id = t.id AND p.created_by IS NULL;

-- =====================================================
-- 5. DOCUMENTACIÓN EN TABLA DE METADATOS (opcional)
-- =====================================================

COMMENT ON TABLE public.agenda_turnos IS
'Turnos/citas agendadas. duenio_id actúa como tenant_id para multi-tenancy.';

COMMENT ON TABLE public.agenda_servicios IS
'Catálogo de servicios del negocio. duenio_id actúa como tenant_id para multi-tenancy.';

COMMENT ON TABLE public.agenda_clientes IS
'Clientes de la agenda. duenio_id actúa como tenant_id para multi-tenancy.';

COMMENT ON TABLE public.agenda_turno_pagos IS
'Pagos asociados a turnos (señas, pagos finales, devoluciones).';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
