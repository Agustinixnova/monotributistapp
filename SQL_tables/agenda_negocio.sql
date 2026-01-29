-- ============================================
-- Tabla: agenda_negocio
-- Descripción: Datos del negocio/emprendimiento del profesional
-- ============================================

CREATE TABLE IF NOT EXISTS public.agenda_negocio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Datos del negocio
    nombre_negocio VARCHAR(255),
    descripcion TEXT,

    -- Contacto
    telefono VARCHAR(50),
    whatsapp VARCHAR(50),
    email VARCHAR(255),

    -- Ubicación
    direccion VARCHAR(255),
    piso VARCHAR(20),
    departamento VARCHAR(50),
    localidad VARCHAR(100),
    provincia VARCHAR(100),
    codigo_postal VARCHAR(20),

    -- Datos de cobro
    alias_pago VARCHAR(100),
    cuit VARCHAR(11),

    -- Modalidades de trabajo
    modalidades_trabajo TEXT[] DEFAULT ARRAY['local'],

    -- Plantillas de WhatsApp
    plantilla_recordatorio TEXT,
    plantilla_en_camino TEXT,
    plantilla_sena TEXT,
    plantilla_pago TEXT,

    -- Redes sociales
    instagram VARCHAR(100),
    tiktok VARCHAR(100),
    facebook VARCHAR(255),
    web VARCHAR(255),

    -- Horario de atención (texto libre para mostrar al cliente)
    horario_atencion TEXT,

    -- Logo/imagen (URL)
    logo_url TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único: un registro por usuario
CREATE UNIQUE INDEX IF NOT EXISTS idx_agenda_negocio_user_id
ON public.agenda_negocio(user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_agenda_negocio_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_agenda_negocio_updated_at ON public.agenda_negocio;
CREATE TRIGGER trigger_agenda_negocio_updated_at
    BEFORE UPDATE ON public.agenda_negocio
    FOR EACH ROW
    EXECUTE FUNCTION update_agenda_negocio_updated_at();

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE public.agenda_negocio ENABLE ROW LEVEL SECURITY;

-- SELECT: usuarios pueden ver su propio negocio
CREATE POLICY "agenda_negocio_select_own" ON public.agenda_negocio
    FOR SELECT USING (auth.uid() = user_id);

-- INSERT: usuarios pueden crear su propio negocio
CREATE POLICY "agenda_negocio_insert_own" ON public.agenda_negocio
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: usuarios pueden actualizar su propio negocio
CREATE POLICY "agenda_negocio_update_own" ON public.agenda_negocio
    FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: usuarios pueden eliminar su propio negocio
CREATE POLICY "agenda_negocio_delete_own" ON public.agenda_negocio
    FOR DELETE USING (auth.uid() = user_id);

-- SELECT público para página de reservas (solo datos necesarios)
-- Esta política permite leer datos de negocio sin autenticación
-- cuando se accede desde la página pública de reservas
CREATE POLICY "agenda_negocio_select_public" ON public.agenda_negocio
    FOR SELECT USING (true);

-- ============================================
-- Comentarios
-- ============================================

COMMENT ON TABLE public.agenda_negocio IS 'Datos del negocio/emprendimiento de cada profesional';
COMMENT ON COLUMN public.agenda_negocio.user_id IS 'Usuario dueño del negocio';
COMMENT ON COLUMN public.agenda_negocio.nombre_negocio IS 'Nombre comercial del emprendimiento';
COMMENT ON COLUMN public.agenda_negocio.horario_atencion IS 'Texto libre con horarios (ej: Lunes a Viernes 9 a 18hs)';
COMMENT ON COLUMN public.agenda_negocio.logo_url IS 'URL de la imagen del logo (storage de Supabase)';
COMMENT ON COLUMN public.agenda_negocio.modalidades_trabajo IS 'Array de modalidades: local, domicilio, videollamada';
COMMENT ON COLUMN public.agenda_negocio.plantilla_recordatorio IS 'Plantilla de mensaje WhatsApp para recordatorio de turno';
COMMENT ON COLUMN public.agenda_negocio.plantilla_en_camino IS 'Plantilla de mensaje WhatsApp para avisar que va en camino (domicilio)';
COMMENT ON COLUMN public.agenda_negocio.plantilla_sena IS 'Plantilla de mensaje WhatsApp para solicitar seña';
COMMENT ON COLUMN public.agenda_negocio.plantilla_pago IS 'Plantilla de mensaje WhatsApp para solicitar pago final';

-- ============================================
-- Migraciones (ejecutar si la tabla ya existe)
-- ============================================

-- Agregar columnas nuevas si no existen
ALTER TABLE public.agenda_negocio ADD COLUMN IF NOT EXISTS piso VARCHAR(20);
ALTER TABLE public.agenda_negocio ADD COLUMN IF NOT EXISTS departamento VARCHAR(50);
ALTER TABLE public.agenda_negocio ADD COLUMN IF NOT EXISTS alias_pago VARCHAR(100);
ALTER TABLE public.agenda_negocio ADD COLUMN IF NOT EXISTS cuit VARCHAR(11);
ALTER TABLE public.agenda_negocio ADD COLUMN IF NOT EXISTS modalidades_trabajo TEXT[] DEFAULT ARRAY['local'];
ALTER TABLE public.agenda_negocio ADD COLUMN IF NOT EXISTS plantilla_recordatorio TEXT;
ALTER TABLE public.agenda_negocio ADD COLUMN IF NOT EXISTS plantilla_en_camino TEXT;
ALTER TABLE public.agenda_negocio ADD COLUMN IF NOT EXISTS plantilla_sena TEXT;
ALTER TABLE public.agenda_negocio ADD COLUMN IF NOT EXISTS plantilla_pago TEXT;
