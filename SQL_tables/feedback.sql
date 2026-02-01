-- =====================================================
-- SISTEMA DE FEEDBACK IN-APP
-- Permite a usuarios reportar problemas y enviar sugerencias
-- =====================================================

CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Usuario que envía
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    usuario_email TEXT,

    -- Contenido
    tipo TEXT NOT NULL CHECK (tipo IN ('bug', 'sugerencia', 'pregunta', 'comentario')),
    descripcion TEXT NOT NULL,

    -- Contexto automático
    url_origen TEXT,
    navegador TEXT,
    viewport TEXT,
    modulo TEXT,

    -- Estado y gestión
    estado TEXT DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'visto', 'en_progreso', 'resuelto')),
    respuesta TEXT,
    respondido_at TIMESTAMPTZ,
    respondido_por UUID REFERENCES auth.users(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_feedback_usuario ON public.feedback(usuario_id);
CREATE INDEX IF NOT EXISTS idx_feedback_estado ON public.feedback(estado);
CREATE INDEX IF NOT EXISTS idx_feedback_tipo ON public.feedback(tipo);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback(created_at DESC);

-- =====================================================
-- FUNCIÓN PARA ENVIAR FEEDBACK
-- =====================================================

CREATE OR REPLACE FUNCTION public.enviar_feedback(
    p_tipo TEXT,
    p_descripcion TEXT,
    p_url_origen TEXT DEFAULT NULL,
    p_navegador TEXT DEFAULT NULL,
    p_viewport TEXT DEFAULT NULL,
    p_modulo TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_feedback_id UUID;
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

    -- Insertar feedback
    INSERT INTO public.feedback (
        usuario_id,
        usuario_email,
        tipo,
        descripcion,
        url_origen,
        navegador,
        viewport,
        modulo
    ) VALUES (
        v_usuario_id,
        v_usuario_email,
        p_tipo,
        p_descripcion,
        p_url_origen,
        p_navegador,
        p_viewport,
        p_modulo
    )
    RETURNING id INTO v_feedback_id;

    RETURN v_feedback_id;
END;
$$;

-- =====================================================
-- FUNCIÓN PARA RESPONDER FEEDBACK
-- (Crea notificación al usuario)
-- =====================================================

CREATE OR REPLACE FUNCTION public.responder_feedback(
    p_feedback_id UUID,
    p_respuesta TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usuario_id UUID;
    v_tipo TEXT;
    v_respondido_por UUID;
BEGIN
    v_respondido_por := auth.uid();

    -- Obtener datos del feedback
    SELECT usuario_id, tipo INTO v_usuario_id, v_tipo
    FROM public.feedback
    WHERE id = p_feedback_id;

    IF v_usuario_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Actualizar feedback
    UPDATE public.feedback
    SET respuesta = p_respuesta,
        estado = 'resuelto',
        respondido_at = NOW(),
        respondido_por = v_respondido_por,
        updated_at = NOW()
    WHERE id = p_feedback_id;

    -- Crear notificación para el usuario
    INSERT INTO public.client_notifications (
        user_id,
        titulo,
        mensaje,
        tipo,
        prioridad
    ) VALUES (
        v_usuario_id,
        CASE v_tipo
            WHEN 'bug' THEN 'Respuesta a tu reporte de error'
            WHEN 'sugerencia' THEN 'Respuesta a tu sugerencia'
            WHEN 'pregunta' THEN 'Respuesta a tu pregunta'
            ELSE 'Respuesta a tu comentario'
        END,
        p_respuesta,
        'info',
        'normal'
    );

    RETURN TRUE;
END;
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden crear su propio feedback
CREATE POLICY "feedback_insert" ON public.feedback
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Usuarios ven solo su feedback, admins ven todo
CREATE POLICY "feedback_select" ON public.feedback
    FOR SELECT USING (
        auth.uid() = usuario_id
        OR public.is_full_access()
    );

-- Solo admins pueden actualizar (responder)
CREATE POLICY "feedback_update" ON public.feedback
    FOR UPDATE USING (public.is_full_access());

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT, INSERT ON public.feedback TO authenticated;
GRANT UPDATE ON public.feedback TO authenticated;
