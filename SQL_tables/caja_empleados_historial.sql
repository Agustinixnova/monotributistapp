-- =====================================================
-- TABLA: caja_empleados_historial
-- Fecha creación: 2026-01-27
-- Descripción: Registra cambios de estado activo/inactivo de empleados
-- =====================================================

-- PROPÓSITO:
-- Mantener un registro de auditoría de cuándo se activan, desactivan
-- o crean empleados de caja. Permite rastrear quién realizó cada cambio.

CREATE TABLE IF NOT EXISTS public.caja_empleados_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_rel_id UUID NOT NULL REFERENCES public.caja_empleados(id) ON DELETE CASCADE,
    empleado_id UUID NOT NULL,  -- ID del usuario empleado
    duenio_id UUID NOT NULL,    -- ID del dueño
    accion VARCHAR(20) NOT NULL CHECK (accion IN ('activado', 'desactivado', 'creado')),
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    realizado_por UUID REFERENCES auth.users(id),
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_empleados_historial_empleado_rel ON public.caja_empleados_historial(empleado_rel_id);
CREATE INDEX IF NOT EXISTS idx_empleados_historial_empleado ON public.caja_empleados_historial(empleado_id);
CREATE INDEX IF NOT EXISTS idx_empleados_historial_duenio ON public.caja_empleados_historial(duenio_id);
CREATE INDEX IF NOT EXISTS idx_empleados_historial_fecha ON public.caja_empleados_historial(fecha_hora DESC);

-- RLS POLICIES
ALTER TABLE public.caja_empleados_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historial_empleados_select" ON public.caja_empleados_historial
    FOR SELECT TO authenticated
    USING (duenio_id = auth.uid() OR public.is_full_access());

CREATE POLICY "historial_empleados_insert" ON public.caja_empleados_historial
    FOR INSERT TO authenticated
    WITH CHECK (duenio_id = auth.uid() OR public.is_full_access());

-- TRIGGERS
-- Se disparan automáticamente al crear o modificar empleados en caja_empleados

-- FUNCIÓN RPC
-- get_historial_empleado(p_empleado_rel_id UUID) - Retorna historial con nombre del usuario que hizo el cambio

-- MIGRACIÓN: supabase/migrations/20260127010000_historial_activacion_empleados.sql
