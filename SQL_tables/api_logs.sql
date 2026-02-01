-- =====================================================
-- SISTEMA DE LOGS DE APIs EXTERNAS
-- Captura requests/responses a ARCA, AFIP y otras APIs
-- =====================================================

CREATE TABLE IF NOT EXISTS public.api_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Identificación
    api TEXT NOT NULL, -- 'arca', 'afip', 'whatsapp', etc.
    endpoint TEXT NOT NULL, -- URL o nombre del endpoint
    metodo TEXT NOT NULL, -- GET, POST, etc.

    -- Request
    request_headers JSONB,
    request_body JSONB,

    -- Response
    status_code INTEGER,
    response_body JSONB,
    response_headers JSONB,

    -- Timing
    duracion_ms INTEGER, -- Tiempo de respuesta en milisegundos

    -- Estado
    exitoso BOOLEAN DEFAULT true,
    error_mensaje TEXT,
    error_codigo TEXT,

    -- Contexto
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    usuario_email TEXT,
    modulo TEXT, -- Desde qué módulo se hizo la llamada
    accion TEXT, -- Qué acción disparó la llamada (ej: 'emitir_factura')
    contexto JSONB, -- Info adicional (turno_id, cliente_id, etc.)

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_api_logs_api ON public.api_logs(api);
CREATE INDEX IF NOT EXISTS idx_api_logs_exitoso ON public.api_logs(exitoso);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON public.api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_usuario ON public.api_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_status ON public.api_logs(status_code);

-- =====================================================
-- FUNCIÓN PARA REGISTRAR LLAMADA A API
-- =====================================================

CREATE OR REPLACE FUNCTION public.registrar_api_log(
    p_api TEXT,
    p_endpoint TEXT,
    p_metodo TEXT,
    p_request_headers JSONB DEFAULT NULL,
    p_request_body JSONB DEFAULT NULL,
    p_status_code INTEGER DEFAULT NULL,
    p_response_body JSONB DEFAULT NULL,
    p_response_headers JSONB DEFAULT NULL,
    p_duracion_ms INTEGER DEFAULT NULL,
    p_exitoso BOOLEAN DEFAULT true,
    p_error_mensaje TEXT DEFAULT NULL,
    p_error_codigo TEXT DEFAULT NULL,
    p_modulo TEXT DEFAULT NULL,
    p_accion TEXT DEFAULT NULL,
    p_contexto JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
    v_usuario_id UUID;
    v_usuario_email TEXT;
BEGIN
    -- Obtener usuario actual
    v_usuario_id := auth.uid();

    IF v_usuario_id IS NOT NULL THEN
        SELECT email INTO v_usuario_email
        FROM auth.users
        WHERE id = v_usuario_id;
    END IF;

    -- Insertar log
    INSERT INTO public.api_logs (
        api,
        endpoint,
        metodo,
        request_headers,
        request_body,
        status_code,
        response_body,
        response_headers,
        duracion_ms,
        exitoso,
        error_mensaje,
        error_codigo,
        usuario_id,
        usuario_email,
        modulo,
        accion,
        contexto
    ) VALUES (
        p_api,
        p_endpoint,
        p_metodo,
        p_request_headers,
        p_request_body,
        p_status_code,
        p_response_body,
        p_response_headers,
        p_duracion_ms,
        p_exitoso,
        p_error_mensaje,
        p_error_codigo,
        v_usuario_id,
        v_usuario_email,
        p_modulo,
        p_accion,
        p_contexto
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- =====================================================
-- FUNCIÓN PARA LIMPIAR LOGS VIEJOS (30 días)
-- =====================================================

CREATE OR REPLACE FUNCTION public.limpiar_api_logs(dias INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM public.api_logs
    WHERE created_at < NOW() - (dias || ' days')::INTERVAL;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins/desarrollo pueden ver logs de API
CREATE POLICY "api_logs_select" ON public.api_logs
    FOR SELECT USING (public.is_full_access());

-- Solo el sistema puede insertar (via función SECURITY DEFINER)
CREATE POLICY "api_logs_insert" ON public.api_logs
    FOR INSERT WITH CHECK (true);

-- Nadie puede modificar o eliminar (inmutables)
-- (No se crean policies para UPDATE/DELETE)

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON public.api_logs TO authenticated;
GRANT INSERT ON public.api_logs TO authenticated;
