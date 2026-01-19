-- =====================================================
-- MIGRACIÓN: Sistema de usuarios gratuitos y empleados de caja
-- Fecha: 2026-01-19
-- Descripción:
--   - Tabla usuarios_free para usuarios que se registran gratis
--   - Rol operador_gastos_empleado
--   - Tabla caja_empleados para vincular empleados con dueños
--   - Modificación de RLS para que empleados vean caja del dueño
-- =====================================================

-- =====================================================
-- 1. CREAR ROL operador_gastos_empleado
-- =====================================================

INSERT INTO public.roles (name, display_name, description, is_system)
VALUES (
    'operador_gastos_empleado',
    'Empleado de Caja',
    'Empleado vinculado a un operador de gastos, accede a la caja del dueño',
    true
)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description;

-- =====================================================
-- 2. TABLA: usuarios_free
-- Para usuarios que se registran gratis (operador_gastos y empleados)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.usuarios_free (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES public.roles(id),
    origen VARCHAR(50) NOT NULL CHECK (origen IN ('recomendacion', 'instagram', 'tiktok', 'google', 'otros')),
    origen_detalle TEXT, -- Para "otros" u observaciones
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_free_email ON public.usuarios_free(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_free_role ON public.usuarios_free(role_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_free_origen ON public.usuarios_free(origen);
CREATE INDEX IF NOT EXISTS idx_usuarios_free_active ON public.usuarios_free(is_active);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_usuarios_free_updated_at ON public.usuarios_free;
CREATE TRIGGER trigger_usuarios_free_updated_at
    BEFORE UPDATE ON public.usuarios_free
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS para usuarios_free
ALTER TABLE public.usuarios_free ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_free_select_own" ON public.usuarios_free;
CREATE POLICY "usuarios_free_select_own" ON public.usuarios_free
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.is_full_access());

DROP POLICY IF EXISTS "usuarios_free_insert" ON public.usuarios_free;
CREATE POLICY "usuarios_free_insert" ON public.usuarios_free
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "usuarios_free_update_own" ON public.usuarios_free;
CREATE POLICY "usuarios_free_update_own" ON public.usuarios_free
    FOR UPDATE TO authenticated
    USING (id = auth.uid() OR public.is_full_access());

COMMENT ON TABLE public.usuarios_free IS 'Usuarios registrados gratis (operador_gastos y empleados)';
COMMENT ON COLUMN public.usuarios_free.origen IS 'Cómo conoció la app: recomendacion, instagram, tiktok, google, otros';

-- =====================================================
-- 3. TABLA: caja_empleados
-- Vinculación entre dueños y empleados con permisos
-- =====================================================

CREATE TABLE IF NOT EXISTS public.caja_empleados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duenio_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empleado_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Permisos configurables
    permisos JSONB NOT NULL DEFAULT '{
        "anular_movimientos": false,
        "eliminar_arqueos": false,
        "editar_saldo_inicial": false,
        "agregar_categorias": false,
        "agregar_metodos_pago": false,
        "editar_cierre": false,
        "reabrir_dia": false
    }'::jsonb,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Un empleado solo puede estar vinculado a un dueño
    CONSTRAINT unique_empleado UNIQUE (empleado_id),
    -- No puede ser su propio empleado
    CONSTRAINT no_self_employee CHECK (duenio_id != empleado_id)
);

CREATE INDEX IF NOT EXISTS idx_caja_empleados_duenio ON public.caja_empleados(duenio_id);
CREATE INDEX IF NOT EXISTS idx_caja_empleados_empleado ON public.caja_empleados(empleado_id);
CREATE INDEX IF NOT EXISTS idx_caja_empleados_activo ON public.caja_empleados(activo) WHERE activo = true;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_caja_empleados_updated_at ON public.caja_empleados;
CREATE TRIGGER trigger_caja_empleados_updated_at
    BEFORE UPDATE ON public.caja_empleados
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS para caja_empleados
ALTER TABLE public.caja_empleados ENABLE ROW LEVEL SECURITY;

-- El dueño puede ver y gestionar sus empleados
DROP POLICY IF EXISTS "caja_empleados_select" ON public.caja_empleados;
CREATE POLICY "caja_empleados_select" ON public.caja_empleados
    FOR SELECT TO authenticated
    USING (duenio_id = auth.uid() OR empleado_id = auth.uid() OR public.is_full_access());

DROP POLICY IF EXISTS "caja_empleados_insert" ON public.caja_empleados;
CREATE POLICY "caja_empleados_insert" ON public.caja_empleados
    FOR INSERT TO authenticated
    WITH CHECK (duenio_id = auth.uid());

DROP POLICY IF EXISTS "caja_empleados_update" ON public.caja_empleados;
CREATE POLICY "caja_empleados_update" ON public.caja_empleados
    FOR UPDATE TO authenticated
    USING (duenio_id = auth.uid());

DROP POLICY IF EXISTS "caja_empleados_delete" ON public.caja_empleados;
CREATE POLICY "caja_empleados_delete" ON public.caja_empleados
    FOR DELETE TO authenticated
    USING (duenio_id = auth.uid());

COMMENT ON TABLE public.caja_empleados IS 'Vinculación entre dueños de negocios y sus empleados de caja';
COMMENT ON COLUMN public.caja_empleados.permisos IS 'Permisos configurables del empleado en la caja';

-- =====================================================
-- 4. FUNCIÓN: get_caja_owner_id()
-- Devuelve el user_id del dueño de la caja para el usuario actual
-- Si es empleado, devuelve el dueño; si no, devuelve a sí mismo
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_caja_owner_id()
RETURNS UUID AS $$
DECLARE
    v_duenio_id UUID;
BEGIN
    -- Buscar si el usuario actual es empleado de alguien
    SELECT duenio_id INTO v_duenio_id
    FROM public.caja_empleados
    WHERE empleado_id = auth.uid() AND activo = true
    LIMIT 1;

    -- Si es empleado, devolver el dueño; si no, devolver a sí mismo
    RETURN COALESCE(v_duenio_id, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_caja_owner_id() IS 'Devuelve el user_id del dueño de la caja (para empleados devuelve el dueño)';

-- =====================================================
-- 5. FUNCIÓN: is_caja_owner_or_employee(user_id)
-- Verifica si el usuario actual es dueño o empleado de la caja especificada
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_caja_owner_or_employee(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Es el propio dueño
    IF p_user_id = auth.uid() THEN
        RETURN true;
    END IF;

    -- Es empleado activo de ese dueño
    IF EXISTS (
        SELECT 1 FROM public.caja_empleados
        WHERE duenio_id = p_user_id
        AND empleado_id = auth.uid()
        AND activo = true
    ) THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_caja_owner_or_employee(UUID) IS 'Verifica si el usuario actual puede acceder a la caja del user_id especificado';

-- =====================================================
-- 6. FUNCIÓN: get_empleado_permiso(permiso_nombre)
-- Obtiene un permiso específico del empleado actual
-- Devuelve true si es dueño, o el valor del permiso si es empleado
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_empleado_permiso(p_permiso TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_permisos JSONB;
BEGIN
    -- Si no es empleado de nadie, tiene todos los permisos (es dueño)
    SELECT permisos INTO v_permisos
    FROM public.caja_empleados
    WHERE empleado_id = auth.uid() AND activo = true
    LIMIT 1;

    -- Si no encontró, es dueño, tiene permiso
    IF v_permisos IS NULL THEN
        RETURN true;
    END IF;

    -- Devolver el permiso específico
    RETURN COALESCE((v_permisos ->> p_permiso)::boolean, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_empleado_permiso(TEXT) IS 'Obtiene un permiso del empleado (true si es dueño)';

-- =====================================================
-- 7. ACTUALIZAR RLS DE TABLAS DE CAJA
-- Para que empleados puedan acceder a datos del dueño
-- =====================================================

-- -------------------- caja_metodos_pago --------------------
DROP POLICY IF EXISTS "caja_metodos_select" ON public.caja_metodos_pago;
CREATE POLICY "caja_metodos_select" ON public.caja_metodos_pago
    FOR SELECT TO authenticated
    USING (
        es_sistema = true
        OR user_id = public.get_caja_owner_id()
    );

DROP POLICY IF EXISTS "caja_metodos_insert" ON public.caja_metodos_pago;
CREATE POLICY "caja_metodos_insert" ON public.caja_metodos_pago
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = public.get_caja_owner_id()
        AND es_sistema = false
        AND public.get_empleado_permiso('agregar_metodos_pago')
    );

DROP POLICY IF EXISTS "caja_metodos_update" ON public.caja_metodos_pago;
CREATE POLICY "caja_metodos_update" ON public.caja_metodos_pago
    FOR UPDATE TO authenticated
    USING (
        user_id = public.get_caja_owner_id()
        AND es_sistema = false
        AND public.get_empleado_permiso('agregar_metodos_pago')
    );

DROP POLICY IF EXISTS "caja_metodos_delete" ON public.caja_metodos_pago;
CREATE POLICY "caja_metodos_delete" ON public.caja_metodos_pago
    FOR DELETE TO authenticated
    USING (
        user_id = public.get_caja_owner_id()
        AND es_sistema = false
        AND public.get_empleado_permiso('agregar_metodos_pago')
    );

-- -------------------- caja_categorias --------------------
DROP POLICY IF EXISTS "caja_categorias_select" ON public.caja_categorias;
CREATE POLICY "caja_categorias_select" ON public.caja_categorias
    FOR SELECT TO authenticated
    USING (
        es_sistema = true
        OR user_id = public.get_caja_owner_id()
    );

DROP POLICY IF EXISTS "caja_categorias_insert" ON public.caja_categorias;
CREATE POLICY "caja_categorias_insert" ON public.caja_categorias
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = public.get_caja_owner_id()
        AND es_sistema = false
        AND public.get_empleado_permiso('agregar_categorias')
    );

DROP POLICY IF EXISTS "caja_categorias_update" ON public.caja_categorias;
CREATE POLICY "caja_categorias_update" ON public.caja_categorias
    FOR UPDATE TO authenticated
    USING (
        user_id = public.get_caja_owner_id()
        AND es_sistema = false
        AND public.get_empleado_permiso('agregar_categorias')
    );

DROP POLICY IF EXISTS "caja_categorias_delete" ON public.caja_categorias;
CREATE POLICY "caja_categorias_delete" ON public.caja_categorias
    FOR DELETE TO authenticated
    USING (
        user_id = public.get_caja_owner_id()
        AND es_sistema = false
        AND public.get_empleado_permiso('agregar_categorias')
    );

-- -------------------- caja_movimientos --------------------
DROP POLICY IF EXISTS "caja_movimientos_select" ON public.caja_movimientos;
CREATE POLICY "caja_movimientos_select" ON public.caja_movimientos
    FOR SELECT TO authenticated
    USING (public.is_caja_owner_or_employee(user_id));

DROP POLICY IF EXISTS "caja_movimientos_insert" ON public.caja_movimientos;
CREATE POLICY "caja_movimientos_insert" ON public.caja_movimientos
    FOR INSERT TO authenticated
    WITH CHECK (user_id = public.get_caja_owner_id());

DROP POLICY IF EXISTS "caja_movimientos_update" ON public.caja_movimientos;
CREATE POLICY "caja_movimientos_update" ON public.caja_movimientos
    FOR UPDATE TO authenticated
    USING (
        public.is_caja_owner_or_employee(user_id)
        AND public.get_empleado_permiso('anular_movimientos')
    );

DROP POLICY IF EXISTS "caja_movimientos_delete" ON public.caja_movimientos;
CREATE POLICY "caja_movimientos_delete" ON public.caja_movimientos
    FOR DELETE TO authenticated
    USING (
        public.is_caja_owner_or_employee(user_id)
        AND public.get_empleado_permiso('anular_movimientos')
    );

-- -------------------- caja_movimientos_pagos --------------------
DROP POLICY IF EXISTS "caja_movimientos_pagos_select" ON public.caja_movimientos_pagos;
CREATE POLICY "caja_movimientos_pagos_select" ON public.caja_movimientos_pagos
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.caja_movimientos m
            WHERE m.id = movimiento_id
            AND public.is_caja_owner_or_employee(m.user_id)
        )
    );

DROP POLICY IF EXISTS "caja_movimientos_pagos_insert" ON public.caja_movimientos_pagos;
CREATE POLICY "caja_movimientos_pagos_insert" ON public.caja_movimientos_pagos
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.caja_movimientos m
            WHERE m.id = movimiento_id
            AND m.user_id = public.get_caja_owner_id()
        )
    );

DROP POLICY IF EXISTS "caja_movimientos_pagos_update" ON public.caja_movimientos_pagos;
CREATE POLICY "caja_movimientos_pagos_update" ON public.caja_movimientos_pagos
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.caja_movimientos m
            WHERE m.id = movimiento_id
            AND public.is_caja_owner_or_employee(m.user_id)
            AND public.get_empleado_permiso('anular_movimientos')
        )
    );

DROP POLICY IF EXISTS "caja_movimientos_pagos_delete" ON public.caja_movimientos_pagos;
CREATE POLICY "caja_movimientos_pagos_delete" ON public.caja_movimientos_pagos
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.caja_movimientos m
            WHERE m.id = movimiento_id
            AND public.is_caja_owner_or_employee(m.user_id)
            AND public.get_empleado_permiso('anular_movimientos')
        )
    );

-- -------------------- caja_cierres --------------------
DROP POLICY IF EXISTS "caja_cierres_select" ON public.caja_cierres;
CREATE POLICY "caja_cierres_select" ON public.caja_cierres
    FOR SELECT TO authenticated
    USING (public.is_caja_owner_or_employee(user_id));

DROP POLICY IF EXISTS "caja_cierres_insert" ON public.caja_cierres;
CREATE POLICY "caja_cierres_insert" ON public.caja_cierres
    FOR INSERT TO authenticated
    WITH CHECK (user_id = public.get_caja_owner_id());

DROP POLICY IF EXISTS "caja_cierres_update" ON public.caja_cierres;
CREATE POLICY "caja_cierres_update" ON public.caja_cierres
    FOR UPDATE TO authenticated
    USING (
        public.is_caja_owner_or_employee(user_id)
        AND public.get_empleado_permiso('editar_cierre')
    );

DROP POLICY IF EXISTS "caja_cierres_delete" ON public.caja_cierres;
CREATE POLICY "caja_cierres_delete" ON public.caja_cierres
    FOR DELETE TO authenticated
    USING (
        public.is_caja_owner_or_employee(user_id)
        AND public.get_empleado_permiso('reabrir_dia')
    );

-- -------------------- caja_arqueos --------------------
DROP POLICY IF EXISTS "caja_arqueos_select" ON public.caja_arqueos;
CREATE POLICY "caja_arqueos_select" ON public.caja_arqueos
    FOR SELECT TO authenticated
    USING (public.is_caja_owner_or_employee(user_id));

DROP POLICY IF EXISTS "caja_arqueos_insert" ON public.caja_arqueos;
CREATE POLICY "caja_arqueos_insert" ON public.caja_arqueos
    FOR INSERT TO authenticated
    WITH CHECK (user_id = public.get_caja_owner_id());

DROP POLICY IF EXISTS "caja_arqueos_update" ON public.caja_arqueos;
CREATE POLICY "caja_arqueos_update" ON public.caja_arqueos
    FOR UPDATE TO authenticated
    USING (
        public.is_caja_owner_or_employee(user_id)
        AND public.get_empleado_permiso('eliminar_arqueos')
    );

DROP POLICY IF EXISTS "caja_arqueos_delete" ON public.caja_arqueos;
CREATE POLICY "caja_arqueos_delete" ON public.caja_arqueos
    FOR DELETE TO authenticated
    USING (
        public.is_caja_owner_or_employee(user_id)
        AND public.get_empleado_permiso('eliminar_arqueos')
    );

-- -------------------- caja_configuracion --------------------
DROP POLICY IF EXISTS "caja_configuracion_select" ON public.caja_configuracion;
CREATE POLICY "caja_configuracion_select" ON public.caja_configuracion
    FOR SELECT TO authenticated
    USING (public.is_caja_owner_or_employee(user_id));

DROP POLICY IF EXISTS "caja_configuracion_insert" ON public.caja_configuracion;
CREATE POLICY "caja_configuracion_insert" ON public.caja_configuracion
    FOR INSERT TO authenticated
    WITH CHECK (user_id = public.get_caja_owner_id());

-- Solo el dueño puede modificar la configuración (nombre del negocio)
DROP POLICY IF EXISTS "caja_configuracion_update" ON public.caja_configuracion;
CREATE POLICY "caja_configuracion_update" ON public.caja_configuracion
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid()); -- Solo el dueño real, no empleados

DROP POLICY IF EXISTS "caja_configuracion_delete" ON public.caja_configuracion;
CREATE POLICY "caja_configuracion_delete" ON public.caja_configuracion
    FOR DELETE TO authenticated
    USING (user_id = auth.uid()); -- Solo el dueño real

-- =====================================================
-- 8. ASIGNAR MÓDULOS A LOS ROLES
-- operador_gastos: Herramientas, Educación Impositiva
-- operador_gastos_empleado: igual
-- =====================================================

DO $$
DECLARE
    v_rol_operador UUID;
    v_rol_empleado UUID;
    v_mod_herramientas UUID;
    v_mod_educacion UUID;
    v_mod_panel_eco UUID;
    v_mod_caja UUID;
    v_mod_finanzas UUID;
BEGIN
    -- Obtener IDs de roles
    SELECT id INTO v_rol_operador FROM public.roles WHERE name = 'operador_gastos';
    SELECT id INTO v_rol_empleado FROM public.roles WHERE name = 'operador_gastos_empleado';

    -- Obtener IDs de módulos
    SELECT id INTO v_mod_herramientas FROM public.modules WHERE slug = 'herramientas';
    SELECT id INTO v_mod_educacion FROM public.modules WHERE slug = 'educacion-impositiva';
    SELECT id INTO v_mod_panel_eco FROM public.modules WHERE slug = 'panel-economico';
    SELECT id INTO v_mod_caja FROM public.modules WHERE slug = 'caja-diaria';
    SELECT id INTO v_mod_finanzas FROM public.modules WHERE slug = 'mis-finanzas';

    -- Asignar módulos a operador_gastos (si no están asignados)
    IF v_rol_operador IS NOT NULL THEN
        -- Herramientas (padre)
        IF v_mod_herramientas IS NOT NULL THEN
            INSERT INTO public.role_default_modules (role_id, module_id)
            VALUES (v_rol_operador, v_mod_herramientas)
            ON CONFLICT (role_id, module_id) DO NOTHING;
        END IF;

        -- Educación impositiva
        IF v_mod_educacion IS NOT NULL THEN
            INSERT INTO public.role_default_modules (role_id, module_id)
            VALUES (v_rol_operador, v_mod_educacion)
            ON CONFLICT (role_id, module_id) DO NOTHING;
        END IF;

        -- Panel económico (submódulo de herramientas)
        IF v_mod_panel_eco IS NOT NULL THEN
            INSERT INTO public.role_default_modules (role_id, module_id)
            VALUES (v_rol_operador, v_mod_panel_eco)
            ON CONFLICT (role_id, module_id) DO NOTHING;
        END IF;

        -- Caja diaria (submódulo de herramientas)
        IF v_mod_caja IS NOT NULL THEN
            INSERT INTO public.role_default_modules (role_id, module_id)
            VALUES (v_rol_operador, v_mod_caja)
            ON CONFLICT (role_id, module_id) DO NOTHING;
        END IF;

        -- Mis finanzas (submódulo de herramientas)
        IF v_mod_finanzas IS NOT NULL THEN
            INSERT INTO public.role_default_modules (role_id, module_id)
            VALUES (v_rol_operador, v_mod_finanzas)
            ON CONFLICT (role_id, module_id) DO NOTHING;
        END IF;

        RAISE NOTICE 'Módulos asignados a operador_gastos';
    END IF;

    -- Asignar los mismos módulos a operador_gastos_empleado
    IF v_rol_empleado IS NOT NULL THEN
        IF v_mod_herramientas IS NOT NULL THEN
            INSERT INTO public.role_default_modules (role_id, module_id)
            VALUES (v_rol_empleado, v_mod_herramientas)
            ON CONFLICT (role_id, module_id) DO NOTHING;
        END IF;

        IF v_mod_educacion IS NOT NULL THEN
            INSERT INTO public.role_default_modules (role_id, module_id)
            VALUES (v_rol_empleado, v_mod_educacion)
            ON CONFLICT (role_id, module_id) DO NOTHING;
        END IF;

        IF v_mod_panel_eco IS NOT NULL THEN
            INSERT INTO public.role_default_modules (role_id, module_id)
            VALUES (v_rol_empleado, v_mod_panel_eco)
            ON CONFLICT (role_id, module_id) DO NOTHING;
        END IF;

        IF v_mod_caja IS NOT NULL THEN
            INSERT INTO public.role_default_modules (role_id, module_id)
            VALUES (v_rol_empleado, v_mod_caja)
            ON CONFLICT (role_id, module_id) DO NOTHING;
        END IF;

        IF v_mod_finanzas IS NOT NULL THEN
            INSERT INTO public.role_default_modules (role_id, module_id)
            VALUES (v_rol_empleado, v_mod_finanzas)
            ON CONFLICT (role_id, module_id) DO NOTHING;
        END IF;

        RAISE NOTICE 'Módulos asignados a operador_gastos_empleado';
    END IF;
END $$;

-- =====================================================
-- 9. ACTUALIZAR FUNCIÓN caja_resumen_dia PARA USAR get_caja_owner_id
-- =====================================================

CREATE OR REPLACE FUNCTION public.caja_resumen_dia(p_fecha DATE)
RETURNS TABLE (
    total_entradas DECIMAL(12,2),
    total_salidas DECIMAL(12,2),
    saldo DECIMAL(12,2),
    cantidad_movimientos INT,
    efectivo_entradas DECIMAL(12,2),
    efectivo_salidas DECIMAL(12,2)
) AS $$
DECLARE
    v_owner_id UUID;
BEGIN
    -- Obtener el dueño de la caja (puede ser el usuario o su dueño si es empleado)
    v_owner_id := public.get_caja_owner_id();

    RETURN QUERY
    WITH totales AS (
        SELECT
            COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.monto_total ELSE 0 END), 0) as sum_entradas,
            COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN m.monto_total ELSE 0 END), 0) as sum_salidas,
            COUNT(*)::INT as cant
        FROM public.caja_movimientos m
        WHERE m.user_id = v_owner_id
        AND m.fecha = p_fecha
        AND m.anulado = false
    ),
    efectivo AS (
        SELECT
            COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN p.monto ELSE 0 END), 0) as efe_entradas,
            COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN p.monto ELSE 0 END), 0) as efe_salidas
        FROM public.caja_movimientos m
        INNER JOIN public.caja_movimientos_pagos p ON p.movimiento_id = m.id
        INNER JOIN public.caja_metodos_pago mp ON mp.id = p.metodo_pago_id
        WHERE m.user_id = v_owner_id
        AND m.fecha = p_fecha
        AND m.anulado = false
        AND mp.es_efectivo = true
    )
    SELECT
        t.sum_entradas::DECIMAL(12,2),
        t.sum_salidas::DECIMAL(12,2),
        (t.sum_entradas - t.sum_salidas)::DECIMAL(12,2),
        t.cant,
        e.efe_entradas::DECIMAL(12,2),
        e.efe_salidas::DECIMAL(12,2)
    FROM totales t, efectivo e;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 10. ACTUALIZAR FUNCIÓN caja_totales_por_metodo PARA USAR get_caja_owner_id
-- =====================================================

CREATE OR REPLACE FUNCTION public.caja_totales_por_metodo(p_fecha DATE)
RETURNS TABLE (
    metodo_id UUID,
    metodo_nombre VARCHAR(50),
    metodo_icono VARCHAR(50),
    es_efectivo BOOLEAN,
    total_entradas DECIMAL(12,2),
    total_salidas DECIMAL(12,2)
) AS $$
DECLARE
    v_owner_id UUID;
BEGIN
    v_owner_id := public.get_caja_owner_id();

    RETURN QUERY
    SELECT
        mp.id as metodo_id,
        mp.nombre as metodo_nombre,
        mp.icono as metodo_icono,
        mp.es_efectivo,
        COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN p.monto ELSE 0 END), 0)::DECIMAL(12,2) as total_entradas,
        COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN p.monto ELSE 0 END), 0)::DECIMAL(12,2) as total_salidas
    FROM public.caja_metodos_pago mp
    LEFT JOIN public.caja_movimientos_pagos p ON p.metodo_pago_id = mp.id
    LEFT JOIN public.caja_movimientos m ON m.id = p.movimiento_id
        AND m.fecha = p_fecha
        AND m.anulado = false
        AND m.user_id = v_owner_id
    WHERE (mp.es_sistema = true OR mp.user_id = v_owner_id)
    AND mp.activo = true
    GROUP BY mp.id, mp.nombre, mp.icono, mp.es_efectivo, mp.orden
    ORDER BY mp.orden, mp.nombre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.caja_resumen_dia(DATE) IS 'Resumen del día para el dueño de la caja (soporta empleados)';
COMMENT ON FUNCTION public.caja_totales_por_metodo(DATE) IS 'Totales por método de pago para el dueño de la caja (soporta empleados)';
