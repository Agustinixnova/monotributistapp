-- ============================================
-- Migración: Modos de agenda y espacios/salones
-- Fecha: 2026-02-01
-- Descripción: Agrega soporte para 3 modos de agenda:
--   - personal: Solo yo (sin selectores)
--   - equipo: Múltiples profesionales (existente)
--   - espacios: Múltiples espacios/salones para alquilar
-- ============================================

-- 1. Agregar campo modo_agenda a agenda_negocio
ALTER TABLE public.agenda_negocio
ADD COLUMN IF NOT EXISTS modo_agenda VARCHAR(20) DEFAULT 'personal';

-- Actualizar valores existentes: si tienen más de 1 profesional, poner 'equipo'
-- (esto se hará manualmente o con un script de migración de datos)

COMMENT ON COLUMN public.agenda_negocio.modo_agenda IS 'Modo de operación: personal, equipo, espacios';

-- 2. Crear tabla agenda_espacios
CREATE TABLE IF NOT EXISTS public.agenda_espacios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Datos del espacio
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#6366F1', -- Color hex para identificar en calendario

    -- Capacidad y características
    capacidad_personas INTEGER DEFAULT 1,
    equipamiento TEXT[], -- Array de equipamiento disponible

    -- Estado
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0, -- Para ordenar en la lista

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_agenda_espacios_user_id
ON public.agenda_espacios(user_id);

CREATE INDEX IF NOT EXISTS idx_agenda_espacios_activo
ON public.agenda_espacios(user_id, activo);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_agenda_espacios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_agenda_espacios_updated_at ON public.agenda_espacios;
CREATE TRIGGER trigger_agenda_espacios_updated_at
    BEFORE UPDATE ON public.agenda_espacios
    FOR EACH ROW
    EXECUTE FUNCTION update_agenda_espacios_updated_at();

-- 3. RLS Policies para agenda_espacios
ALTER TABLE public.agenda_espacios ENABLE ROW LEVEL SECURITY;

-- SELECT: usuarios pueden ver sus propios espacios
CREATE POLICY "agenda_espacios_select_own" ON public.agenda_espacios
    FOR SELECT USING (auth.uid() = user_id);

-- INSERT: usuarios pueden crear sus propios espacios
CREATE POLICY "agenda_espacios_insert_own" ON public.agenda_espacios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: usuarios pueden actualizar sus propios espacios
CREATE POLICY "agenda_espacios_update_own" ON public.agenda_espacios
    FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: usuarios pueden eliminar sus propios espacios
CREATE POLICY "agenda_espacios_delete_own" ON public.agenda_espacios
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Agregar campo espacio_id a agenda_turnos (opcional, para modo espacios)
ALTER TABLE public.agenda_turnos
ADD COLUMN IF NOT EXISTS espacio_id UUID REFERENCES public.agenda_espacios(id) ON DELETE SET NULL;

-- Índice para buscar turnos por espacio
CREATE INDEX IF NOT EXISTS idx_agenda_turnos_espacio_id
ON public.agenda_turnos(espacio_id)
WHERE espacio_id IS NOT NULL;

COMMENT ON COLUMN public.agenda_turnos.espacio_id IS 'Espacio/salón asignado (solo para modo espacios)';

-- 5. Comentarios de la tabla
COMMENT ON TABLE public.agenda_espacios IS 'Espacios/salones para alquilar en modo espacios';
COMMENT ON COLUMN public.agenda_espacios.nombre IS 'Nombre del espacio (ej: Salón 1, Box A)';
COMMENT ON COLUMN public.agenda_espacios.color IS 'Color hex para identificar en calendario';
COMMENT ON COLUMN public.agenda_espacios.capacidad_personas IS 'Capacidad máxima de personas';
COMMENT ON COLUMN public.agenda_espacios.equipamiento IS 'Array de equipamiento disponible';
COMMENT ON COLUMN public.agenda_espacios.orden IS 'Orden de visualización';
