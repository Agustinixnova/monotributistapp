-- =====================================================
-- SISTEMA DE AUDITORÍA
-- Registra automáticamente cambios en tablas críticas
-- =====================================================

-- Tabla principal de auditoría
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Quién hizo el cambio
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    usuario_email TEXT,

    -- Qué se hizo
    accion TEXT NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),

    -- Dónde (tabla y registro)
    tabla TEXT NOT NULL,
    registro_id TEXT, -- TEXT para soportar UUID o cualquier tipo de ID

    -- Valores antes/después (JSONB para flexibilidad)
    datos_antes JSONB,
    datos_despues JSONB,

    -- Campos específicos que cambiaron (para búsqueda rápida)
    campos_modificados TEXT[],

    -- Contexto adicional
    descripcion TEXT, -- Descripción legible del cambio
    modulo TEXT, -- Módulo de la app donde ocurrió
    user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario ON public.audit_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tabla ON public.audit_logs(tabla);
CREATE INDEX IF NOT EXISTS idx_audit_logs_registro ON public.audit_logs(registro_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_accion ON public.audit_logs(accion);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_modulo ON public.audit_logs(modulo);

-- =====================================================
-- FUNCIÓN DE TRIGGER GENÉRICA
-- Se puede usar en cualquier tabla
-- =====================================================

CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usuario_id UUID;
    v_usuario_email TEXT;
    v_datos_antes JSONB;
    v_datos_despues JSONB;
    v_registro_id TEXT;
    v_campos_modificados TEXT[];
    v_descripcion TEXT;
    v_key TEXT;
BEGIN
    -- Obtener usuario actual
    v_usuario_id := auth.uid();

    -- Obtener email del usuario
    IF v_usuario_id IS NOT NULL THEN
        SELECT email INTO v_usuario_email
        FROM auth.users
        WHERE id = v_usuario_id;
    END IF;

    -- Preparar datos según la operación
    IF TG_OP = 'DELETE' THEN
        v_datos_antes := to_jsonb(OLD);
        v_datos_despues := NULL;
        v_registro_id := COALESCE(OLD.id::TEXT, 'unknown');
        v_descripcion := 'Registro eliminado';
    ELSIF TG_OP = 'INSERT' THEN
        v_datos_antes := NULL;
        v_datos_despues := to_jsonb(NEW);
        v_registro_id := COALESCE(NEW.id::TEXT, 'unknown');
        v_descripcion := 'Registro creado';
    ELSIF TG_OP = 'UPDATE' THEN
        v_datos_antes := to_jsonb(OLD);
        v_datos_despues := to_jsonb(NEW);
        v_registro_id := COALESCE(NEW.id::TEXT, 'unknown');

        -- Detectar campos que cambiaron
        v_campos_modificados := ARRAY[]::TEXT[];
        FOR v_key IN SELECT jsonb_object_keys(v_datos_despues)
        LOOP
            IF v_datos_antes->v_key IS DISTINCT FROM v_datos_despues->v_key THEN
                v_campos_modificados := array_append(v_campos_modificados, v_key);
            END IF;
        END LOOP;

        -- Crear descripción legible
        IF array_length(v_campos_modificados, 1) > 0 THEN
            v_descripcion := 'Campos modificados: ' || array_to_string(v_campos_modificados, ', ');
        ELSE
            -- No hubo cambios reales, no auditar
            RETURN COALESCE(NEW, OLD);
        END IF;
    END IF;

    -- Insertar en audit_logs
    INSERT INTO public.audit_logs (
        usuario_id,
        usuario_email,
        accion,
        tabla,
        registro_id,
        datos_antes,
        datos_despues,
        campos_modificados,
        descripcion
    ) VALUES (
        v_usuario_id,
        v_usuario_email,
        TG_OP,
        TG_TABLE_NAME,
        v_registro_id,
        v_datos_antes,
        v_datos_despues,
        v_campos_modificados,
        v_descripcion
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- FUNCIÓN PARA REGISTRAR AUDITORÍA MANUAL
-- Usar cuando necesitás loguear acciones que no son CRUD
-- =====================================================

CREATE OR REPLACE FUNCTION public.registrar_auditoria(
    p_accion TEXT,
    p_tabla TEXT,
    p_registro_id TEXT DEFAULT NULL,
    p_descripcion TEXT DEFAULT NULL,
    p_datos_antes JSONB DEFAULT NULL,
    p_datos_despues JSONB DEFAULT NULL,
    p_modulo TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usuario_id UUID;
    v_usuario_email TEXT;
    v_audit_id UUID;
BEGIN
    -- Obtener usuario actual
    v_usuario_id := auth.uid();

    IF v_usuario_id IS NOT NULL THEN
        SELECT email INTO v_usuario_email
        FROM auth.users
        WHERE id = v_usuario_id;
    END IF;

    INSERT INTO public.audit_logs (
        usuario_id,
        usuario_email,
        accion,
        tabla,
        registro_id,
        datos_antes,
        datos_despues,
        descripcion,
        modulo
    ) VALUES (
        v_usuario_id,
        v_usuario_email,
        p_accion,
        p_tabla,
        p_registro_id,
        p_datos_antes,
        p_datos_despues,
        p_descripcion,
        p_modulo
    )
    RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$;

-- =====================================================
-- FUNCIÓN PARA LIMPIAR LOGS VIEJOS (90 días)
-- =====================================================

CREATE OR REPLACE FUNCTION public.limpiar_audit_logs(dias INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM public.audit_logs
    WHERE created_at < NOW() - (dias || ' days')::INTERVAL;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- =====================================================
-- ACTIVAR AUDITORÍA EN TABLAS CRÍTICAS
-- =====================================================

-- Profiles (cambios de usuarios, roles)
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Datos fiscales de clientes
DROP TRIGGER IF EXISTS audit_client_fiscal_data ON public.client_fiscal_data;
CREATE TRIGGER audit_client_fiscal_data
    AFTER INSERT OR UPDATE OR DELETE ON public.client_fiscal_data
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Permisos de roles
DROP TRIGGER IF EXISTS audit_role_permissions ON public.role_permissions;
CREATE TRIGGER audit_role_permissions
    AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Acceso a módulos por usuario
DROP TRIGGER IF EXISTS audit_user_module_access ON public.user_module_access;
CREATE TRIGGER audit_user_module_access
    AFTER INSERT OR UPDATE OR DELETE ON public.user_module_access
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Historial de categorías monotributo
DROP TRIGGER IF EXISTS audit_monotributo_categoria_historial ON public.monotributo_categoria_historial;
CREATE TRIGGER audit_monotributo_categoria_historial
    AFTER INSERT OR UPDATE OR DELETE ON public.monotributo_categoria_historial
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- =====================================================
-- MÓDULO AGENDA & TURNOS (dinero y citas)
-- =====================================================

-- Turnos (cambios, cancelaciones)
DROP TRIGGER IF EXISTS audit_agenda_turnos ON public.agenda_turnos;
CREATE TRIGGER audit_agenda_turnos
    AFTER INSERT OR UPDATE OR DELETE ON public.agenda_turnos
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Pagos de turnos (dinero)
DROP TRIGGER IF EXISTS audit_agenda_turno_pagos ON public.agenda_turno_pagos;
CREATE TRIGGER audit_agenda_turno_pagos
    AFTER INSERT OR UPDATE OR DELETE ON public.agenda_turno_pagos
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Facturas emitidas (AFIP)
DROP TRIGGER IF EXISTS audit_agenda_facturas ON public.agenda_facturas;
CREATE TRIGGER audit_agenda_facturas
    AFTER INSERT OR UPDATE OR DELETE ON public.agenda_facturas
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Configuración AFIP (crítico)
DROP TRIGGER IF EXISTS audit_agenda_config_afip ON public.agenda_config_afip;
CREATE TRIGGER audit_agenda_config_afip
    AFTER INSERT OR UPDATE OR DELETE ON public.agenda_config_afip
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Clientes de agenda
DROP TRIGGER IF EXISTS audit_agenda_clientes ON public.agenda_clientes;
CREATE TRIGGER audit_agenda_clientes
    AFTER INSERT OR UPDATE OR DELETE ON public.agenda_clientes
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- =====================================================
-- MÓDULO CAJA DIARIA (dinero)
-- =====================================================

-- Movimientos de caja (entradas/salidas de dinero)
DROP TRIGGER IF EXISTS audit_caja_movimientos ON public.caja_movimientos;
CREATE TRIGGER audit_caja_movimientos
    AFTER INSERT OR UPDATE OR DELETE ON public.caja_movimientos
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Cierres de caja
DROP TRIGGER IF EXISTS audit_caja_cierres ON public.caja_cierres;
CREATE TRIGGER audit_caja_cierres
    AFTER INSERT OR UPDATE OR DELETE ON public.caja_cierres
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Arqueos de caja
DROP TRIGGER IF EXISTS audit_caja_arqueos ON public.caja_arqueos;
CREATE TRIGGER audit_caja_arqueos
    AFTER INSERT OR UPDATE OR DELETE ON public.caja_arqueos
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Fiados (deudas de clientes)
DROP TRIGGER IF EXISTS audit_caja_fiados ON public.caja_fiados;
CREATE TRIGGER audit_caja_fiados
    AFTER INSERT OR UPDATE OR DELETE ON public.caja_fiados
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Pagos de fiados
DROP TRIGGER IF EXISTS audit_caja_pagos_fiado ON public.caja_pagos_fiado;
CREATE TRIGGER audit_caja_pagos_fiado
    AFTER INSERT OR UPDATE OR DELETE ON public.caja_pagos_fiado
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins/desarrollo pueden ver auditoría
CREATE POLICY "audit_logs_select" ON public.audit_logs
    FOR SELECT USING (public.is_full_access());

-- Solo el sistema puede insertar (via triggers/funciones SECURITY DEFINER)
CREATE POLICY "audit_logs_insert" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Nadie puede modificar o eliminar logs de auditoría (inmutables)
-- (No se crean policies para UPDATE/DELETE)

-- =====================================================
-- GRANT PERMISOS
-- =====================================================

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;
