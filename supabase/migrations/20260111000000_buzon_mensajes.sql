-- =============================================
-- MODULO BUZON DE MENSAJES
-- Comunicacion entre clientes y contadoras
-- =============================================

-- ========================================
-- 1. TABLA DE CONVERSACIONES (HILOS)
-- ========================================
CREATE TABLE IF NOT EXISTS public.buzon_conversaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Usuario que inicia la conversacion
    iniciado_por UUID NOT NULL REFERENCES public.profiles(id),

    -- Asunto del mensaje
    asunto TEXT NOT NULL,

    -- Contexto de donde se origino (para referencia)
    origen TEXT DEFAULT 'general', -- 'facturacion', 'recategorizacion', 'exclusion', 'general', etc.
    origen_referencia JSONB, -- Datos adicionales del contexto (ej: {client_id: '...', mes: 1, anio: 2026})

    -- Estado de la conversacion
    estado TEXT DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada', 'archivada')),

    -- Ultimo mensaje (para ordenar)
    ultimo_mensaje_at TIMESTAMPTZ DEFAULT NOW(),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversaciones_iniciado_por ON public.buzon_conversaciones(iniciado_por);
CREATE INDEX IF NOT EXISTS idx_conversaciones_estado ON public.buzon_conversaciones(estado);
CREATE INDEX IF NOT EXISTS idx_conversaciones_ultimo_mensaje ON public.buzon_conversaciones(ultimo_mensaje_at DESC);

-- ========================================
-- 2. TABLA DE MENSAJES
-- ========================================
CREATE TABLE IF NOT EXISTS public.buzon_mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Conversacion a la que pertenece
    conversacion_id UUID NOT NULL REFERENCES public.buzon_conversaciones(id) ON DELETE CASCADE,

    -- Quien envia el mensaje
    enviado_por UUID NOT NULL REFERENCES public.profiles(id),

    -- Contenido del mensaje
    contenido TEXT NOT NULL,

    -- Archivos adjuntos (opcional)
    adjuntos JSONB DEFAULT '[]'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON public.buzon_mensajes(conversacion_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_enviado_por ON public.buzon_mensajes(enviado_por);
CREATE INDEX IF NOT EXISTS idx_mensajes_created ON public.buzon_mensajes(created_at);

-- ========================================
-- 3. TABLA DE PARTICIPANTES
-- (Quienes pueden ver/responder la conversacion)
-- ========================================
CREATE TABLE IF NOT EXISTS public.buzon_participantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversacion_id UUID NOT NULL REFERENCES public.buzon_conversaciones(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),

    -- Estado de lectura
    leido BOOLEAN DEFAULT FALSE,
    ultimo_leido_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(conversacion_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participantes_user ON public.buzon_participantes(user_id);
CREATE INDEX IF NOT EXISTS idx_participantes_conversacion ON public.buzon_participantes(conversacion_id);
CREATE INDEX IF NOT EXISTS idx_participantes_no_leido ON public.buzon_participantes(user_id, leido) WHERE leido = FALSE;

-- ========================================
-- 4. TRIGGER PARA ACTUALIZAR ultimo_mensaje_at
-- ========================================
CREATE OR REPLACE FUNCTION public.actualizar_ultimo_mensaje()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.buzon_conversaciones
    SET ultimo_mensaje_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversacion_id;

    -- Marcar como no leido para todos los participantes excepto el que envio
    UPDATE public.buzon_participantes
    SET leido = FALSE
    WHERE conversacion_id = NEW.conversacion_id
    AND user_id != NEW.enviado_por;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_ultimo_mensaje ON public.buzon_mensajes;
CREATE TRIGGER trigger_actualizar_ultimo_mensaje
    AFTER INSERT ON public.buzon_mensajes
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_ultimo_mensaje();

-- ========================================
-- 5. FUNCION PARA CREAR CONVERSACION
-- ========================================
CREATE OR REPLACE FUNCTION public.crear_conversacion_buzon(
    p_iniciado_por UUID,
    p_asunto TEXT,
    p_contenido TEXT,
    p_origen TEXT DEFAULT 'general',
    p_origen_referencia JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_conversacion_id UUID;
    v_contador_asignado UUID;
    v_rol_iniciador TEXT;
BEGIN
    -- Crear conversacion
    INSERT INTO public.buzon_conversaciones (
        iniciado_por, asunto, origen, origen_referencia
    )
    VALUES (
        p_iniciado_por, p_asunto, p_origen, p_origen_referencia
    )
    RETURNING id INTO v_conversacion_id;

    -- Crear primer mensaje
    INSERT INTO public.buzon_mensajes (
        conversacion_id, enviado_por, contenido
    )
    VALUES (
        v_conversacion_id, p_iniciado_por, p_contenido
    );

    -- Agregar al iniciador como participante
    INSERT INTO public.buzon_participantes (conversacion_id, user_id, leido)
    VALUES (v_conversacion_id, p_iniciado_por, TRUE);

    -- Obtener rol del iniciador
    SELECT r.name INTO v_rol_iniciador
    FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = p_iniciado_por;

    -- Si es cliente, agregar contadoras como participantes
    IF v_rol_iniciador IN ('monotributista', 'responsable_inscripto') THEN
        -- Agregar admin, contadora_principal, desarrollo, comunicadora
        INSERT INTO public.buzon_participantes (conversacion_id, user_id, leido)
        SELECT v_conversacion_id, p.id, FALSE
        FROM public.profiles p
        JOIN public.roles r ON p.role_id = r.id
        WHERE r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora')
        AND p.is_active = TRUE
        ON CONFLICT (conversacion_id, user_id) DO NOTHING;

        -- Agregar contador_secundario asignado si existe
        SELECT assigned_to INTO v_contador_asignado
        FROM public.profiles
        WHERE id = p_iniciado_por;

        IF v_contador_asignado IS NOT NULL THEN
            INSERT INTO public.buzon_participantes (conversacion_id, user_id, leido)
            VALUES (v_conversacion_id, v_contador_asignado, FALSE)
            ON CONFLICT (conversacion_id, user_id) DO NOTHING;
        END IF;
    ELSE
        -- Si es contadora, agregar al cliente de la conversacion (si aplica por origen_referencia)
        -- Por ahora, las contadoras pueden iniciar conversaciones generales
        NULL;
    END IF;

    RETURN v_conversacion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 6. FUNCION PARA RESPONDER MENSAJE
-- ========================================
CREATE OR REPLACE FUNCTION public.responder_conversacion(
    p_conversacion_id UUID,
    p_user_id UUID,
    p_contenido TEXT
)
RETURNS UUID AS $$
DECLARE
    v_mensaje_id UUID;
BEGIN
    -- Verificar que el usuario es participante
    IF NOT EXISTS (
        SELECT 1 FROM public.buzon_participantes
        WHERE conversacion_id = p_conversacion_id
        AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Usuario no es participante de esta conversacion';
    END IF;

    -- Crear mensaje
    INSERT INTO public.buzon_mensajes (
        conversacion_id, enviado_por, contenido
    )
    VALUES (
        p_conversacion_id, p_user_id, p_contenido
    )
    RETURNING id INTO v_mensaje_id;

    -- Marcar como leido para el que responde
    UPDATE public.buzon_participantes
    SET leido = TRUE, ultimo_leido_at = NOW()
    WHERE conversacion_id = p_conversacion_id
    AND user_id = p_user_id;

    RETURN v_mensaje_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 7. RLS POLICIES
-- ========================================
ALTER TABLE public.buzon_conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buzon_mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buzon_participantes ENABLE ROW LEVEL SECURITY;

-- Conversaciones: Solo participantes pueden ver
DROP POLICY IF EXISTS "conversaciones_select" ON public.buzon_conversaciones;
CREATE POLICY "conversaciones_select" ON public.buzon_conversaciones
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.buzon_participantes bp
            WHERE bp.conversacion_id = buzon_conversaciones.id
            AND bp.user_id = auth.uid()
        )
    );

-- Conversaciones: Cualquier usuario autenticado puede crear
DROP POLICY IF EXISTS "conversaciones_insert" ON public.buzon_conversaciones;
CREATE POLICY "conversaciones_insert" ON public.buzon_conversaciones
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Conversaciones: Solo contadoras pueden actualizar estado
DROP POLICY IF EXISTS "conversaciones_update" ON public.buzon_conversaciones;
CREATE POLICY "conversaciones_update" ON public.buzon_conversaciones
    FOR UPDATE USING (
        public.is_full_access()
    );

-- Mensajes: Solo participantes de la conversacion pueden ver
DROP POLICY IF EXISTS "mensajes_select" ON public.buzon_mensajes;
CREATE POLICY "mensajes_select" ON public.buzon_mensajes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.buzon_participantes bp
            WHERE bp.conversacion_id = buzon_mensajes.conversacion_id
            AND bp.user_id = auth.uid()
        )
    );

-- Mensajes: Participantes pueden insertar
DROP POLICY IF EXISTS "mensajes_insert" ON public.buzon_mensajes;
CREATE POLICY "mensajes_insert" ON public.buzon_mensajes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.buzon_participantes bp
            WHERE bp.conversacion_id = conversacion_id
            AND bp.user_id = auth.uid()
        )
    );

-- Participantes: Usuario ve sus participaciones
DROP POLICY IF EXISTS "participantes_select" ON public.buzon_participantes;
CREATE POLICY "participantes_select" ON public.buzon_participantes
    FOR SELECT USING (user_id = auth.uid());

-- Participantes: Sistema puede insertar (via funciones SECURITY DEFINER)
DROP POLICY IF EXISTS "participantes_insert" ON public.buzon_participantes;
CREATE POLICY "participantes_insert" ON public.buzon_participantes
    FOR INSERT WITH CHECK (TRUE);

-- Participantes: Usuario puede actualizar su leido
DROP POLICY IF EXISTS "participantes_update" ON public.buzon_participantes;
CREATE POLICY "participantes_update" ON public.buzon_participantes
    FOR UPDATE USING (user_id = auth.uid());

-- ========================================
-- 8. COMENTARIOS
-- ========================================
COMMENT ON TABLE public.buzon_conversaciones IS 'Hilos de conversacion del buzon de mensajes';
COMMENT ON TABLE public.buzon_mensajes IS 'Mensajes individuales dentro de una conversacion';
COMMENT ON TABLE public.buzon_participantes IS 'Usuarios que participan en cada conversacion';
COMMENT ON FUNCTION public.crear_conversacion_buzon IS 'Crea una nueva conversacion y agrega participantes automaticamente';
COMMENT ON FUNCTION public.responder_conversacion IS 'Agrega un mensaje de respuesta a una conversacion existente';
