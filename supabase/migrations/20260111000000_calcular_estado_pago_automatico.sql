-- =============================================
-- Función para calcular estado de pago automáticamente
-- Basado en cuotas mensuales y fecha actual
-- =============================================

CREATE OR REPLACE FUNCTION public.calcular_estado_pago_monotributo(p_client_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_ahora_arg TIMESTAMP;
    v_dia_actual INTEGER;
    v_mes_actual INTEGER;
    v_anio_actual INTEGER;
    v_meses_adeudados INTEGER := 0;
    v_anio_check INTEGER;
    v_mes_check INTEGER;
    v_cuota_estado TEXT;
    v_max_meses_check INTEGER := 12; -- Revisar hasta 12 meses atrás
BEGIN
    -- Obtener fecha/hora actual en Argentina (UTC-3)
    v_ahora_arg := NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires';
    v_dia_actual := EXTRACT(DAY FROM v_ahora_arg);
    v_mes_actual := EXTRACT(MONTH FROM v_ahora_arg);
    v_anio_actual := EXTRACT(YEAR FROM v_ahora_arg);

    -- Iniciar desde el mes actual
    v_anio_check := v_anio_actual;
    v_mes_check := v_mes_actual;

    -- Si aún no pasó el día 20, empezar a contar desde el mes anterior
    IF v_dia_actual < 20 THEN
        v_mes_check := v_mes_check - 1;
        IF v_mes_check = 0 THEN
            v_mes_check := 12;
            v_anio_check := v_anio_check - 1;
        END IF;
    END IF;

    -- Iterar hacia atrás contando meses adeudados consecutivos
    FOR i IN 1..v_max_meses_check LOOP
        -- Verificar si existe cuota pagada para este mes
        SELECT estado INTO v_cuota_estado
        FROM public.client_cuota_mensual
        WHERE client_id = p_client_id
          AND anio = v_anio_check
          AND mes = v_mes_check
          AND estado IN ('informada', 'verificada')
        LIMIT 1;

        -- Si encontramos una cuota pagada, terminamos el conteo
        IF v_cuota_estado IS NOT NULL THEN
            EXIT;
        END IF;

        -- No hay cuota pagada, incrementar contador
        v_meses_adeudados := v_meses_adeudados + 1;

        -- Retroceder un mes
        v_mes_check := v_mes_check - 1;
        IF v_mes_check = 0 THEN
            v_mes_check := 12;
            v_anio_check := v_anio_check - 1;
        END IF;
    END LOOP;

    -- Determinar el estado según meses adeudados
    IF v_meses_adeudados = 0 THEN
        RETURN 'al_dia';
    ELSIF v_meses_adeudados = 1 THEN
        RETURN 'debe_1_cuota';
    ELSE
        RETURN 'debe_2_mas';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calcular_estado_pago_monotributo IS
'Calcula el estado de pago del monotributo basándose en cuotas mensuales.
Cuenta meses consecutivos adeudados desde el mes más reciente (considerando el día 20 como vencimiento).';

-- =============================================
-- Trigger para actualizar automáticamente el campo
-- cuando se inserta/actualiza una cuota
-- =============================================

CREATE OR REPLACE FUNCTION public.actualizar_estado_pago_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar el estado de pago en client_fiscal_data
    UPDATE public.client_fiscal_data
    SET estado_pago_monotributo = public.calcular_estado_pago_monotributo(NEW.client_id)
    WHERE id = NEW.client_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger en client_cuota_mensual
DROP TRIGGER IF EXISTS trigger_actualizar_estado_pago ON public.client_cuota_mensual;
CREATE TRIGGER trigger_actualizar_estado_pago
    AFTER INSERT OR UPDATE ON public.client_cuota_mensual
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_estado_pago_trigger();

COMMENT ON TRIGGER trigger_actualizar_estado_pago ON public.client_cuota_mensual IS
'Actualiza automáticamente el campo estado_pago_monotributo cuando se registra o actualiza una cuota';

-- =============================================
-- Actualizar todos los estados existentes
-- =============================================

-- Ejecutar una vez para actualizar todos los clientes actuales
UPDATE public.client_fiscal_data
SET estado_pago_monotributo = public.calcular_estado_pago_monotributo(id)
WHERE tipo_contribuyente = 'monotributista';
