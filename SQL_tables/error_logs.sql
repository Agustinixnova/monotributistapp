-- =============================================
-- Tabla: error_logs
-- Descripción: Registro de errores del frontend para debugging
-- Creada: 2026-02-01
-- =============================================

CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificación del error
    error_hash TEXT NOT NULL,                    -- Hash para agrupar errores iguales
    mensaje TEXT NOT NULL,                       -- Mensaje del error
    stack_trace TEXT,                            -- Stack trace completo
    component_stack TEXT,                        -- Stack de componentes React

    -- Contexto del usuario
    usuario_id UUID REFERENCES auth.users(id),   -- Quién tuvo el error
    usuario_email TEXT,                          -- Email para referencia rápida
    url TEXT NOT NULL,                           -- URL donde ocurrió
    navegador TEXT,                              -- User agent
    viewport TEXT,                               -- Tamaño de pantalla "375x812"

    -- Clasificación
    modulo TEXT,                                 -- Módulo de la app (extraído de URL)
    severidad TEXT DEFAULT 'error' CHECK (severidad IN ('warning', 'error', 'fatal')),
    tipo TEXT DEFAULT 'javascript' CHECK (tipo IN ('javascript', 'react', 'supabase', 'network', 'manual')),

    -- Contexto adicional
    accion_previa TEXT,                          -- Qué hizo antes del error
    contexto JSONB DEFAULT '{}',                 -- Datos adicionales
    request_data JSONB,                          -- Payload si fue error de request
    supabase_code TEXT,                          -- Código de error de Supabase
    version_app TEXT,                            -- Versión de la app

    -- Gestión
    ocurrencias INTEGER DEFAULT 1,               -- Contador de veces que ocurrió
    estado TEXT DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'visto', 'resuelto', 'ignorado')),
    notas TEXT,                                  -- Notas del desarrollador

    -- Timestamps
    primera_vez TIMESTAMPTZ DEFAULT NOW(),       -- Primera ocurrencia
    ultima_vez TIMESTAMPTZ DEFAULT NOW(),        -- Última ocurrencia
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_error_logs_hash ON public.error_logs(error_hash);
CREATE INDEX IF NOT EXISTS idx_error_logs_usuario ON public.error_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_estado ON public.error_logs(estado);
CREATE INDEX IF NOT EXISTS idx_error_logs_modulo ON public.error_logs(modulo);
CREATE INDEX IF NOT EXISTS idx_error_logs_severidad ON public.error_logs(severidad);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_ultima_vez ON public.error_logs(ultima_vez DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_error_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_error_logs_updated_at ON public.error_logs;
CREATE TRIGGER tr_error_logs_updated_at
    BEFORE UPDATE ON public.error_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_error_logs_updated_at();

-- RLS Policies
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Solo usuarios con acceso total pueden ver errores
CREATE POLICY "error_logs_select_admin" ON public.error_logs
    FOR SELECT USING (public.is_full_access());

-- Cualquier usuario autenticado puede insertar errores (para capturar sus propios errores)
CREATE POLICY "error_logs_insert_authenticated" ON public.error_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Solo admins pueden actualizar (marcar resuelto, agregar notas)
CREATE POLICY "error_logs_update_admin" ON public.error_logs
    FOR UPDATE USING (public.is_full_access());

-- Solo admins pueden eliminar
CREATE POLICY "error_logs_delete_admin" ON public.error_logs
    FOR DELETE USING (public.is_full_access());

-- Función RPC para insertar o incrementar error (evita duplicados)
CREATE OR REPLACE FUNCTION public.registrar_error(
    p_error_hash TEXT,
    p_mensaje TEXT,
    p_stack_trace TEXT DEFAULT NULL,
    p_component_stack TEXT DEFAULT NULL,
    p_url TEXT DEFAULT NULL,
    p_navegador TEXT DEFAULT NULL,
    p_viewport TEXT DEFAULT NULL,
    p_modulo TEXT DEFAULT NULL,
    p_severidad TEXT DEFAULT 'error',
    p_tipo TEXT DEFAULT 'javascript',
    p_accion_previa TEXT DEFAULT NULL,
    p_contexto JSONB DEFAULT '{}',
    p_request_data JSONB DEFAULT NULL,
    p_supabase_code TEXT DEFAULT NULL,
    p_version_app TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_error_id UUID;
    v_usuario_id UUID;
    v_usuario_email TEXT;
BEGIN
    -- Obtener usuario actual
    v_usuario_id := auth.uid();

    -- Obtener email del usuario
    SELECT email INTO v_usuario_email
    FROM auth.users
    WHERE id = v_usuario_id;

    -- Buscar si ya existe un error con el mismo hash que no esté resuelto
    SELECT id INTO v_error_id
    FROM public.error_logs
    WHERE error_hash = p_error_hash
      AND estado NOT IN ('resuelto', 'ignorado')
    LIMIT 1;

    IF v_error_id IS NOT NULL THEN
        -- Incrementar ocurrencias y actualizar última vez
        UPDATE public.error_logs
        SET ocurrencias = ocurrencias + 1,
            ultima_vez = NOW(),
            -- Actualizar usuario si es diferente (último usuario afectado)
            usuario_id = COALESCE(v_usuario_id, usuario_id),
            usuario_email = COALESCE(v_usuario_email, usuario_email)
        WHERE id = v_error_id;
    ELSE
        -- Insertar nuevo error
        INSERT INTO public.error_logs (
            error_hash, mensaje, stack_trace, component_stack,
            usuario_id, usuario_email, url, navegador, viewport,
            modulo, severidad, tipo, accion_previa, contexto,
            request_data, supabase_code, version_app
        ) VALUES (
            p_error_hash, p_mensaje, p_stack_trace, p_component_stack,
            v_usuario_id, v_usuario_email, p_url, p_navegador, p_viewport,
            p_modulo, p_severidad, p_tipo, p_accion_previa, p_contexto,
            p_request_data, p_supabase_code, p_version_app
        )
        RETURNING id INTO v_error_id;
    END IF;

    RETURN v_error_id;
END;
$$;

-- Función para limpiar errores viejos
CREATE OR REPLACE FUNCTION public.limpiar_errores_viejos(dias INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Verificar que el usuario tiene acceso
    IF NOT public.is_full_access() THEN
        RAISE EXCEPTION 'No tienes permisos para esta operación';
    END IF;

    DELETE FROM public.error_logs
    WHERE created_at < NOW() - (dias || ' days')::INTERVAL
      AND estado IN ('resuelto', 'ignorado');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- Comentarios
COMMENT ON TABLE public.error_logs IS 'Registro de errores del frontend para debugging y monitoreo';
COMMENT ON COLUMN public.error_logs.error_hash IS 'Hash MD5 del mensaje+stack para agrupar errores idénticos';
COMMENT ON COLUMN public.error_logs.ocurrencias IS 'Cantidad de veces que ocurrió el mismo error';
COMMENT ON COLUMN public.error_logs.estado IS 'nuevo=sin revisar, visto=revisado, resuelto=arreglado, ignorado=no es problema';
