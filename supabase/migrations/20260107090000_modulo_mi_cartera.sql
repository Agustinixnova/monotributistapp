-- =============================================
-- MÓDULO MI CARTERA + AUDITORÍA
-- =============================================

-- 1. Renombrar módulo Clientes -> Mi Cartera
UPDATE public.modules
SET name = 'Mi Cartera', slug = 'mi-cartera', route = '/mi-cartera'
WHERE slug = 'clientes';

-- 2. Tabla de auditoría de cambios
CREATE TABLE IF NOT EXISTS public.client_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,
    tabla TEXT NOT NULL DEFAULT 'client_fiscal_data',
    campo TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    modified_by UUID NOT NULL REFERENCES public.profiles(id),
    modified_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires'),
    motivo TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_client ON public.client_audit_log(client_id);
CREATE INDEX IF NOT EXISTS idx_audit_fecha ON public.client_audit_log(modified_at DESC);

ALTER TABLE public.client_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select" ON public.client_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

CREATE POLICY "audit_log_insert" ON public.client_audit_log
    FOR INSERT WITH CHECK (true);

-- 3. Función para registrar cambio en auditoría
CREATE OR REPLACE FUNCTION public.registrar_cambio_auditoria(
    p_client_id UUID,
    p_campo TEXT,
    p_valor_anterior TEXT,
    p_valor_nuevo TEXT,
    p_user_id UUID,
    p_motivo TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
    INSERT INTO public.client_audit_log (client_id, campo, valor_anterior, valor_nuevo, modified_by, motivo)
    VALUES (p_client_id, p_campo, p_valor_anterior, p_valor_nuevo, p_user_id, p_motivo)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Tabla de sugerencias de cambios (para cuando el cliente sugiere un cambio)
CREATE TABLE IF NOT EXISTS public.client_sugerencias_cambio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    campo TEXT NOT NULL,
    valor_actual TEXT,
    valor_sugerido TEXT NOT NULL,
    comentario TEXT,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'aceptada_modificada')),
    revisado_by UUID REFERENCES public.profiles(id),
    revisado_at TIMESTAMPTZ,
    valor_aplicado TEXT,
    nota_revision TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sugerencias_client ON public.client_sugerencias_cambio(client_id);
CREATE INDEX IF NOT EXISTS idx_sugerencias_estado ON public.client_sugerencias_cambio(estado);

ALTER TABLE public.client_sugerencias_cambio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sugerencias_select" ON public.client_sugerencias_cambio
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

CREATE POLICY "sugerencias_insert" ON public.client_sugerencias_cambio
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "sugerencias_update" ON public.client_sugerencias_cambio
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

-- 5. Función para crear sugerencia y notificar
CREATE OR REPLACE FUNCTION public.crear_sugerencia_cambio(
    p_client_id UUID,
    p_user_id UUID,
    p_campo TEXT,
    p_valor_actual TEXT,
    p_valor_sugerido TEXT,
    p_comentario TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_sugerencia_id UUID;
    v_cliente_nombre TEXT;
    v_assigned_to UUID;
BEGIN
    INSERT INTO public.client_sugerencias_cambio (client_id, user_id, campo, valor_actual, valor_sugerido, comentario)
    VALUES (p_client_id, p_user_id, p_campo, p_valor_actual, p_valor_sugerido, p_comentario)
    RETURNING id INTO v_sugerencia_id;

    SELECT COALESCE(p.nombre || ' ' || p.apellido, c.razon_social), p.assigned_to
    INTO v_cliente_nombre, v_assigned_to
    FROM public.client_fiscal_data c
    JOIN public.profiles p ON c.user_id = p.id
    WHERE c.id = p_client_id;

    -- Notificar a admins y contadoras principales
    INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, datos)
    SELECT p.id, 'sugerencia_cambio', 'Sugerencia de cambio',
           v_cliente_nombre || ' sugiere cambiar ' || p_campo,
           jsonb_build_object('sugerencia_id', v_sugerencia_id, 'client_id', p_client_id, 'campo', p_campo)
    FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE r.name IN ('admin', 'contadora_principal') AND p.is_active = true;

    -- Notificar al contador asignado
    IF v_assigned_to IS NOT NULL THEN
        INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, datos)
        VALUES (v_assigned_to, 'sugerencia_cambio', 'Sugerencia de cambio',
                v_cliente_nombre || ' sugiere cambiar ' || p_campo,
                jsonb_build_object('sugerencia_id', v_sugerencia_id, 'client_id', p_client_id, 'campo', p_campo));
    END IF;

    RETURN v_sugerencia_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Vista optimizada para cartera de clientes
CREATE OR REPLACE VIEW public.vista_cartera_clientes AS
SELECT
    c.id as client_id,
    c.user_id,
    p.id as profile_id,
    p.nombre,
    p.apellido,
    COALESCE(p.nombre || ' ' || p.apellido, p.email) as full_name,
    p.email,
    p.telefono,
    p.whatsapp,
    p.assigned_to,
    p.is_active,
    c.cuit,
    c.razon_social,
    c.tipo_contribuyente,
    c.categoria_monotributo,
    c.tipo_actividad,
    c.gestion_facturacion,
    c.fecha_alta_monotributo,
    c.estado_pago_monotributo,
    c.servicios_delegados,
    c.obra_social,
    c.trabaja_relacion_dependencia,
    c.tiene_local,
    mc.tope_facturacion_anual as tope_categoria,
    pa.nombre as contador_nombre,
    pa.apellido as contador_apellido,
    (SELECT COUNT(*) FROM public.client_sugerencias_cambio s
     WHERE s.client_id = c.id AND s.estado = 'pendiente') as sugerencias_pendientes,
    (SELECT COUNT(*) FROM public.client_locales l WHERE l.client_id = c.id) as cantidad_locales
FROM public.client_fiscal_data c
JOIN public.profiles p ON c.user_id = p.id
LEFT JOIN public.monotributo_categorias mc ON c.categoria_monotributo = mc.categoria AND mc.vigente_hasta IS NULL
LEFT JOIN public.profiles pa ON p.assigned_to = pa.id
WHERE p.is_active = true;

-- 7. Campos de última modificación en client_fiscal_data
ALTER TABLE public.client_fiscal_data
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ;

-- 8. Comentarios
COMMENT ON TABLE public.client_audit_log IS 'Registro de cambios en datos de clientes para auditoría';
COMMENT ON TABLE public.client_sugerencias_cambio IS 'Sugerencias de cambios propuestas por clientes';
COMMENT ON VIEW public.vista_cartera_clientes IS 'Vista optimizada para listar clientes en Mi Cartera';
