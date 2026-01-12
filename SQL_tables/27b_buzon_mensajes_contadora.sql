-- =============================================
-- EXTENSION DEL MODULO BUZON: MENSAJES DE CONTADORAS
-- Permite a contadoras enviar mensajes a clientes especificos o grupos
-- =============================================

-- ========================================
-- 1. FUNCION MEJORADA: crear_conversacion_con_destinatarios
-- ========================================
CREATE OR REPLACE FUNCTION public.crear_conversacion_con_destinatarios(
    p_iniciado_por UUID,
    p_asunto TEXT,
    p_contenido TEXT,
    p_destinatarios UUID[] DEFAULT NULL, -- Array de user_ids destinatarios
    p_origen TEXT DEFAULT 'general',
    p_origen_referencia JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_conversacion_id UUID;
    v_contador_asignado UUID;
    v_rol_iniciador TEXT;
    v_destinatario_id UUID;
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

    -- LOGICA SEGUN QUIEN INICIA
    IF v_rol_iniciador IN ('monotributista', 'responsable_inscripto') THEN
        -- ============================================
        -- CLIENTE INICIA: Agregar contadoras
        -- ============================================

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

    ELSIF v_rol_iniciador IN ('admin', 'contadora_principal', 'contador_secundario', 'desarrollo', 'comunicadora') THEN
        -- ============================================
        -- CONTADORA INICIA: Agregar destinatarios especificos
        -- ============================================

        IF p_destinatarios IS NOT NULL AND array_length(p_destinatarios, 1) > 0 THEN
            -- Agregar destinatarios especificados
            FOREACH v_destinatario_id IN ARRAY p_destinatarios
            LOOP
                INSERT INTO public.buzon_participantes (conversacion_id, user_id, leido)
                VALUES (v_conversacion_id, v_destinatario_id, FALSE)
                ON CONFLICT (conversacion_id, user_id) DO NOTHING;
            END LOOP;
        ELSE
            -- Si no especifica destinatarios, es un mensaje general a todas las contadoras
            INSERT INTO public.buzon_participantes (conversacion_id, user_id, leido)
            SELECT v_conversacion_id, p.id, FALSE
            FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora')
            AND p.is_active = TRUE
            AND p.id != p_iniciado_por
            ON CONFLICT (conversacion_id, user_id) DO NOTHING;
        END IF;
    END IF;

    RETURN v_conversacion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.crear_conversacion_con_destinatarios IS
'Crea una conversacion permitiendo especificar destinatarios. Usado por contadoras para enviar mensajes a clientes especificos o grupos.';

-- ========================================
-- 2. FUNCION AUXILIAR: Obtener clientes para selector
-- ========================================
CREATE OR REPLACE FUNCTION public.get_clientes_para_mensajes(
    p_contador_id UUID
)
RETURNS TABLE (
    user_id UUID,
    nombre TEXT,
    apellido TEXT,
    email TEXT,
    razon_social TEXT,
    rol TEXT,
    es_mi_cliente BOOLEAN
) AS $$
DECLARE
    v_rol TEXT;
BEGIN
    -- Obtener rol del contador
    SELECT r.name INTO v_rol
    FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = p_contador_id;

    -- Si es contador_secundario, solo puede ver sus clientes asignados
    IF v_rol = 'contador_secundario' THEN
        RETURN QUERY
        SELECT
            p.id,
            p.nombre,
            p.apellido,
            p.email,
            cfd.razon_social,
            r.name,
            TRUE as es_mi_cliente
        FROM public.profiles p
        JOIN public.roles r ON p.role_id = r.id
        LEFT JOIN public.client_fiscal_data cfd ON p.id = cfd.id
        WHERE p.assigned_to = p_contador_id
        AND r.name IN ('monotributista', 'responsable_inscripto')
        AND p.is_active = TRUE
        ORDER BY p.nombre, p.apellido;

    -- Si es admin, contadora_principal, desarrollo, comunicadora: ve todos los clientes
    ELSIF v_rol IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora') THEN
        RETURN QUERY
        SELECT
            p.id,
            p.nombre,
            p.apellido,
            p.email,
            cfd.razon_social,
            r.name,
            (p.assigned_to = p_contador_id) as es_mi_cliente
        FROM public.profiles p
        JOIN public.roles r ON p.role_id = r.id
        LEFT JOIN public.client_fiscal_data cfd ON p.id = cfd.id
        WHERE r.name IN ('monotributista', 'responsable_inscripto')
        AND p.is_active = TRUE
        ORDER BY p.nombre, p.apellido;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_clientes_para_mensajes IS
'Obtiene la lista de clientes que una contadora puede contactar via buzon de mensajes.';

-- ========================================
-- 3. GRANT EXECUTE A USUARIOS AUTENTICADOS
-- ========================================
GRANT EXECUTE ON FUNCTION public.crear_conversacion_con_destinatarios TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_clientes_para_mensajes TO authenticated;
