-- =============================================
-- Tabla: notificaciones
-- Descripción: Sistema de notificaciones y alertas
-- =============================================

CREATE TABLE IF NOT EXISTS public.notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Destinatario
    destinatario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Referencia a cliente (opcional, para alertas de clientes)
    client_id UUID REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,

    -- Tipo de notificación
    tipo TEXT NOT NULL CHECK (tipo IN (
        'riesgo_exclusion',
        'cerca_recategorizacion',
        'vencimiento_cuota',
        'cuota_vencida',
        'recategorizacion_periodica',
        'facturacion_pendiente',
        'mensaje_nuevo',
        'documento_nuevo',
        'sistema'
    )),

    -- Contenido
    titulo TEXT NOT NULL,
    mensaje TEXT,

    -- Prioridad visual
    prioridad TEXT DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),

    -- Link para navegar al detalle
    link_to TEXT,

    -- Anti-duplicado: hash único del evento
    hash_evento TEXT,

    -- Estado
    leida BOOLEAN DEFAULT FALSE,
    leida_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notificaciones_destinatario ON public.notificaciones(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_no_leidas ON public.notificaciones(destinatario_id) WHERE leida = FALSE;
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON public.notificaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created ON public.notificaciones(created_at DESC);

-- Índice único parcial para evitar duplicados del mismo evento
CREATE UNIQUE INDEX IF NOT EXISTS idx_notificaciones_hash_unico
ON public.notificaciones(hash_evento)
WHERE hash_evento IS NOT NULL;

COMMENT ON TABLE public.notificaciones IS 'Sistema de notificaciones y alertas';
COMMENT ON COLUMN public.notificaciones.hash_evento IS 'Hash único para evitar duplicar la misma alerta. Ej: riesgo_exclusion:client_uuid:2025-01';

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- SELECT: Cada usuario solo ve sus notificaciones
CREATE POLICY "notificaciones_select_own" ON public.notificaciones
    FOR SELECT USING (destinatario_id = auth.uid());

-- SELECT: Admin y desarrollo pueden ver todas
CREATE POLICY "notificaciones_select_admin" ON public.notificaciones
    FOR SELECT USING (public.is_full_access());

-- UPDATE: Usuario puede marcar como leída solo las suyas
CREATE POLICY "notificaciones_update_own" ON public.notificaciones
    FOR UPDATE USING (destinatario_id = auth.uid())
    WITH CHECK (destinatario_id = auth.uid());

-- DELETE: Solo admin
CREATE POLICY "notificaciones_delete_admin" ON public.notificaciones
    FOR DELETE USING (public.is_full_access());

-- =============================================
-- Función SEGURA para crear notificaciones
-- =============================================

CREATE OR REPLACE FUNCTION public.crear_notificacion(
    p_destinatario_id UUID,
    p_tipo TEXT,
    p_titulo TEXT,
    p_mensaje TEXT DEFAULT NULL,
    p_client_id UUID DEFAULT NULL,
    p_link_to TEXT DEFAULT NULL,
    p_prioridad TEXT DEFAULT 'normal',
    p_hash_evento TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notificacion_id UUID;
BEGIN
    -- Si hay hash_evento, verificar que no exista
    IF p_hash_evento IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.notificaciones WHERE hash_evento = p_hash_evento) THEN
            RETURN NULL;
        END IF;
    END IF;

    INSERT INTO public.notificaciones (
        destinatario_id, tipo, titulo, mensaje, client_id, link_to, prioridad, hash_evento
    ) VALUES (
        p_destinatario_id, p_tipo, p_titulo, p_mensaje, p_client_id, p_link_to, p_prioridad, p_hash_evento
    )
    RETURNING id INTO v_notificacion_id;

    RETURN v_notificacion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.crear_notificacion IS 'Crea una notificación de forma segura. Solo callable desde service_role (Edge Functions)';

-- =============================================
-- Función para marcar notificación como leída
-- =============================================

CREATE OR REPLACE FUNCTION public.marcar_notificacion_leida(p_notificacion_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.notificaciones
    SET leida = TRUE, leida_at = NOW()
    WHERE id = p_notificacion_id AND destinatario_id = auth.uid();

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Función para marcar todas como leídas
-- =============================================

CREATE OR REPLACE FUNCTION public.marcar_todas_notificaciones_leidas()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.notificaciones
    SET leida = TRUE, leida_at = NOW()
    WHERE destinatario_id = auth.uid() AND leida = FALSE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
