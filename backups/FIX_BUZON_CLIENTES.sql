-- =============================================
-- FIX: get_clientes_para_mensajes con JOIN correcto
-- =============================================

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
        LEFT JOIN public.client_fiscal_data cfd ON p.id = cfd.user_id  -- FIX: user_id en lugar de id
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
        LEFT JOIN public.client_fiscal_data cfd ON p.id = cfd.user_id  -- FIX: user_id en lugar de id
        WHERE r.name IN ('monotributista', 'responsable_inscripto')
        AND p.is_active = TRUE
        ORDER BY p.nombre, p.apellido;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.get_clientes_para_mensajes TO authenticated;
