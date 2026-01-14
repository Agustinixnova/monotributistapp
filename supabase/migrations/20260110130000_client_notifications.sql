-- =============================================
-- Tabla: client_notifications
-- Descripcion: Notificaciones personalizadas para clientes
-- Creada: 2026-01-10
-- =============================================

-- Crear tipo ENUM para prioridad si no existe
DO $$ BEGIN
    CREATE TYPE notification_priority AS ENUM ('urgent', 'important', 'normal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabla principal
CREATE TABLE IF NOT EXISTS public.client_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    priority notification_priority NOT NULL DEFAULT 'normal',
    message TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE public.client_notifications IS 'Notificaciones personalizadas de contadores a clientes';
COMMENT ON COLUMN public.client_notifications.client_id IS 'ID del cliente (client_fiscal_data)';
COMMENT ON COLUMN public.client_notifications.created_by IS 'ID del usuario que creo la notificacion';
COMMENT ON COLUMN public.client_notifications.priority IS 'Prioridad: urgent (rojo), important (amarillo), normal (azul)';
COMMENT ON COLUMN public.client_notifications.message IS 'Mensaje de la notificacion';
COMMENT ON COLUMN public.client_notifications.expires_at IS 'Fecha hasta cuando debe mostrarse';
COMMENT ON COLUMN public.client_notifications.is_active IS 'Si la notificacion esta activa';

-- Indices
CREATE INDEX IF NOT EXISTS idx_client_notifications_client_id
    ON public.client_notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notifications_expires_at
    ON public.client_notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_client_notifications_active
    ON public.client_notifications(is_active, expires_at);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_client_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_client_notifications_updated_at ON public.client_notifications;
CREATE TRIGGER trigger_client_notifications_updated_at
    BEFORE UPDATE ON public.client_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_client_notifications_updated_at();

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

-- Contadores pueden ver todas las notificaciones
DROP POLICY IF EXISTS "client_notifications_select_contador" ON public.client_notifications;
CREATE POLICY "client_notifications_select_contador" ON public.client_notifications
    FOR SELECT USING (public.is_contador());

-- Clientes solo pueden ver sus propias notificaciones activas y no expiradas
DROP POLICY IF EXISTS "client_notifications_select_cliente" ON public.client_notifications;
CREATE POLICY "client_notifications_select_cliente" ON public.client_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.client_fiscal_data cfd
            WHERE cfd.id = client_notifications.client_id
            AND cfd.user_id = auth.uid()
        )
        AND is_active = true
        AND expires_at > NOW()
    );

-- Solo contadores pueden insertar
DROP POLICY IF EXISTS "client_notifications_insert" ON public.client_notifications;
CREATE POLICY "client_notifications_insert" ON public.client_notifications
    FOR INSERT WITH CHECK (public.is_contador());

-- Solo contadores pueden actualizar
DROP POLICY IF EXISTS "client_notifications_update" ON public.client_notifications;
CREATE POLICY "client_notifications_update" ON public.client_notifications
    FOR UPDATE USING (public.is_contador());

-- Solo contadores pueden eliminar
DROP POLICY IF EXISTS "client_notifications_delete" ON public.client_notifications;
CREATE POLICY "client_notifications_delete" ON public.client_notifications
    FOR DELETE USING (public.is_contador());
