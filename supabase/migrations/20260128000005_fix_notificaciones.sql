-- ============================================
-- Función RPC: crear_reserva_publica
-- Descripción: Permite crear una reserva desde link público sin autenticación
-- Usa SECURITY DEFINER para bypassear RLS
-- ============================================

-- Eliminar todas las versiones anteriores de la función
DROP FUNCTION IF EXISTS public.crear_reserva_publica(UUID, DATE, TIME, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS public.crear_reserva_publica(UUID, DATE, TIME, UUID[], VARCHAR, VARCHAR, VARCHAR, VARCHAR);

-- Crear la nueva función con soporte para múltiples servicios
CREATE OR REPLACE FUNCTION public.crear_reserva_publica(
    p_link_id UUID,
    p_fecha DATE,
    p_hora TIME,
    p_servicios_ids UUID[],  -- Array de IDs de servicios
    p_cliente_nombre VARCHAR DEFAULT NULL,
    p_cliente_apellido VARCHAR DEFAULT NULL,
    p_cliente_telefono VARCHAR DEFAULT NULL,
    p_cliente_email VARCHAR DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_link RECORD;
    v_cliente_id UUID;
    v_turno_id UUID;
    v_duracion_total INT := 0;
    v_hora_fin TIME;
    v_servicio RECORD;
    v_orden INT := 0;
    v_servicios_nombres TEXT := '';
BEGIN
    -- 1. Validar el link
    SELECT * INTO v_link
    FROM agenda_reserva_links
    WHERE id = p_link_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Link no encontrado');
    END IF;

    IF v_link.estado != 'activo' THEN
        RETURN json_build_object('success', false, 'error', 'Link no disponible');
    END IF;

    IF v_link.expires_at < NOW() THEN
        -- Marcar como expirado
        UPDATE agenda_reserva_links SET estado = 'expirado' WHERE id = p_link_id;
        RETURN json_build_object('success', false, 'error', 'Link expirado');
    END IF;

    -- 2. Validar que los servicios existan y calcular duración total
    IF p_servicios_ids IS NULL OR array_length(p_servicios_ids, 1) IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Debe seleccionar al menos un servicio');
    END IF;

    FOR v_servicio IN
        SELECT id, nombre, duracion_minutos, precio
        FROM agenda_servicios
        WHERE id = ANY(p_servicios_ids)
        AND activo = true
    LOOP
        v_duracion_total := v_duracion_total + COALESCE(v_servicio.duracion_minutos, 30);
        IF v_servicios_nombres != '' THEN
            v_servicios_nombres := v_servicios_nombres || ', ';
        END IF;
        v_servicios_nombres := v_servicios_nombres || v_servicio.nombre;
    END LOOP;

    IF v_duracion_total = 0 THEN
        RETURN json_build_object('success', false, 'error', 'Servicios no válidos');
    END IF;

    -- Calcular hora de fin
    v_hora_fin := p_hora + (v_duracion_total || ' minutes')::INTERVAL;

    -- 3. Obtener o crear cliente
    IF v_link.cliente_id IS NOT NULL THEN
        v_cliente_id := v_link.cliente_id;
    ELSIF p_cliente_nombre IS NOT NULL AND p_cliente_apellido IS NOT NULL AND p_cliente_telefono IS NOT NULL THEN
        -- Buscar si existe un cliente con ese teléfono
        SELECT id INTO v_cliente_id
        FROM agenda_clientes
        WHERE duenio_id = v_link.profesional_id
        AND (telefono = p_cliente_telefono OR whatsapp = p_cliente_telefono)
        LIMIT 1;

        IF v_cliente_id IS NOT NULL THEN
            -- Si existe, actualizar sus datos
            UPDATE agenda_clientes
            SET
                nombre = COALESCE(NULLIF(p_cliente_nombre, ''), nombre),
                apellido = COALESCE(NULLIF(p_cliente_apellido, ''), apellido),
                email = COALESCE(NULLIF(p_cliente_email, ''), email),
                updated_at = NOW()
            WHERE id = v_cliente_id;
        ELSE
            -- Si no existe, crear nuevo cliente
            INSERT INTO agenda_clientes (
                duenio_id,
                nombre,
                apellido,
                telefono,
                whatsapp,
                email
            ) VALUES (
                v_link.profesional_id,
                p_cliente_nombre,
                p_cliente_apellido,
                p_cliente_telefono,
                p_cliente_telefono,  -- también guardar como whatsapp
                p_cliente_email
            )
            RETURNING id INTO v_cliente_id;
        END IF;
    ELSE
        RETURN json_build_object('success', false, 'error', 'Datos de cliente requeridos');
    END IF;

    -- 4. Crear el turno
    INSERT INTO agenda_turnos (
        duenio_id,
        profesional_id,
        cliente_id,
        fecha,
        hora_inicio,
        hora_fin,
        duracion_real,
        estado,
        notas
    ) VALUES (
        v_link.profesional_id,
        v_link.profesional_id,
        v_cliente_id,
        p_fecha,
        p_hora,
        v_hora_fin,
        v_duracion_total,
        'pendiente',
        'Reserva desde link público'
    )
    RETURNING id INTO v_turno_id;

    -- 5. Crear registros en agenda_turno_servicios para cada servicio
    FOR v_servicio IN
        SELECT id, duracion_minutos, precio
        FROM agenda_servicios
        WHERE id = ANY(p_servicios_ids)
        AND activo = true
    LOOP
        INSERT INTO agenda_turno_servicios (
            turno_id,
            servicio_id,
            precio,
            duracion,
            orden
        ) VALUES (
            v_turno_id,
            v_servicio.id,
            COALESCE(v_servicio.precio, 0),
            COALESCE(v_servicio.duracion_minutos, 30),
            v_orden
        );
        v_orden := v_orden + 1;
    END LOOP;

    -- 6. Marcar el link como usado
    UPDATE agenda_reserva_links
    SET estado = 'usado', turno_id = v_turno_id
    WHERE id = p_link_id;

    -- 7. Crear notificación para el profesional
    INSERT INTO notificaciones (
        destinatario_id,
        tipo,
        titulo,
        mensaje,
        link_to
    ) VALUES (
        v_link.profesional_id,
        'sistema',
        'Nueva reserva pendiente',
        'Tienes una nueva reserva de ' || v_servicios_nombres || ' para el ' || to_char(p_fecha, 'DD/MM/YYYY') || ' a las ' || to_char(p_hora, 'HH24:MI'),
        '/herramientas/agenda-turnos'
    );

    RETURN json_build_object(
        'success', true,
        'turno_id', v_turno_id,
        'duracion_total', v_duracion_total
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.crear_reserva_publica(UUID, DATE, TIME, UUID[], VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION public.crear_reserva_publica(UUID, DATE, TIME, UUID[], VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO authenticated;

COMMENT ON FUNCTION public.crear_reserva_publica(UUID, DATE, TIME, UUID[], VARCHAR, VARCHAR, VARCHAR, VARCHAR) IS 'Crea una reserva desde link público. Soporta múltiples servicios que se suman en duración.';
