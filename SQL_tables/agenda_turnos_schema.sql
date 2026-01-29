-- =====================================================
-- MÓDULO: AGENDA & TURNOS
-- Esquema de base de datos
-- =====================================================

-- =====================================================
-- TABLA: agenda_servicios
-- Catálogo de servicios que ofrece el negocio
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agenda_servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duenio_id UUID NOT NULL REFERENCES public.usuarios_free(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    duracion_minutos INT NOT NULL DEFAULT 30,
    duracion_minima INT, -- para duración flexible
    duracion_maxima INT, -- para duración flexible
    precio DECIMAL(12,2) NOT NULL DEFAULT 0,
    costo_estimado DECIMAL(12,2), -- para calcular margen
    requiere_sena BOOLEAN DEFAULT false,
    porcentaje_sena INT DEFAULT 0 CHECK (porcentaje_sena >= 0 AND porcentaje_sena <= 100),
    color VARCHAR(20) DEFAULT '#3B82F6', -- color para el calendario
    orden INT DEFAULT 0, -- para ordenar en listados
    -- Configuración por modalidad
    disponible_local BOOLEAN DEFAULT true,
    disponible_domicilio BOOLEAN DEFAULT true,
    disponible_videollamada BOOLEAN DEFAULT true,
    precio_local DECIMAL(12,2), -- NULL = usa precio base
    precio_domicilio DECIMAL(12,2),
    precio_videollamada DECIMAL(12,2),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_agenda_servicios_duenio ON public.agenda_servicios(duenio_id);
CREATE INDEX IF NOT EXISTS idx_agenda_servicios_activo ON public.agenda_servicios(duenio_id, activo);

-- =====================================================
-- TABLA: agenda_servicio_profesionales
-- Qué profesionales ofrecen qué servicios
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agenda_servicio_profesionales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id UUID NOT NULL REFERENCES public.agenda_servicios(id) ON DELETE CASCADE,
    profesional_id UUID NOT NULL REFERENCES public.usuarios_free(id) ON DELETE CASCADE,
    precio_override DECIMAL(12,2), -- precio diferente al base (opcional)
    duracion_override INT, -- duración diferente (opcional)
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(servicio_id, profesional_id)
);

CREATE INDEX IF NOT EXISTS idx_agenda_serv_prof_servicio ON public.agenda_servicio_profesionales(servicio_id);
CREATE INDEX IF NOT EXISTS idx_agenda_serv_prof_profesional ON public.agenda_servicio_profesionales(profesional_id);

-- =====================================================
-- TABLA: agenda_clientes
-- Clientes de la agenda (separados de clientes fiscales)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agenda_clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duenio_id UUID NOT NULL REFERENCES public.usuarios_free(id) ON DELETE CASCADE,
    creado_por UUID REFERENCES public.usuarios_free(id), -- quien lo creó (puede ser empleado)
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    telefono VARCHAR(30), -- DEPRECADO: usar whatsapp
    whatsapp VARCHAR(30),
    email VARCHAR(255),
    instagram VARCHAR(50), -- usuario de Instagram sin @
    origen VARCHAR(30) CHECK (origen IN ('recomendacion', 'instagram', 'facebook', 'tiktok', 'google', 'otros')),
    notas TEXT,
    es_cliente_empleado BOOLEAN DEFAULT false, -- true = cliente particular del empleado
    -- Campos de dirección para servicios a domicilio
    direccion VARCHAR(255),
    piso VARCHAR(10),
    departamento VARCHAR(10),
    localidad VARCHAR(100),
    provincia VARCHAR(50),
    indicaciones_ubicacion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_agenda_clientes_duenio ON public.agenda_clientes(duenio_id);
CREATE INDEX IF NOT EXISTS idx_agenda_clientes_creador ON public.agenda_clientes(creado_por);
CREATE INDEX IF NOT EXISTS idx_agenda_clientes_nombre ON public.agenda_clientes(duenio_id, nombre);
CREATE INDEX IF NOT EXISTS idx_agenda_clientes_instagram ON public.agenda_clientes(duenio_id, instagram) WHERE instagram IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agenda_clientes_origen ON public.agenda_clientes(duenio_id, origen) WHERE origen IS NOT NULL;

-- =====================================================
-- TABLA: agenda_disponibilidad
-- Horarios de trabajo por profesional
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agenda_disponibilidad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profesional_id UUID NOT NULL REFERENCES public.usuarios_free(id) ON DELETE CASCADE,
    dia_semana INT NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=domingo, 1=lunes, etc
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT hora_fin_mayor CHECK (hora_fin > hora_inicio)
);

-- Índice para buscar disponibilidad
CREATE INDEX IF NOT EXISTS idx_agenda_disponibilidad_prof ON public.agenda_disponibilidad(profesional_id, dia_semana);

-- =====================================================
-- TABLA: agenda_excepciones
-- Excepciones a la disponibilidad (feriados, vacaciones, horarios especiales)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agenda_excepciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profesional_id UUID NOT NULL REFERENCES public.usuarios_free(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    todo_el_dia BOOLEAN DEFAULT true,
    hora_inicio TIME, -- si no es todo el día
    hora_fin TIME,    -- si no es todo el día
    motivo VARCHAR(255),
    tipo VARCHAR(20) DEFAULT 'bloqueo' CHECK (tipo IN ('bloqueo', 'horario_especial')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_excepciones_prof_fecha ON public.agenda_excepciones(profesional_id, fecha);

-- =====================================================
-- TABLA: agenda_turnos
-- Turnos/citas agendadas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agenda_turnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duenio_id UUID NOT NULL REFERENCES public.usuarios_free(id) ON DELETE CASCADE,
    profesional_id UUID NOT NULL REFERENCES public.usuarios_free(id),
    cliente_id UUID REFERENCES public.agenda_clientes(id),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    duracion_real INT, -- minutos reales (puede diferir de la suma de servicios)
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente',
        'confirmado',
        'en_curso',
        'completado',
        'cancelado',
        'no_asistio'
    )),
    notas TEXT,
    notas_internas TEXT, -- notas solo visibles para el profesional
    recordatorio_enviado BOOLEAN DEFAULT false,
    fecha_recordatorio TIMESTAMPTZ,
    -- Recurrencia
    es_recurrente BOOLEAN DEFAULT false,
    recurrencia_tipo VARCHAR(20) CHECK (recurrencia_tipo IN ('semanal', 'quincenal', 'mensual')),
    recurrencia_fin DATE,
    turno_padre_id UUID REFERENCES public.agenda_turnos(id) ON DELETE SET NULL,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completado_at TIMESTAMPTZ,
    cancelado_at TIMESTAMPTZ,
    -- Constraints
    CONSTRAINT hora_fin_turno_mayor CHECK (hora_fin > hora_inicio)
);

-- Índices principales
CREATE INDEX IF NOT EXISTS idx_agenda_turnos_fecha_prof ON public.agenda_turnos(fecha, profesional_id);
CREATE INDEX IF NOT EXISTS idx_agenda_turnos_duenio_fecha ON public.agenda_turnos(duenio_id, fecha);
CREATE INDEX IF NOT EXISTS idx_agenda_turnos_cliente ON public.agenda_turnos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agenda_turnos_estado ON public.agenda_turnos(estado);
CREATE INDEX IF NOT EXISTS idx_agenda_turnos_padre ON public.agenda_turnos(turno_padre_id);

-- =====================================================
-- TABLA: agenda_turno_servicios
-- Servicios incluidos en cada turno (muchos a muchos)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agenda_turno_servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id UUID NOT NULL REFERENCES public.agenda_turnos(id) ON DELETE CASCADE,
    servicio_id UUID NOT NULL REFERENCES public.agenda_servicios(id),
    precio DECIMAL(12,2) NOT NULL, -- precio al momento de crear el turno
    duracion INT NOT NULL, -- duración asignada en minutos
    orden INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_turno_servicios_turno ON public.agenda_turno_servicios(turno_id);

-- =====================================================
-- TABLA: agenda_turno_pagos
-- Pagos asociados a un turno (señas, pago final, devoluciones)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agenda_turno_pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id UUID NOT NULL REFERENCES public.agenda_turnos(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('sena', 'pago_final', 'devolucion')),
    monto DECIMAL(12,2) NOT NULL,
    metodo_pago_id UUID REFERENCES public.caja_metodos_pago(id),
    fecha_pago DATE NOT NULL,
    hora_pago TIME, -- Hora del cobro en formato 24hs UTC-3 Argentina
    -- Integración con Caja Diaria
    registrado_en_caja BOOLEAN DEFAULT false,
    caja_movimiento_id UUID REFERENCES public.caja_movimientos(id),
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_turno_pagos_turno ON public.agenda_turno_pagos(turno_id);
CREATE INDEX IF NOT EXISTS idx_agenda_turno_pagos_fecha ON public.agenda_turno_pagos(fecha_pago);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de turnos con información completa
CREATE OR REPLACE VIEW public.agenda_turnos_completos AS
SELECT
    t.*,
    c.nombre as cliente_nombre,
    c.apellido as cliente_apellido,
    c.telefono as cliente_telefono,
    c.whatsapp as cliente_whatsapp,
    p.nombre as profesional_nombre,
    p.apellido as profesional_apellido,
    (
        SELECT COALESCE(SUM(ts.precio), 0)
        FROM public.agenda_turno_servicios ts
        WHERE ts.turno_id = t.id
    ) as total_servicios,
    (
        SELECT COALESCE(SUM(tp.monto), 0)
        FROM public.agenda_turno_pagos tp
        WHERE tp.turno_id = t.id AND tp.tipo IN ('sena', 'pago_final')
    ) as total_pagado,
    (
        SELECT STRING_AGG(s.nombre, ', ' ORDER BY ts.orden)
        FROM public.agenda_turno_servicios ts
        JOIN public.agenda_servicios s ON s.id = ts.servicio_id
        WHERE ts.turno_id = t.id
    ) as servicios_nombres
FROM public.agenda_turnos t
LEFT JOIN public.agenda_clientes c ON c.id = t.cliente_id
LEFT JOIN public.usuarios_free p ON p.id = t.profesional_id;

-- =====================================================
-- FUNCIONES
-- =====================================================

-- Función para verificar disponibilidad de un profesional
CREATE OR REPLACE FUNCTION public.verificar_disponibilidad_turno(
    p_profesional_id UUID,
    p_fecha DATE,
    p_hora_inicio TIME,
    p_hora_fin TIME,
    p_turno_excluir UUID DEFAULT NULL -- para edición, excluir el turno actual
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_dia_semana INT;
    v_disponible BOOLEAN;
    v_tiene_excepcion BOOLEAN;
    v_turnos_solapados INT;
BEGIN
    -- Obtener día de la semana (0=domingo en PostgreSQL es igual)
    v_dia_semana := EXTRACT(DOW FROM p_fecha)::INT;

    -- Verificar si tiene disponibilidad configurada para ese día
    SELECT EXISTS (
        SELECT 1 FROM public.agenda_disponibilidad
        WHERE profesional_id = p_profesional_id
        AND dia_semana = v_dia_semana
        AND activo = true
        AND p_hora_inicio >= hora_inicio
        AND p_hora_fin <= hora_fin
    ) INTO v_disponible;

    IF NOT v_disponible THEN
        RETURN false;
    END IF;

    -- Verificar excepciones (bloqueos)
    SELECT EXISTS (
        SELECT 1 FROM public.agenda_excepciones
        WHERE profesional_id = p_profesional_id
        AND fecha = p_fecha
        AND tipo = 'bloqueo'
        AND (
            todo_el_dia = true
            OR (
                p_hora_inicio < hora_fin AND p_hora_fin > hora_inicio
            )
        )
    ) INTO v_tiene_excepcion;

    IF v_tiene_excepcion THEN
        RETURN false;
    END IF;

    -- Verificar turnos existentes que se solapen
    SELECT COUNT(*) INTO v_turnos_solapados
    FROM public.agenda_turnos
    WHERE profesional_id = p_profesional_id
    AND fecha = p_fecha
    AND estado NOT IN ('cancelado', 'no_asistio')
    AND (p_turno_excluir IS NULL OR id != p_turno_excluir)
    AND (
        (p_hora_inicio >= hora_inicio AND p_hora_inicio < hora_fin)
        OR (p_hora_fin > hora_inicio AND p_hora_fin <= hora_fin)
        OR (p_hora_inicio <= hora_inicio AND p_hora_fin >= hora_fin)
    );

    RETURN v_turnos_solapados = 0;
END;
$$;

-- Función para obtener estadísticas de un cliente
CREATE OR REPLACE FUNCTION public.agenda_estadisticas_cliente(p_cliente_id UUID)
RETURNS TABLE (
    total_turnos BIGINT,
    turnos_completados BIGINT,
    turnos_cancelados BIGINT,
    turnos_no_asistio BIGINT,
    total_gastado DECIMAL,
    ultima_visita DATE,
    primera_visita DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_turnos,
        COUNT(*) FILTER (WHERE estado = 'completado')::BIGINT as turnos_completados,
        COUNT(*) FILTER (WHERE estado = 'cancelado')::BIGINT as turnos_cancelados,
        COUNT(*) FILTER (WHERE estado = 'no_asistio')::BIGINT as turnos_no_asistio,
        COALESCE((
            SELECT SUM(tp.monto)
            FROM public.agenda_turno_pagos tp
            JOIN public.agenda_turnos t2 ON t2.id = tp.turno_id
            WHERE t2.cliente_id = p_cliente_id
            AND tp.tipo IN ('sena', 'pago_final')
        ), 0) as total_gastado,
        MAX(fecha) FILTER (WHERE estado = 'completado') as ultima_visita,
        MIN(fecha) as primera_visita
    FROM public.agenda_turnos
    WHERE cliente_id = p_cliente_id;
END;
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.agenda_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_servicio_profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_disponibilidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_excepciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_turno_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_turno_pagos ENABLE ROW LEVEL SECURITY;

-- Políticas para agenda_servicios
CREATE POLICY "servicios_select" ON public.agenda_servicios
    FOR SELECT USING (
        public.is_full_access()
        OR duenio_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.caja_empleados ce
            WHERE ce.empleado_id = auth.uid()
            AND ce.duenio_id = agenda_servicios.duenio_id
            AND ce.activo = true
        )
    );

CREATE POLICY "servicios_insert" ON public.agenda_servicios
    FOR INSERT WITH CHECK (
        public.is_full_access()
        OR duenio_id = auth.uid()
    );

CREATE POLICY "servicios_update" ON public.agenda_servicios
    FOR UPDATE USING (
        public.is_full_access()
        OR duenio_id = auth.uid()
    );

CREATE POLICY "servicios_delete" ON public.agenda_servicios
    FOR DELETE USING (
        public.is_full_access()
        OR duenio_id = auth.uid()
    );

-- Políticas para agenda_clientes
CREATE POLICY "clientes_select" ON public.agenda_clientes
    FOR SELECT USING (
        public.is_full_access()
        OR duenio_id = auth.uid()
        OR creado_por = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.caja_empleados ce
            WHERE ce.empleado_id = auth.uid()
            AND ce.duenio_id = agenda_clientes.duenio_id
            AND ce.activo = true
        )
    );

CREATE POLICY "clientes_insert" ON public.agenda_clientes
    FOR INSERT WITH CHECK (
        public.is_full_access()
        OR duenio_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.caja_empleados ce
            WHERE ce.empleado_id = auth.uid()
            AND ce.duenio_id = agenda_clientes.duenio_id
            AND ce.activo = true
        )
    );

CREATE POLICY "clientes_update" ON public.agenda_clientes
    FOR UPDATE USING (
        public.is_full_access()
        OR duenio_id = auth.uid()
        OR creado_por = auth.uid()
    );

CREATE POLICY "clientes_delete" ON public.agenda_clientes
    FOR DELETE USING (
        public.is_full_access()
        OR duenio_id = auth.uid()
    );

-- Políticas para agenda_turnos
CREATE POLICY "turnos_select" ON public.agenda_turnos
    FOR SELECT USING (
        public.is_full_access()
        OR duenio_id = auth.uid()
        OR profesional_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.caja_empleados ce
            WHERE ce.empleado_id = auth.uid()
            AND ce.duenio_id = agenda_turnos.duenio_id
            AND ce.activo = true
        )
    );

CREATE POLICY "turnos_insert" ON public.agenda_turnos
    FOR INSERT WITH CHECK (
        public.is_full_access()
        OR duenio_id = auth.uid()
        OR profesional_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.caja_empleados ce
            WHERE ce.empleado_id = auth.uid()
            AND ce.duenio_id = agenda_turnos.duenio_id
            AND ce.activo = true
        )
    );

CREATE POLICY "turnos_update" ON public.agenda_turnos
    FOR UPDATE USING (
        public.is_full_access()
        OR duenio_id = auth.uid()
        OR profesional_id = auth.uid()
    );

CREATE POLICY "turnos_delete" ON public.agenda_turnos
    FOR DELETE USING (
        public.is_full_access()
        OR duenio_id = auth.uid()
    );

-- Políticas para agenda_disponibilidad
CREATE POLICY "disponibilidad_select" ON public.agenda_disponibilidad
    FOR SELECT USING (
        public.is_full_access()
        OR profesional_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.caja_empleados ce
            WHERE ce.duenio_id = auth.uid()
            AND ce.empleado_id = agenda_disponibilidad.profesional_id
        )
    );

CREATE POLICY "disponibilidad_all" ON public.agenda_disponibilidad
    FOR ALL USING (
        public.is_full_access()
        OR profesional_id = auth.uid()
    );

-- Políticas para agenda_turno_servicios (heredan del turno)
CREATE POLICY "turno_servicios_select" ON public.agenda_turno_servicios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.agenda_turnos t
            WHERE t.id = agenda_turno_servicios.turno_id
        )
    );

CREATE POLICY "turno_servicios_all" ON public.agenda_turno_servicios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.agenda_turnos t
            WHERE t.id = agenda_turno_servicios.turno_id
            AND (
                public.is_full_access()
                OR t.duenio_id = auth.uid()
                OR t.profesional_id = auth.uid()
            )
        )
    );

-- Políticas para agenda_turno_pagos (heredan del turno)
CREATE POLICY "turno_pagos_select" ON public.agenda_turno_pagos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.agenda_turnos t
            WHERE t.id = agenda_turno_pagos.turno_id
        )
    );

CREATE POLICY "turno_pagos_all" ON public.agenda_turno_pagos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.agenda_turnos t
            WHERE t.id = agenda_turno_pagos.turno_id
            AND (
                public.is_full_access()
                OR t.duenio_id = auth.uid()
            )
        )
    );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.agenda_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_agenda_servicios_updated
    BEFORE UPDATE ON public.agenda_servicios
    FOR EACH ROW EXECUTE FUNCTION public.agenda_update_updated_at();

CREATE TRIGGER tr_agenda_clientes_updated
    BEFORE UPDATE ON public.agenda_clientes
    FOR EACH ROW EXECUTE FUNCTION public.agenda_update_updated_at();

CREATE TRIGGER tr_agenda_turnos_updated
    BEFORE UPDATE ON public.agenda_turnos
    FOR EACH ROW EXECUTE FUNCTION public.agenda_update_updated_at();

CREATE TRIGGER tr_agenda_disponibilidad_updated
    BEFORE UPDATE ON public.agenda_disponibilidad
    FOR EACH ROW EXECUTE FUNCTION public.agenda_update_updated_at();

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_servicios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_servicio_profesionales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_clientes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_disponibilidad TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_excepciones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_turnos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_turno_servicios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_turno_pagos TO authenticated;

GRANT SELECT ON public.agenda_turnos_completos TO authenticated;

GRANT EXECUTE ON FUNCTION public.verificar_disponibilidad_turno TO authenticated;
GRANT EXECUTE ON FUNCTION public.agenda_estadisticas_cliente TO authenticated;

-- =====================================================
-- MIGRACIONES
-- =====================================================

-- Agregar columna hora_pago si no existe
ALTER TABLE public.agenda_turno_pagos ADD COLUMN IF NOT EXISTS hora_pago TIME;

-- Agregar columna direccion_cliente para turnos a domicilio (dirección completa con piso/depto)
ALTER TABLE public.agenda_turnos ADD COLUMN IF NOT EXISTS direccion_cliente TEXT;
COMMENT ON COLUMN public.agenda_turnos.direccion_cliente IS 'Dirección completa para turnos a domicilio (incluye calle, número, piso, depto, localidad, provincia)';
