-- =============================================
-- FASE 1: Modalidades de Trabajo + Datos Negocio
-- =============================================
-- Fecha: 29-01-2026
-- Descripción: Soporte para diferentes modalidades de trabajo
--              (local, domicilio, videollamada) + datos de cobro

-- =============================================
-- 1. AMPLIAR agenda_negocio
-- =============================================

-- Modalidades de trabajo (array para multi-selección)
-- Valores posibles: 'local', 'domicilio', 'videollamada'
ALTER TABLE public.agenda_negocio
ADD COLUMN IF NOT EXISTS modalidades_trabajo TEXT[] DEFAULT '{local}';

-- Datos de cobro
ALTER TABLE public.agenda_negocio
ADD COLUMN IF NOT EXISTS alias_pago TEXT;

ALTER TABLE public.agenda_negocio
ADD COLUMN IF NOT EXISTS cuit VARCHAR(11);

-- Dirección mejorada (piso y departamento)
ALTER TABLE public.agenda_negocio
ADD COLUMN IF NOT EXISTS piso TEXT;

ALTER TABLE public.agenda_negocio
ADD COLUMN IF NOT EXISTS departamento TEXT;

-- =============================================
-- 2. AMPLIAR agenda_clientes (para domicilio)
-- =============================================

ALTER TABLE public.agenda_clientes
ADD COLUMN IF NOT EXISTS direccion TEXT;

ALTER TABLE public.agenda_clientes
ADD COLUMN IF NOT EXISTS piso TEXT;

ALTER TABLE public.agenda_clientes
ADD COLUMN IF NOT EXISTS departamento TEXT;

ALTER TABLE public.agenda_clientes
ADD COLUMN IF NOT EXISTS localidad TEXT;

ALTER TABLE public.agenda_clientes
ADD COLUMN IF NOT EXISTS indicaciones_ubicacion TEXT;

-- =============================================
-- 3. AMPLIAR agenda_turnos
-- =============================================

-- Modalidad del turno específico
-- Valores: 'local', 'domicilio', 'videollamada'
ALTER TABLE public.agenda_turnos
ADD COLUMN IF NOT EXISTS modalidad TEXT DEFAULT 'local';

-- Link para videollamadas (Zoom, Meet, etc.)
ALTER TABLE public.agenda_turnos
ADD COLUMN IF NOT EXISTS link_videollamada TEXT;

-- =============================================
-- 4. COMENTARIOS
-- =============================================

COMMENT ON COLUMN public.agenda_negocio.modalidades_trabajo IS
'Array de modalidades habilitadas: local, domicilio, videollamada';

COMMENT ON COLUMN public.agenda_negocio.alias_pago IS
'Alias CBU/CVU para recibir pagos';

COMMENT ON COLUMN public.agenda_negocio.cuit IS
'CUIT del negocio/profesional';

COMMENT ON COLUMN public.agenda_clientes.direccion IS
'Dirección del cliente (para servicios a domicilio)';

COMMENT ON COLUMN public.agenda_clientes.indicaciones_ubicacion IS
'Indicaciones adicionales: timbre, portón, referencias';

COMMENT ON COLUMN public.agenda_turnos.modalidad IS
'Modalidad del turno: local, domicilio, videollamada';

COMMENT ON COLUMN public.agenda_turnos.link_videollamada IS
'URL de la videollamada (Zoom, Meet, etc.)';
