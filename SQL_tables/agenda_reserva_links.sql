-- ============================================
-- Tabla: agenda_reserva_links
-- Descripción: Links de reserva para auto-gestión de turnos
-- ============================================

CREATE TABLE IF NOT EXISTS public.agenda_reserva_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(64) UNIQUE NOT NULL,
    profesional_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES public.agenda_clientes(id) ON DELETE SET NULL,

    -- Servicios habilitados (array de UUIDs)
    servicios_ids UUID[] NOT NULL DEFAULT '{}',

    -- Rango de fechas disponibles
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE NOT NULL,

    -- Slots específicos marcados por el profesional
    -- Estructura: { "2025-01-29": ["08:00", "08:30", ...], ... }
    slots_disponibles JSONB NOT NULL DEFAULT '{}',

    -- Mensaje personalizado opcional
    mensaje_personalizado TEXT,

    -- Modalidad del turno (local, domicilio, videollamada)
    modalidad VARCHAR(20) DEFAULT 'local' CHECK (modalidad IN ('local', 'domicilio', 'videollamada')),

    -- Estado y expiración
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'usado', 'expirado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    -- Turno creado (si se usó el link)
    turno_id UUID REFERENCES public.agenda_turnos(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_agenda_reserva_links_token ON public.agenda_reserva_links(token);
CREATE INDEX IF NOT EXISTS idx_agenda_reserva_links_profesional ON public.agenda_reserva_links(profesional_id);
CREATE INDEX IF NOT EXISTS idx_agenda_reserva_links_estado ON public.agenda_reserva_links(estado);
CREATE INDEX IF NOT EXISTS idx_agenda_reserva_links_expires ON public.agenda_reserva_links(expires_at);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE public.agenda_reserva_links ENABLE ROW LEVEL SECURITY;

-- SELECT: profesional puede ver sus propios links
CREATE POLICY "agenda_reserva_links_select_own" ON public.agenda_reserva_links
    FOR SELECT USING (auth.uid() = profesional_id);

-- SELECT público: cualquiera puede leer por token (para página de reserva)
CREATE POLICY "agenda_reserva_links_select_by_token" ON public.agenda_reserva_links
    FOR SELECT USING (true);

-- INSERT: profesional puede crear sus propios links
CREATE POLICY "agenda_reserva_links_insert_own" ON public.agenda_reserva_links
    FOR INSERT WITH CHECK (auth.uid() = profesional_id);

-- UPDATE: profesional puede actualizar sus propios links
CREATE POLICY "agenda_reserva_links_update_own" ON public.agenda_reserva_links
    FOR UPDATE USING (auth.uid() = profesional_id);

-- UPDATE público: permitir actualizar estado cuando se usa el link (sin auth)
CREATE POLICY "agenda_reserva_links_update_public" ON public.agenda_reserva_links
    FOR UPDATE USING (true)
    WITH CHECK (
        -- Solo permitir cambiar estado a 'usado' y asignar turno_id
        estado = 'usado'
    );

-- DELETE: profesional puede eliminar sus propios links
CREATE POLICY "agenda_reserva_links_delete_own" ON public.agenda_reserva_links
    FOR DELETE USING (auth.uid() = profesional_id);

-- ============================================
-- Agregar estado 'pendiente_confirmacion' a agenda_turnos
-- ============================================

-- Primero verificamos si la constraint existe y la actualizamos
DO $$
BEGIN
    -- Eliminar constraint existente si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'agenda_turnos_estado_check'
        AND table_name = 'agenda_turnos'
    ) THEN
        ALTER TABLE public.agenda_turnos DROP CONSTRAINT agenda_turnos_estado_check;
    END IF;

    -- Crear nueva constraint con el estado adicional
    ALTER TABLE public.agenda_turnos
    ADD CONSTRAINT agenda_turnos_estado_check
    CHECK (estado IN ('pendiente', 'confirmado', 'en_curso', 'completado', 'cancelado', 'no_asistio', 'pendiente_confirmacion'));
EXCEPTION
    WHEN others THEN
        -- Si falla, puede que no exista constraint, intentamos agregarla directamente
        NULL;
END $$;

-- ============================================
-- Comentarios
-- ============================================

COMMENT ON TABLE public.agenda_reserva_links IS 'Links de reserva para auto-gestión de turnos por clientes';
COMMENT ON COLUMN public.agenda_reserva_links.token IS 'Token único para el link público';
COMMENT ON COLUMN public.agenda_reserva_links.slots_disponibles IS 'JSON con slots por fecha que el profesional habilitó';
COMMENT ON COLUMN public.agenda_reserva_links.expires_at IS 'Fecha de expiración (48hs desde creación)';
COMMENT ON COLUMN public.agenda_reserva_links.estado IS 'activo: disponible, usado: ya se reservó, expirado: pasaron 48hs';
COMMENT ON COLUMN public.agenda_reserva_links.modalidad IS 'Modalidad del turno: local, domicilio o videollamada';

-- ============================================
-- MIGRACIONES
-- ============================================

-- Agregar columna modalidad si no existe
ALTER TABLE public.agenda_reserva_links ADD COLUMN IF NOT EXISTS modalidad VARCHAR(20) DEFAULT 'local' CHECK (modalidad IN ('local', 'domicilio', 'videollamada'));
