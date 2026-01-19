-- =====================================================
-- MÓDULO: CAJA DIARIA
-- Descripción: Sistema para registrar entradas y salidas de dinero diarias
-- Fecha: 2026-01-18
-- =====================================================

-- =====================================================
-- TABLA: caja_metodos_pago
-- Métodos de pago configurables (efectivo vs digital)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.caja_metodos_pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    -- NULL = método del sistema, NOT NULL = personalizado
    nombre VARCHAR(50) NOT NULL,
    icono VARCHAR(50) DEFAULT 'Wallet',
    es_efectivo BOOLEAN DEFAULT false,
    es_sistema BOOLEAN DEFAULT false,
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_metodo_por_usuario UNIQUE NULLS NOT DISTINCT (user_id, nombre)
);

CREATE INDEX IF NOT EXISTS idx_caja_metodos_user ON public.caja_metodos_pago(user_id);
CREATE INDEX IF NOT EXISTS idx_caja_metodos_sistema ON public.caja_metodos_pago(es_sistema) WHERE es_sistema = true;

-- =====================================================
-- TABLA: caja_categorias
-- Categorías para clasificar movimientos
-- =====================================================

CREATE TABLE IF NOT EXISTS public.caja_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(50) NOT NULL,
    icono VARCHAR(50) DEFAULT 'List',
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ambos')),
    es_sistema BOOLEAN DEFAULT false,
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_categoria_por_usuario UNIQUE NULLS NOT DISTINCT (user_id, nombre)
);

CREATE INDEX IF NOT EXISTS idx_caja_categorias_user ON public.caja_categorias(user_id);
CREATE INDEX IF NOT EXISTS idx_caja_categorias_tipo ON public.caja_categorias(tipo);
CREATE INDEX IF NOT EXISTS idx_caja_categorias_sistema ON public.caja_categorias(es_sistema) WHERE es_sistema = true;

-- =====================================================
-- TABLA: caja_movimientos
-- Movimientos de caja (entradas y salidas)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.caja_movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora TIME NOT NULL DEFAULT LOCALTIME,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'salida')),
    categoria_id UUID NOT NULL REFERENCES public.caja_categorias(id),
    descripcion VARCHAR(100),
    monto_total DECIMAL(12,2) NOT NULL CHECK (monto_total > 0),
    anulado BOOLEAN DEFAULT false,
    anulado_at TIMESTAMPTZ,
    anulado_motivo VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caja_movimientos_user ON public.caja_movimientos(user_id);
CREATE INDEX IF NOT EXISTS idx_caja_movimientos_fecha ON public.caja_movimientos(fecha);
CREATE INDEX IF NOT EXISTS idx_caja_movimientos_tipo ON public.caja_movimientos(tipo);
CREATE INDEX IF NOT EXISTS idx_caja_movimientos_categoria ON public.caja_movimientos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_caja_movimientos_anulado ON public.caja_movimientos(anulado) WHERE anulado = false;

-- =====================================================
-- TABLA: caja_movimientos_pagos
-- Detalle de pagos (split de pagos)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.caja_movimientos_pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movimiento_id UUID NOT NULL REFERENCES public.caja_movimientos(id) ON DELETE CASCADE,
    metodo_pago_id UUID NOT NULL REFERENCES public.caja_metodos_pago(id),
    monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caja_movimientos_pagos_movimiento ON public.caja_movimientos_pagos(movimiento_id);
CREATE INDEX IF NOT EXISTS idx_caja_movimientos_pagos_metodo ON public.caja_movimientos_pagos(metodo_pago_id);

-- =====================================================
-- TABLA: caja_cierres
-- Cierres de caja diarios
-- =====================================================

CREATE TABLE IF NOT EXISTS public.caja_cierres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    saldo_inicial DECIMAL(12,2) DEFAULT 0,
    efectivo_esperado DECIMAL(12,2) DEFAULT 0,
    efectivo_real DECIMAL(12,2),
    diferencia DECIMAL(12,2) DEFAULT 0,
    motivo_diferencia VARCHAR(200),
    total_entradas DECIMAL(12,2) DEFAULT 0,
    total_salidas DECIMAL(12,2) DEFAULT 0,
    cerrado BOOLEAN DEFAULT false,
    cerrado_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_caja_cierres_user ON public.caja_cierres(user_id);
CREATE INDEX IF NOT EXISTS idx_caja_cierres_fecha ON public.caja_cierres(fecha);
CREATE INDEX IF NOT EXISTS idx_caja_cierres_cerrado ON public.caja_cierres(cerrado);

-- =====================================================
-- RLS POLICIES (usando DROP IF EXISTS para idempotencia)
-- =====================================================

-- Métodos de pago
ALTER TABLE public.caja_metodos_pago ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "caja_metodos_select" ON public.caja_metodos_pago;
CREATE POLICY "caja_metodos_select" ON public.caja_metodos_pago
    FOR SELECT TO authenticated
    USING (es_sistema = true OR user_id = auth.uid());

DROP POLICY IF EXISTS "caja_metodos_insert" ON public.caja_metodos_pago;
CREATE POLICY "caja_metodos_insert" ON public.caja_metodos_pago
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() AND es_sistema = false);

DROP POLICY IF EXISTS "caja_metodos_update" ON public.caja_metodos_pago;
CREATE POLICY "caja_metodos_update" ON public.caja_metodos_pago
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() AND es_sistema = false);

DROP POLICY IF EXISTS "caja_metodos_delete" ON public.caja_metodos_pago;
CREATE POLICY "caja_metodos_delete" ON public.caja_metodos_pago
    FOR DELETE TO authenticated
    USING (user_id = auth.uid() AND es_sistema = false);

-- Categorías
ALTER TABLE public.caja_categorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "caja_categorias_select" ON public.caja_categorias;
CREATE POLICY "caja_categorias_select" ON public.caja_categorias
    FOR SELECT TO authenticated
    USING (es_sistema = true OR user_id = auth.uid());

DROP POLICY IF EXISTS "caja_categorias_insert" ON public.caja_categorias;
CREATE POLICY "caja_categorias_insert" ON public.caja_categorias
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() AND es_sistema = false);

DROP POLICY IF EXISTS "caja_categorias_update" ON public.caja_categorias;
CREATE POLICY "caja_categorias_update" ON public.caja_categorias
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() AND es_sistema = false);

DROP POLICY IF EXISTS "caja_categorias_delete" ON public.caja_categorias;
CREATE POLICY "caja_categorias_delete" ON public.caja_categorias
    FOR DELETE TO authenticated
    USING (user_id = auth.uid() AND es_sistema = false);

-- Movimientos
ALTER TABLE public.caja_movimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "caja_movimientos_select" ON public.caja_movimientos;
CREATE POLICY "caja_movimientos_select" ON public.caja_movimientos
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "caja_movimientos_insert" ON public.caja_movimientos;
CREATE POLICY "caja_movimientos_insert" ON public.caja_movimientos
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "caja_movimientos_update" ON public.caja_movimientos;
CREATE POLICY "caja_movimientos_update" ON public.caja_movimientos
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "caja_movimientos_delete" ON public.caja_movimientos;
CREATE POLICY "caja_movimientos_delete" ON public.caja_movimientos
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Movimientos pagos
ALTER TABLE public.caja_movimientos_pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "caja_movimientos_pagos_select" ON public.caja_movimientos_pagos;
CREATE POLICY "caja_movimientos_pagos_select" ON public.caja_movimientos_pagos
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.caja_movimientos m
            WHERE m.id = movimiento_id AND m.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "caja_movimientos_pagos_insert" ON public.caja_movimientos_pagos;
CREATE POLICY "caja_movimientos_pagos_insert" ON public.caja_movimientos_pagos
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.caja_movimientos m
            WHERE m.id = movimiento_id AND m.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "caja_movimientos_pagos_update" ON public.caja_movimientos_pagos;
CREATE POLICY "caja_movimientos_pagos_update" ON public.caja_movimientos_pagos
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.caja_movimientos m
            WHERE m.id = movimiento_id AND m.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "caja_movimientos_pagos_delete" ON public.caja_movimientos_pagos;
CREATE POLICY "caja_movimientos_pagos_delete" ON public.caja_movimientos_pagos
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.caja_movimientos m
            WHERE m.id = movimiento_id AND m.user_id = auth.uid()
        )
    );

-- Cierres
ALTER TABLE public.caja_cierres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "caja_cierres_select" ON public.caja_cierres;
CREATE POLICY "caja_cierres_select" ON public.caja_cierres
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "caja_cierres_insert" ON public.caja_cierres;
CREATE POLICY "caja_cierres_insert" ON public.caja_cierres
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "caja_cierres_update" ON public.caja_cierres;
CREATE POLICY "caja_cierres_update" ON public.caja_cierres
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "caja_cierres_delete" ON public.caja_cierres;
CREATE POLICY "caja_cierres_delete" ON public.caja_cierres
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- FUNCIONES RPC
-- =====================================================

-- Función: Resumen del día (CORREGIDA - sin duplicación de totales)
CREATE OR REPLACE FUNCTION public.caja_resumen_dia(
    p_user_id UUID,
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_entradas DECIMAL,
    total_salidas DECIMAL,
    saldo DECIMAL,
    efectivo_entradas DECIMAL,
    efectivo_salidas DECIMAL,
    efectivo_saldo DECIMAL,
    digital_entradas DECIMAL,
    digital_salidas DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Totales generales (desde caja_movimientos directo, SIN joins para evitar duplicación)
        COALESCE((
            SELECT SUM(m.monto_total)
            FROM public.caja_movimientos m
            WHERE m.user_id = p_user_id
            AND m.fecha = p_fecha
            AND m.tipo = 'entrada'
            AND m.anulado = false
        ), 0)::DECIMAL as total_entradas,

        COALESCE((
            SELECT SUM(m.monto_total)
            FROM public.caja_movimientos m
            WHERE m.user_id = p_user_id
            AND m.fecha = p_fecha
            AND m.tipo = 'salida'
            AND m.anulado = false
        ), 0)::DECIMAL as total_salidas,

        COALESCE((
            SELECT SUM(CASE WHEN m.tipo = 'entrada' THEN m.monto_total ELSE -m.monto_total END)
            FROM public.caja_movimientos m
            WHERE m.user_id = p_user_id
            AND m.fecha = p_fecha
            AND m.anulado = false
        ), 0)::DECIMAL as saldo,

        -- Efectivo entradas (desde tabla de pagos)
        COALESCE((
            SELECT SUM(mp.monto)
            FROM public.caja_movimientos m
            JOIN public.caja_movimientos_pagos mp ON mp.movimiento_id = m.id
            JOIN public.caja_metodos_pago met ON met.id = mp.metodo_pago_id
            WHERE m.user_id = p_user_id
            AND m.fecha = p_fecha
            AND m.tipo = 'entrada'
            AND m.anulado = false
            AND met.es_efectivo = true
        ), 0)::DECIMAL as efectivo_entradas,

        -- Efectivo salidas (desde tabla de pagos)
        COALESCE((
            SELECT SUM(mp.monto)
            FROM public.caja_movimientos m
            JOIN public.caja_movimientos_pagos mp ON mp.movimiento_id = m.id
            JOIN public.caja_metodos_pago met ON met.id = mp.metodo_pago_id
            WHERE m.user_id = p_user_id
            AND m.fecha = p_fecha
            AND m.tipo = 'salida'
            AND m.anulado = false
            AND met.es_efectivo = true
        ), 0)::DECIMAL as efectivo_salidas,

        -- Efectivo saldo
        COALESCE((
            SELECT SUM(CASE WHEN m.tipo = 'entrada' THEN mp.monto ELSE -mp.monto END)
            FROM public.caja_movimientos m
            JOIN public.caja_movimientos_pagos mp ON mp.movimiento_id = m.id
            JOIN public.caja_metodos_pago met ON met.id = mp.metodo_pago_id
            WHERE m.user_id = p_user_id
            AND m.fecha = p_fecha
            AND m.anulado = false
            AND met.es_efectivo = true
        ), 0)::DECIMAL as efectivo_saldo,

        -- Digital entradas (desde tabla de pagos)
        COALESCE((
            SELECT SUM(mp.monto)
            FROM public.caja_movimientos m
            JOIN public.caja_movimientos_pagos mp ON mp.movimiento_id = m.id
            JOIN public.caja_metodos_pago met ON met.id = mp.metodo_pago_id
            WHERE m.user_id = p_user_id
            AND m.fecha = p_fecha
            AND m.tipo = 'entrada'
            AND m.anulado = false
            AND met.es_efectivo = false
        ), 0)::DECIMAL as digital_entradas,

        -- Digital salidas (desde tabla de pagos)
        COALESCE((
            SELECT SUM(mp.monto)
            FROM public.caja_movimientos m
            JOIN public.caja_movimientos_pagos mp ON mp.movimiento_id = m.id
            JOIN public.caja_metodos_pago met ON met.id = mp.metodo_pago_id
            WHERE m.user_id = p_user_id
            AND m.fecha = p_fecha
            AND m.tipo = 'salida'
            AND m.anulado = false
            AND met.es_efectivo = false
        ), 0)::DECIMAL as digital_salidas;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Función: Totales por método de pago
CREATE OR REPLACE FUNCTION public.caja_totales_por_metodo(
    p_user_id UUID,
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    metodo_id UUID,
    metodo_nombre VARCHAR,
    metodo_icono VARCHAR,
    es_efectivo BOOLEAN,
    total_entradas DECIMAL,
    total_salidas DECIMAL,
    total DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        met.id,
        met.nombre,
        met.icono,
        met.es_efectivo,
        COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN mp.monto END), 0)::DECIMAL,
        COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN mp.monto END), 0)::DECIMAL,
        COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN mp.monto ELSE -mp.monto END), 0)::DECIMAL
    FROM public.caja_metodos_pago met
    LEFT JOIN public.caja_movimientos_pagos mp ON mp.metodo_pago_id = met.id
    LEFT JOIN public.caja_movimientos m ON m.id = mp.movimiento_id
        AND m.user_id = p_user_id
        AND m.fecha = p_fecha
        AND m.anulado = false
    WHERE met.es_sistema = true OR met.user_id = p_user_id
    GROUP BY met.id, met.nombre, met.icono, met.es_efectivo, met.orden
    ORDER BY met.orden;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- DATOS SEED
-- =====================================================

-- Nota: Los datos seed se movieron a la migración 20260119005000_caja_seed_data.sql
-- para evitar problemas con el orden de ejecución de ALTER TABLE

-- (Los INSERT de datos seed fueron movidos a 20260119005000_caja_seed_data.sql)

-- =====================================================
-- REGISTRO DEL MÓDULO
-- =====================================================

DO $$
DECLARE
    v_herramientas_id UUID;
    v_caja_id UUID;
BEGIN
    -- Obtener ID del módulo Herramientas
    SELECT id INTO v_herramientas_id FROM public.modules WHERE slug = 'herramientas';

    -- Insertar módulo Caja Diaria
    INSERT INTO public.modules (name, slug, description, icon, route, parent_id, "order", is_active)
    VALUES (
        'Caja Diaria',
        'caja-diaria',
        'Control de entradas y salidas de dinero diarias',
        'Wallet2',
        '/herramientas/caja-diaria',
        v_herramientas_id,
        3,
        true
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        route = EXCLUDED.route
    RETURNING id INTO v_caja_id;

    -- Asignar módulo a roles (todos los roles excepto operador_gastos)
    INSERT INTO public.role_default_modules (role_id, module_id)
    SELECT r.id, v_caja_id
    FROM public.roles r
    WHERE r.name IN ('admin', 'contadora_principal', 'contador_secundario', 'monotributista', 'responsable_inscripto', 'comunicadora', 'desarrollo')
    ON CONFLICT (role_id, module_id) DO NOTHING;
END $$;
