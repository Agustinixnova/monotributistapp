-- ============================================
-- Notificaciones para IIBB desactualizados
-- Fecha: 2026-01-15
-- ============================================

-- Agregar tipo de notificación para IIBB desactualizado
ALTER TABLE public.notificaciones
DROP CONSTRAINT IF EXISTS notificaciones_tipo_check;

ALTER TABLE public.notificaciones
ADD CONSTRAINT notificaciones_tipo_check CHECK (tipo IN (
    'riesgo_exclusion',
    'cerca_recategorizacion',
    'vencimiento_cuota',
    'cuota_vencida',
    'recategorizacion_periodica',
    'facturacion_pendiente',
    'mensaje_nuevo',
    'documento_nuevo',
    'sistema',
    'iibb_desactualizado'
));

-- ============================================
-- Función para generar notificaciones de IIBB desactualizados
-- Esta función verifica clientes con coeficientes vencidos y notifica
-- al contador_principal y al contador_secundario asignado
-- ============================================

CREATE OR REPLACE FUNCTION public.generar_notificaciones_iibb()
RETURNS INTEGER AS $$
DECLARE
    v_cliente RECORD;
    v_contador RECORD;
    v_contadora_principal_id UUID;
    v_anio_actual INTEGER;
    v_total_notificaciones INTEGER := 0;
    v_hash TEXT;
    v_notificacion_id UUID;
BEGIN
    v_anio_actual := EXTRACT(YEAR FROM CURRENT_DATE);

    -- Obtener ID de contadora_principal (o admin/desarrollo)
    SELECT p.id INTO v_contadora_principal_id
    FROM public.profiles p
    INNER JOIN public.roles r ON p.role_id = r.id
    WHERE r.name = 'contadora_principal' AND p.is_active = TRUE
    LIMIT 1;

    -- Si no hay contadora_principal, buscar admin
    IF v_contadora_principal_id IS NULL THEN
        SELECT p.id INTO v_contadora_principal_id
        FROM public.profiles p
        INNER JOIN public.roles r ON p.role_id = r.id
        WHERE r.name = 'admin' AND p.is_active = TRUE
        LIMIT 1;
    END IF;

    -- Iterar clientes con régimen Local o CM que necesitan actualización
    FOR v_cliente IN
        SELECT
            cfd.id as client_id,
            cfd.razon_social,
            cfd.regimen_iibb,
            p.nombre || ' ' || COALESCE(p.apellido, '') as cliente_nombre,
            p.assigned_to as contador_asignado_id,
            ij.anio_vigencia
        FROM public.client_fiscal_data cfd
        INNER JOIN public.profiles p ON cfd.user_id = p.id
        LEFT JOIN (
            SELECT client_id, MIN(anio_vigencia) as anio_vigencia
            FROM public.client_iibb_jurisdicciones
            GROUP BY client_id
        ) ij ON ij.client_id = cfd.id
        WHERE cfd.regimen_iibb IN ('local', 'convenio_multilateral')
          AND p.is_active = TRUE
          AND (ij.anio_vigencia IS NULL OR ij.anio_vigencia < v_anio_actual)
    LOOP
        -- Crear notificación para contadora_principal
        IF v_contadora_principal_id IS NOT NULL THEN
            v_hash := 'iibb_desactualizado:' || v_cliente.client_id || ':' || v_anio_actual || ':principal';

            INSERT INTO public.notificaciones (
                destinatario_id, tipo, titulo, mensaje, client_id, link_to, prioridad, hash_evento
            ) VALUES (
                v_contadora_principal_id,
                'iibb_desactualizado',
                'IIBB desactualizado: ' || COALESCE(v_cliente.cliente_nombre, v_cliente.razon_social),
                CASE
                    WHEN v_cliente.anio_vigencia IS NULL THEN
                        'El cliente no tiene jurisdicciones IIBB configuradas.'
                    ELSE
                        'Los coeficientes son del ' || v_cliente.anio_vigencia || '. Verificar si corresponde actualizar para ' || v_anio_actual || '.'
                END,
                v_cliente.client_id,
                '/mi-cartera/' || v_cliente.client_id,
                'normal',
                v_hash
            )
            ON CONFLICT (hash_evento) WHERE hash_evento IS NOT NULL DO NOTHING;

            IF FOUND THEN
                v_total_notificaciones := v_total_notificaciones + 1;
            END IF;
        END IF;

        -- Crear notificación para contador_secundario asignado (si existe y es diferente de contadora_principal)
        IF v_cliente.contador_asignado_id IS NOT NULL
           AND v_cliente.contador_asignado_id != v_contadora_principal_id THEN
            v_hash := 'iibb_desactualizado:' || v_cliente.client_id || ':' || v_anio_actual || ':asignado';

            INSERT INTO public.notificaciones (
                destinatario_id, tipo, titulo, mensaje, client_id, link_to, prioridad, hash_evento
            ) VALUES (
                v_cliente.contador_asignado_id,
                'iibb_desactualizado',
                'IIBB desactualizado: ' || COALESCE(v_cliente.cliente_nombre, v_cliente.razon_social),
                CASE
                    WHEN v_cliente.anio_vigencia IS NULL THEN
                        'El cliente no tiene jurisdicciones IIBB configuradas.'
                    ELSE
                        'Los coeficientes son del ' || v_cliente.anio_vigencia || '. Verificar si corresponde actualizar para ' || v_anio_actual || '.'
                END,
                v_cliente.client_id,
                '/mi-cartera/' || v_cliente.client_id,
                'normal',
                v_hash
            )
            ON CONFLICT (hash_evento) WHERE hash_evento IS NOT NULL DO NOTHING;

            IF FOUND THEN
                v_total_notificaciones := v_total_notificaciones + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN v_total_notificaciones;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir que contadores ejecuten esta función
GRANT EXECUTE ON FUNCTION public.generar_notificaciones_iibb TO authenticated;

COMMENT ON FUNCTION public.generar_notificaciones_iibb IS 'Genera notificaciones para clientes con coeficientes IIBB desactualizados. Retorna cantidad de notificaciones creadas.';
