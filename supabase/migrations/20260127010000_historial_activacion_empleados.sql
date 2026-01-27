-- =====================================================
-- MIGRACIÓN: Historial de activación/desactivación de empleados
-- Fecha: 2026-01-27
-- Descripción:
--   - Crear tabla para registrar cambios de estado activo de empleados
--   - Trigger automático que registra cada cambio
--   - Permite auditar quién y cuándo activó/desactivó empleados
-- =====================================================

-- =====================================================
-- 1. TABLA: caja_empleados_historial
-- Registra cada cambio de estado activo
-- =====================================================

CREATE TABLE IF NOT EXISTS public.caja_empleados_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_rel_id UUID NOT NULL REFERENCES public.caja_empleados(id) ON DELETE CASCADE,
    empleado_id UUID NOT NULL,  -- ID del usuario empleado
    duenio_id UUID NOT NULL,    -- ID del dueño
    accion VARCHAR(20) NOT NULL CHECK (accion IN ('activado', 'desactivado', 'creado')),
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Quien realizó el cambio (puede ser el dueño u otro admin)
    realizado_por UUID REFERENCES auth.users(id),
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_empleados_historial_empleado_rel ON public.caja_empleados_historial(empleado_rel_id);
CREATE INDEX IF NOT EXISTS idx_empleados_historial_empleado ON public.caja_empleados_historial(empleado_id);
CREATE INDEX IF NOT EXISTS idx_empleados_historial_duenio ON public.caja_empleados_historial(duenio_id);
CREATE INDEX IF NOT EXISTS idx_empleados_historial_fecha ON public.caja_empleados_historial(fecha_hora DESC);

-- =====================================================
-- 2. RLS POLICIES
-- =====================================================

ALTER TABLE public.caja_empleados_historial ENABLE ROW LEVEL SECURITY;

-- El dueño puede ver el historial de sus empleados
DROP POLICY IF EXISTS "historial_empleados_select" ON public.caja_empleados_historial;
CREATE POLICY "historial_empleados_select" ON public.caja_empleados_historial
    FOR SELECT TO authenticated
    USING (duenio_id = auth.uid() OR public.is_full_access());

-- Solo inserción via trigger (no manual)
DROP POLICY IF EXISTS "historial_empleados_insert" ON public.caja_empleados_historial;
CREATE POLICY "historial_empleados_insert" ON public.caja_empleados_historial
    FOR INSERT TO authenticated
    WITH CHECK (duenio_id = auth.uid() OR public.is_full_access());

-- =====================================================
-- 3. TRIGGER: Registrar cambios de estado
-- =====================================================

CREATE OR REPLACE FUNCTION public.fn_registrar_cambio_estado_empleado()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar si cambió el campo activo
    IF TG_OP = 'INSERT' THEN
        -- Registro de creación
        INSERT INTO public.caja_empleados_historial (
            empleado_rel_id,
            empleado_id,
            duenio_id,
            accion,
            fecha_hora,
            realizado_por
        ) VALUES (
            NEW.id,
            NEW.empleado_id,
            NEW.duenio_id,
            'creado',
            NOW(),
            auth.uid()
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.activo IS DISTINCT FROM NEW.activo THEN
        -- Registro de activación/desactivación
        INSERT INTO public.caja_empleados_historial (
            empleado_rel_id,
            empleado_id,
            duenio_id,
            accion,
            fecha_hora,
            realizado_por
        ) VALUES (
            NEW.id,
            NEW.empleado_id,
            NEW.duenio_id,
            CASE WHEN NEW.activo THEN 'activado' ELSE 'desactivado' END,
            NOW(),
            auth.uid()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en INSERT
DROP TRIGGER IF EXISTS trigger_empleado_creado ON public.caja_empleados;
CREATE TRIGGER trigger_empleado_creado
    AFTER INSERT ON public.caja_empleados
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_registrar_cambio_estado_empleado();

-- Trigger en UPDATE
DROP TRIGGER IF EXISTS trigger_empleado_estado_cambio ON public.caja_empleados;
CREATE TRIGGER trigger_empleado_estado_cambio
    AFTER UPDATE ON public.caja_empleados
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_registrar_cambio_estado_empleado();

-- =====================================================
-- 4. FUNCIÓN RPC: Obtener historial de un empleado
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_historial_empleado(p_empleado_rel_id UUID)
RETURNS TABLE (
    id UUID,
    accion VARCHAR(20),
    fecha_hora TIMESTAMPTZ,
    realizado_por_email TEXT,
    realizado_por_nombre TEXT
) AS $$
DECLARE
    v_duenio_id UUID;
BEGIN
    -- Verificar que el usuario actual sea el dueño
    SELECT ce.duenio_id INTO v_duenio_id
    FROM public.caja_empleados ce
    WHERE ce.id = p_empleado_rel_id;

    IF v_duenio_id IS NULL THEN
        RETURN;
    END IF;

    IF v_duenio_id != auth.uid() AND NOT public.is_full_access() THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        h.id,
        h.accion,
        h.fecha_hora,
        COALESCE(p.email, au.email, 'Sistema') as realizado_por_email,
        COALESCE(
            NULLIF(TRIM(COALESCE(p.nombre, '') || ' ' || COALESCE(p.apellido, '')), ''),
            p.email,
            au.email,
            'Sistema'
        ) as realizado_por_nombre
    FROM public.caja_empleados_historial h
    LEFT JOIN auth.users au ON au.id = h.realizado_por
    LEFT JOIN public.profiles p ON p.id = h.realizado_por
    WHERE h.empleado_rel_id = p_empleado_rel_id
    ORDER BY h.fecha_hora DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_historial_empleado(UUID) TO authenticated;

-- =====================================================
-- 5. REGISTRAR ESTADO ACTUAL DE EMPLEADOS EXISTENTES
-- (Para tener un punto de partida en el historial)
-- =====================================================

INSERT INTO public.caja_empleados_historial (
    empleado_rel_id,
    empleado_id,
    duenio_id,
    accion,
    fecha_hora,
    realizado_por,
    notas
)
SELECT
    ce.id,
    ce.empleado_id,
    ce.duenio_id,
    CASE WHEN ce.activo THEN 'activado' ELSE 'desactivado' END,
    COALESCE(ce.updated_at, ce.created_at, NOW()),
    ce.duenio_id,
    'Registro inicial - estado al momento de la migración'
FROM public.caja_empleados ce
WHERE NOT EXISTS (
    SELECT 1 FROM public.caja_empleados_historial h
    WHERE h.empleado_rel_id = ce.id
);

