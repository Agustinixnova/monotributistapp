-- =============================================
-- MODULO MI CARTERA COMPLETO
-- Incluye: Renombrar modulo, campos nuevos,
-- tablas locales/grupo familiar, auditoria, sugerencias
-- =============================================

-- ========================================
-- 1. RENOMBRAR MODULO CLIENTES -> MI CARTERA
-- ========================================
UPDATE public.modules
SET
    name = 'Mi Cartera',
    slug = 'mi-cartera',
    route = '/mi-cartera'
WHERE slug = 'clientes';

-- ========================================
-- 2. CAMPOS NUEVOS EN CLIENT_FISCAL_DATA
-- ========================================

-- Campos de empleador (relacion de dependencia)
ALTER TABLE public.client_fiscal_data
ADD COLUMN IF NOT EXISTS empleador_cuit TEXT,
ADD COLUMN IF NOT EXISTS empleador_razon_social TEXT,
ADD COLUMN IF NOT EXISTS sueldo_bruto DECIMAL(12,2);

-- Obra social ampliada
ALTER TABLE public.client_fiscal_data
ADD COLUMN IF NOT EXISTS obra_social_tipo_cobertura TEXT DEFAULT 'titular'
    CHECK (obra_social_tipo_cobertura IN ('titular', 'grupo_familiar')),
ADD COLUMN IF NOT EXISTS obra_social_adicional BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS obra_social_adicional_nombre TEXT;

-- Campos de auditoria
ALTER TABLE public.client_fiscal_data
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ;

-- Indices para busqueda
CREATE INDEX IF NOT EXISTS idx_fiscal_cuit ON public.client_fiscal_data(cuit);
CREATE INDEX IF NOT EXISTS idx_fiscal_categoria ON public.client_fiscal_data(categoria_monotributo);

-- ========================================
-- 3. TABLA DE LOCALES COMERCIALES
-- ========================================
CREATE TABLE IF NOT EXISTS public.client_locales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,

    descripcion TEXT, -- "Local Centro", "Deposito", etc.
    direccion TEXT,
    localidad TEXT,
    provincia TEXT,

    alquiler_mensual DECIMAL(12,2),
    superficie_m2 INTEGER,
    es_propio BOOLEAN DEFAULT FALSE,

    -- Orden para mostrar
    orden INTEGER DEFAULT 0,

    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ,
    updated_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_locales_client ON public.client_locales(client_id);

-- RLS para locales
ALTER TABLE public.client_locales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "locales_select" ON public.client_locales;
CREATE POLICY "locales_select" ON public.client_locales
    FOR SELECT USING (
        -- El cliente puede ver sus propios locales
        EXISTS (
            SELECT 1 FROM public.client_fiscal_data c
            JOIN public.profiles p ON c.user_id = p.id
            WHERE c.id = client_locales.client_id
            AND p.id = auth.uid()
        )
        OR
        -- Las contadoras pueden ver todos
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

DROP POLICY IF EXISTS "locales_insert" ON public.client_locales;
CREATE POLICY "locales_insert" ON public.client_locales
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

DROP POLICY IF EXISTS "locales_update" ON public.client_locales;
CREATE POLICY "locales_update" ON public.client_locales
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

DROP POLICY IF EXISTS "locales_delete" ON public.client_locales;
CREATE POLICY "locales_delete" ON public.client_locales
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

-- ========================================
-- 4. TABLA DE GRUPO FAMILIAR (OBRA SOCIAL)
-- ========================================
CREATE TABLE IF NOT EXISTS public.client_grupo_familiar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,

    nombre TEXT NOT NULL,
    dni TEXT,
    fecha_nacimiento DATE,
    parentesco TEXT CHECK (parentesco IN ('conyuge', 'concubino', 'hijo', 'otro')),
    parentesco_otro TEXT, -- Si es "otro", especificar

    -- Para ARCA
    cuil TEXT,

    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ,
    updated_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_grupo_familiar_client ON public.client_grupo_familiar(client_id);

-- RLS para grupo familiar
ALTER TABLE public.client_grupo_familiar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grupo_familiar_select" ON public.client_grupo_familiar;
CREATE POLICY "grupo_familiar_select" ON public.client_grupo_familiar
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.client_fiscal_data c
            JOIN public.profiles p ON c.user_id = p.id
            WHERE c.id = client_grupo_familiar.client_id
            AND p.id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

DROP POLICY IF EXISTS "grupo_familiar_insert" ON public.client_grupo_familiar;
CREATE POLICY "grupo_familiar_insert" ON public.client_grupo_familiar
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

DROP POLICY IF EXISTS "grupo_familiar_update" ON public.client_grupo_familiar;
CREATE POLICY "grupo_familiar_update" ON public.client_grupo_familiar
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

DROP POLICY IF EXISTS "grupo_familiar_delete" ON public.client_grupo_familiar;
CREATE POLICY "grupo_familiar_delete" ON public.client_grupo_familiar
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

-- ========================================
-- 5. TABLA DE AUDITORIA DE CAMBIOS
-- ========================================
CREATE TABLE IF NOT EXISTS public.client_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referencia al cliente
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,

    -- Que cambio
    tabla TEXT NOT NULL DEFAULT 'client_fiscal_data',
    campo TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,

    -- Quien y cuando (UTC-3 Argentina)
    modified_by UUID NOT NULL REFERENCES public.profiles(id),
    modified_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires'),

    -- Contexto adicional
    motivo TEXT,
    origen TEXT DEFAULT 'manual' CHECK (origen IN ('manual', 'sugerencia', 'sistema', 'migracion'))
);

CREATE INDEX IF NOT EXISTS idx_audit_client ON public.client_audit_log(client_id);
CREATE INDEX IF NOT EXISTS idx_audit_fecha ON public.client_audit_log(modified_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_campo ON public.client_audit_log(campo);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.client_audit_log(modified_by);

-- RLS para auditoria
ALTER TABLE public.client_audit_log ENABLE ROW LEVEL SECURITY;

-- Solo contadoras pueden ver auditoria
DROP POLICY IF EXISTS "audit_log_select" ON public.client_audit_log;
CREATE POLICY "audit_log_select" ON public.client_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

-- Insercion permitida (via funcion)
DROP POLICY IF EXISTS "audit_log_insert" ON public.client_audit_log;
CREATE POLICY "audit_log_insert" ON public.client_audit_log
    FOR INSERT WITH CHECK (true);

-- ========================================
-- 6. FUNCION PARA REGISTRAR CAMBIO EN AUDITORIA
-- ========================================
CREATE OR REPLACE FUNCTION public.registrar_cambio_auditoria(
    p_client_id UUID,
    p_tabla TEXT,
    p_campo TEXT,
    p_valor_anterior TEXT,
    p_valor_nuevo TEXT,
    p_user_id UUID,
    p_motivo TEXT DEFAULT NULL,
    p_origen TEXT DEFAULT 'manual'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    -- No registrar si los valores son iguales
    IF p_valor_anterior IS NOT DISTINCT FROM p_valor_nuevo THEN
        RETURN NULL;
    END IF;

    INSERT INTO public.client_audit_log (
        client_id, tabla, campo, valor_anterior, valor_nuevo,
        modified_by, motivo, origen
    )
    VALUES (
        p_client_id, p_tabla, p_campo, p_valor_anterior, p_valor_nuevo,
        p_user_id, p_motivo, p_origen
    )
    RETURNING id INTO v_id;

    -- Actualizar last_modified en client_fiscal_data
    UPDATE public.client_fiscal_data
    SET last_modified_by = p_user_id,
        last_modified_at = NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires'
    WHERE id = p_client_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 7. TABLA DE SUGERENCIAS DE CAMBIOS
-- ========================================
CREATE TABLE IF NOT EXISTS public.client_sugerencias_cambio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referencia al cliente
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id), -- Quien sugiere (el cliente)

    -- Que quiere cambiar
    tabla TEXT NOT NULL DEFAULT 'client_fiscal_data',
    campo TEXT NOT NULL,
    campo_label TEXT, -- Nombre legible del campo
    valor_actual TEXT,
    valor_sugerido TEXT NOT NULL,
    comentario TEXT,

    -- Para campos de tablas relacionadas (locales, grupo_familiar)
    registro_id UUID, -- ID del registro especifico si aplica
    accion TEXT DEFAULT 'modificar' CHECK (accion IN ('modificar', 'agregar', 'eliminar')),

    -- Estado
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'aceptada_modificada')),

    -- Resolucion
    revisado_by UUID REFERENCES public.profiles(id),
    revisado_at TIMESTAMPTZ,
    valor_aplicado TEXT,
    nota_revision TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sugerencias_client ON public.client_sugerencias_cambio(client_id);
CREATE INDEX IF NOT EXISTS idx_sugerencias_estado ON public.client_sugerencias_cambio(estado);
CREATE INDEX IF NOT EXISTS idx_sugerencias_user ON public.client_sugerencias_cambio(user_id);

-- RLS para sugerencias
ALTER TABLE public.client_sugerencias_cambio ENABLE ROW LEVEL SECURITY;

-- Clientes pueden ver sus propias sugerencias, contadoras ven todas
DROP POLICY IF EXISTS "sugerencias_select" ON public.client_sugerencias_cambio;
CREATE POLICY "sugerencias_select" ON public.client_sugerencias_cambio
    FOR SELECT USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

-- Clientes pueden crear sugerencias
DROP POLICY IF EXISTS "sugerencias_insert" ON public.client_sugerencias_cambio;
CREATE POLICY "sugerencias_insert" ON public.client_sugerencias_cambio
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Solo contadoras pueden actualizar (aceptar/rechazar)
DROP POLICY IF EXISTS "sugerencias_update" ON public.client_sugerencias_cambio;
CREATE POLICY "sugerencias_update" ON public.client_sugerencias_cambio
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

-- ========================================
-- 8. FUNCION PARA CREAR SUGERENCIA Y NOTIFICAR
-- ========================================
CREATE OR REPLACE FUNCTION public.crear_sugerencia_cambio(
    p_client_id UUID,
    p_user_id UUID,
    p_tabla TEXT,
    p_campo TEXT,
    p_campo_label TEXT,
    p_valor_actual TEXT,
    p_valor_sugerido TEXT,
    p_comentario TEXT DEFAULT NULL,
    p_registro_id UUID DEFAULT NULL,
    p_accion TEXT DEFAULT 'modificar'
)
RETURNS UUID AS $$
DECLARE
    v_sugerencia_id UUID;
    v_cliente_nombre TEXT;
    v_assigned_to UUID;
BEGIN
    -- Crear sugerencia
    INSERT INTO public.client_sugerencias_cambio (
        client_id, user_id, tabla, campo, campo_label,
        valor_actual, valor_sugerido, comentario,
        registro_id, accion
    )
    VALUES (
        p_client_id, p_user_id, p_tabla, p_campo, p_campo_label,
        p_valor_actual, p_valor_sugerido, p_comentario,
        p_registro_id, p_accion
    )
    RETURNING id INTO v_sugerencia_id;

    -- Obtener nombre del cliente y contador asignado
    SELECT
        COALESCE(p.nombre || ' ' || p.apellido, c.razon_social, 'Cliente'),
        p.assigned_to
    INTO v_cliente_nombre, v_assigned_to
    FROM public.client_fiscal_data c
    JOIN public.profiles p ON c.user_id = p.id
    WHERE c.id = p_client_id;

    -- Notificar a admins y contadoras principales
    INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, datos, prioridad)
    SELECT
        p.id,
        'sugerencia_cambio',
        'Sugerencia de cambio',
        v_cliente_nombre || ' sugiere cambiar: ' || p_campo_label,
        jsonb_build_object(
            'sugerencia_id', v_sugerencia_id,
            'client_id', p_client_id,
            'campo', p_campo,
            'campo_label', p_campo_label,
            'valor_sugerido', p_valor_sugerido,
            'accion', p_accion
        ),
        'media'
    FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora')
    AND p.is_active = true;

    -- Notificar al contador_secundario asignado si existe
    IF v_assigned_to IS NOT NULL THEN
        INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, datos, prioridad)
        VALUES (
            v_assigned_to,
            'sugerencia_cambio',
            'Sugerencia de cambio',
            v_cliente_nombre || ' sugiere cambiar: ' || p_campo_label,
            jsonb_build_object(
                'sugerencia_id', v_sugerencia_id,
                'client_id', p_client_id,
                'campo', p_campo,
                'campo_label', p_campo_label,
                'valor_sugerido', p_valor_sugerido,
                'accion', p_accion
            ),
            'media'
        );
    END IF;

    RETURN v_sugerencia_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 9. FUNCION PARA PROCESAR SUGERENCIA
-- ========================================
CREATE OR REPLACE FUNCTION public.procesar_sugerencia(
    p_sugerencia_id UUID,
    p_estado TEXT,
    p_user_id UUID,
    p_valor_aplicado TEXT DEFAULT NULL,
    p_nota TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_sugerencia RECORD;
    v_mensaje TEXT;
    v_valor_final TEXT;
BEGIN
    -- Obtener datos de la sugerencia
    SELECT * INTO v_sugerencia
    FROM public.client_sugerencias_cambio
    WHERE id = p_sugerencia_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Actualizar sugerencia
    UPDATE public.client_sugerencias_cambio
    SET
        estado = p_estado,
        revisado_by = p_user_id,
        revisado_at = NOW(),
        valor_aplicado = p_valor_aplicado,
        nota_revision = p_nota
    WHERE id = p_sugerencia_id;

    -- Si se acepta, aplicar el cambio
    IF p_estado IN ('aceptada', 'aceptada_modificada') THEN
        v_valor_final := COALESCE(p_valor_aplicado, v_sugerencia.valor_sugerido);

        -- Registrar en auditoria
        PERFORM public.registrar_cambio_auditoria(
            v_sugerencia.client_id,
            v_sugerencia.tabla,
            v_sugerencia.campo,
            v_sugerencia.valor_actual,
            v_valor_final,
            p_user_id,
            'Aceptado desde sugerencia del cliente',
            'sugerencia'
        );

        -- Aplicar cambio segun la tabla
        IF v_sugerencia.tabla = 'client_fiscal_data' THEN
            -- Actualizar campo en client_fiscal_data
            EXECUTE format(
                'UPDATE public.client_fiscal_data SET %I = $1, last_modified_by = $2, last_modified_at = NOW() WHERE id = $3',
                v_sugerencia.campo
            ) USING v_valor_final, p_user_id, v_sugerencia.client_id;

        ELSIF v_sugerencia.tabla = 'profiles' THEN
            -- Actualizar campo en profiles
            EXECUTE format(
                'UPDATE public.profiles SET %I = $1 WHERE id = (SELECT user_id FROM public.client_fiscal_data WHERE id = $2)',
                v_sugerencia.campo
            ) USING v_valor_final, v_sugerencia.client_id;
        END IF;

        -- Para locales y grupo_familiar, se maneja diferente segun accion
        -- Por ahora, solo notificar para revision manual
    END IF;

    -- Notificar al cliente
    IF p_estado = 'aceptada' THEN
        v_mensaje := 'Tu sugerencia de cambio en "' || v_sugerencia.campo_label || '" fue aceptada';
    ELSIF p_estado = 'aceptada_modificada' THEN
        v_mensaje := 'Tu dato de "' || v_sugerencia.campo_label || '" fue actualizado';
    ELSE
        v_mensaje := 'Tu sugerencia de cambio en "' || v_sugerencia.campo_label || '" fue revisada';
    END IF;

    INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, datos)
    VALUES (
        v_sugerencia.user_id,
        'sugerencia_procesada',
        'Sugerencia procesada',
        v_mensaje,
        jsonb_build_object(
            'sugerencia_id', p_sugerencia_id,
            'estado', p_estado,
            'campo', v_sugerencia.campo_label
        )
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 10. VISTA OPTIMIZADA PARA CARTERA
-- ========================================
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

    -- Datos fiscales principales
    c.cuit,
    c.razon_social,
    c.tipo_contribuyente,
    c.categoria_monotributo,
    c.tipo_actividad,
    c.gestion_facturacion,
    c.fecha_alta_monotributo,
    c.estado_pago_monotributo,
    c.servicios_delegados,
    c.metodo_pago_monotributo,
    c.trabaja_relacion_dependencia,
    c.tiene_local,

    -- Tope de categoria
    mc.tope_facturacion_anual as tope_categoria,

    -- Datos del contador asignado
    pa.id as contador_id,
    pa.nombre as contador_nombre,
    pa.apellido as contador_apellido,
    pa.email as contador_email,

    -- Contadores de relaciones
    (SELECT COUNT(*) FROM public.client_locales l WHERE l.client_id = c.id) as cantidad_locales,
    (SELECT COUNT(*) FROM public.client_grupo_familiar g WHERE g.client_id = c.id) as cantidad_grupo_familiar,
    (SELECT COUNT(*) FROM public.client_sugerencias_cambio s
     WHERE s.client_id = c.id AND s.estado = 'pendiente') as sugerencias_pendientes,

    -- Ultima modificacion
    c.last_modified_at,
    pm.nombre || ' ' || pm.apellido as last_modified_by_name

FROM public.client_fiscal_data c
JOIN public.profiles p ON c.user_id = p.id
LEFT JOIN public.monotributo_categorias mc
    ON c.categoria_monotributo = mc.categoria
    AND mc.vigente_hasta IS NULL
LEFT JOIN public.profiles pa ON p.assigned_to = pa.id
LEFT JOIN public.profiles pm ON c.last_modified_by = pm.id
WHERE p.is_active = true;

-- ========================================
-- 11. FUNCION PARA OBTENER CLIENTE CON RELACIONES
-- ========================================
CREATE OR REPLACE FUNCTION public.get_cliente_detalle(p_client_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'fiscal', (
            SELECT row_to_json(c.*)
            FROM public.client_fiscal_data c
            WHERE c.id = p_client_id
        ),
        'profile', (
            SELECT json_build_object(
                'id', p.id,
                'nombre', p.nombre,
                'apellido', p.apellido,
                'full_name', COALESCE(p.nombre || ' ' || p.apellido, p.email),
                'email', p.email,
                'telefono', p.telefono,
                'whatsapp', p.whatsapp,
                'dni', p.dni,
                'assigned_to', p.assigned_to,
                'is_active', p.is_active,
                'created_at', p.created_at,
                'role', (SELECT row_to_json(r.*) FROM public.roles r WHERE r.id = p.role_id),
                'contador', (
                    SELECT json_build_object('id', pa.id, 'nombre', pa.nombre, 'apellido', pa.apellido, 'email', pa.email)
                    FROM public.profiles pa WHERE pa.id = p.assigned_to
                )
            )
            FROM public.profiles p
            JOIN public.client_fiscal_data c ON c.user_id = p.id
            WHERE c.id = p_client_id
        ),
        'locales', (
            SELECT COALESCE(json_agg(l ORDER BY l.orden), '[]'::json)
            FROM public.client_locales l
            WHERE l.client_id = p_client_id
        ),
        'grupo_familiar', (
            SELECT COALESCE(json_agg(g), '[]'::json)
            FROM public.client_grupo_familiar g
            WHERE g.client_id = p_client_id
        ),
        'historial_categorias', (
            SELECT COALESCE(json_agg(h ORDER BY h.fecha_desde DESC), '[]'::json)
            FROM public.client_historial_categorias h
            WHERE h.client_id = p_client_id
        ),
        'categoria_info', (
            SELECT row_to_json(mc.*)
            FROM public.client_fiscal_data c
            JOIN public.monotributo_categorias mc ON c.categoria_monotributo = mc.categoria
            WHERE c.id = p_client_id AND mc.vigente_hasta IS NULL
        ),
        'sugerencias_pendientes', (
            SELECT COALESCE(json_agg(s ORDER BY s.created_at DESC), '[]'::json)
            FROM public.client_sugerencias_cambio s
            WHERE s.client_id = p_client_id AND s.estado = 'pendiente'
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 12. COMENTARIOS
-- ========================================
COMMENT ON TABLE public.client_locales IS 'Locales comerciales de los clientes monotributistas';
COMMENT ON TABLE public.client_grupo_familiar IS 'Integrantes del grupo familiar para obra social';
COMMENT ON TABLE public.client_audit_log IS 'Historial completo de cambios en datos de clientes';
COMMENT ON TABLE public.client_sugerencias_cambio IS 'Sugerencias de cambios enviadas por clientes';
COMMENT ON VIEW public.vista_cartera_clientes IS 'Vista optimizada para listar cartera de clientes';
COMMENT ON FUNCTION public.registrar_cambio_auditoria IS 'Registra un cambio en el log de auditoria';
COMMENT ON FUNCTION public.crear_sugerencia_cambio IS 'Crea una sugerencia de cambio y notifica';
COMMENT ON FUNCTION public.procesar_sugerencia IS 'Procesa (acepta/rechaza) una sugerencia de cambio';
