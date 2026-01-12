-- =============================================
-- MEJORA: Sistema de deuda inicial con períodos específicos
-- Fecha: 13 Enero 2026
-- =============================================

-- 1. Agregar campos nuevos a client_fiscal_data
ALTER TABLE public.client_fiscal_data

-- Fecha de alta en el sistema (para limitar búsqueda retroactiva)
ADD COLUMN IF NOT EXISTS fecha_alta_sistema DATE DEFAULT CURRENT_DATE,

-- Períodos específicos de deuda inicial (mejora sobre solo "cantidad")
ADD COLUMN IF NOT EXISTS periodo_deuda_desde DATE,
ADD COLUMN IF NOT EXISTS periodo_deuda_hasta DATE,

-- Mantener cantidad para compatibilidad y cálculos rápidos
ADD COLUMN IF NOT EXISTS cuotas_adeudadas_al_alta INTEGER DEFAULT 0;

-- 2. Comentarios
COMMENT ON COLUMN public.client_fiscal_data.fecha_alta_sistema
    IS 'Fecha en que el cliente fue dado de alta en MonoGestión. Limita la búsqueda retroactiva de cuotas.';

COMMENT ON COLUMN public.client_fiscal_data.periodo_deuda_desde
    IS 'Primer mes de la deuda inicial (ej: 2025-05-01). Para evitar doble conteo.';

COMMENT ON COLUMN public.client_fiscal_data.periodo_deuda_hasta
    IS 'Último mes de la deuda inicial (ej: 2025-12-01). Para evitar doble conteo.';

COMMENT ON COLUMN public.client_fiscal_data.cuotas_adeudadas_al_alta
    IS 'Cantidad de cuotas que debía al momento del alta. Se decrementa al pagar meses del período inicial.';

-- 3. Inicializar fecha_alta_sistema para clientes existentes
UPDATE public.client_fiscal_data
SET fecha_alta_sistema = DATE(created_at)
WHERE fecha_alta_sistema IS NULL;

-- 4. Función CORREGIDA para calcular estado de pago
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

    -- Control de contexto
    v_fecha_alta DATE;
    v_deuda_inicial INTEGER;
    v_periodo_desde DATE;
    v_periodo_hasta DATE;
    v_meses_desde_alta INTEGER;
    v_tiene_datos BOOLEAN := FALSE;
    v_fecha_check DATE;
BEGIN
    -- 1. Obtener contexto del cliente
    SELECT
        fecha_alta_sistema,
        cuotas_adeudadas_al_alta,
        periodo_deuda_desde,
        periodo_deuda_hasta
    INTO
        v_fecha_alta,
        v_deuda_inicial,
        v_periodo_desde,
        v_periodo_hasta
    FROM public.client_fiscal_data
    WHERE id = p_client_id;

    -- 2. Obtener fecha actual en Argentina (UTC-3)
    v_ahora_arg := NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires';
    v_dia_actual := EXTRACT(DAY FROM v_ahora_arg);
    v_mes_actual := EXTRACT(MONTH FROM v_ahora_arg);
    v_anio_actual := EXTRACT(YEAR FROM v_ahora_arg);

    v_anio_check := v_anio_actual;
    v_mes_check := v_mes_actual;

    -- 3. Ajustar por día 20 (vencimiento)
    IF v_dia_actual < 20 THEN
        v_mes_check := v_mes_check - 1;
        IF v_mes_check = 0 THEN
            v_mes_check := 12;
            v_anio_check := v_anio_check - 1;
        END IF;
    END IF;

    -- 4. Calcular cuántos meses desde el alta
    IF v_fecha_alta IS NOT NULL THEN
        v_meses_desde_alta := (
            (v_anio_check - EXTRACT(YEAR FROM v_fecha_alta)) * 12 +
            (v_mes_check - EXTRACT(MONTH FROM v_fecha_alta))
        );

        -- Si se dio de alta hace menos de 1 mes y no tiene deuda inicial
        -- → retornar 'desconocido' (sin datos suficientes)
        IF v_meses_desde_alta < 1 AND COALESCE(v_deuda_inicial, 0) = 0 THEN
            RETURN 'desconocido';
        END IF;
    ELSE
        -- Cliente sin fecha_alta (legacy) → usar límite de 12 meses
        v_meses_desde_alta := 12;
    END IF;

    -- 5. Contar meses adeudados SOLO desde la fecha de alta
    FOR i IN 1..LEAST(12, v_meses_desde_alta + 1) LOOP
        -- Construir fecha del mes a verificar
        v_fecha_check := make_date(v_anio_check, v_mes_check, 1);

        -- Si retrocedimos antes de la fecha de alta, DETENER
        IF v_fecha_alta IS NOT NULL AND v_fecha_check < v_fecha_alta THEN
            EXIT;
        END IF;

        -- Verificar si este mes está en el período de deuda inicial
        -- (para NO contarlo dos veces)
        IF v_periodo_desde IS NOT NULL AND v_periodo_hasta IS NOT NULL THEN
            IF v_fecha_check >= v_periodo_desde AND v_fecha_check <= v_periodo_hasta THEN
                -- Este mes está cubierto por deuda_inicial, saltar
                v_mes_check := v_mes_check - 1;
                IF v_mes_check = 0 THEN
                    v_mes_check := 12;
                    v_anio_check := v_anio_check - 1;
                END IF;
                CONTINUE;
            END IF;
        END IF;

        -- Buscar cuota pagada para este mes
        SELECT estado INTO v_cuota_estado
        FROM public.client_cuota_mensual
        WHERE client_id = p_client_id
          AND anio = v_anio_check
          AND mes = v_mes_check
          AND estado IN ('informada', 'verificada')
        LIMIT 1;

        -- Si encontró pago, marcar que hay datos y detener
        IF v_cuota_estado IS NOT NULL THEN
            v_tiene_datos := TRUE;
            EXIT;
        END IF;

        -- Verificar si hay algún registro (incluso pendiente) para marcar que hay datos
        SELECT COUNT(*) > 0 INTO v_tiene_datos
        FROM public.client_cuota_mensual
        WHERE client_id = p_client_id
          AND anio = v_anio_check
          AND mes = v_mes_check;

        -- Incrementar adeudado
        v_meses_adeudados := v_meses_adeudados + 1;

        -- Retroceder un mes
        v_mes_check := v_mes_check - 1;
        IF v_mes_check = 0 THEN
            v_mes_check := 12;
            v_anio_check := v_anio_check - 1;
        END IF;
    END LOOP;

    -- 6. SUMAR deuda inicial (solo si está configurada)
    IF v_deuda_inicial IS NOT NULL AND v_deuda_inicial > 0 THEN
        v_meses_adeudados := v_meses_adeudados + v_deuda_inicial;
        v_tiene_datos := TRUE;
    END IF;

    -- 7. Clasificar con protección de "sin datos"
    -- Si no tiene datos Y no tiene deuda inicial → desconocido
    IF NOT v_tiene_datos AND v_meses_adeudados = 0 THEN
        RETURN 'desconocido';
    END IF;

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
'Calcula el estado de pago considerando: fecha de alta, deuda inicial con períodos específicos, y cuotas registradas. Evita doble conteo y retorna "desconocido" cuando no hay datos suficientes.';

-- 5. Trigger para ajustar deuda inicial al registrar pagos
CREATE OR REPLACE FUNCTION public.ajustar_deuda_inicial_al_pagar()
RETURNS TRIGGER AS $$
DECLARE
    v_periodo_desde DATE;
    v_periodo_hasta DATE;
    v_deuda_inicial INTEGER;
    v_fecha_pago DATE;
BEGIN
    -- Solo procesar si el estado es 'informada' o 'verificada'
    IF NEW.estado NOT IN ('informada', 'verificada') THEN
        RETURN NEW;
    END IF;

    -- Obtener datos de deuda inicial
    SELECT periodo_deuda_desde, periodo_deuda_hasta, cuotas_adeudadas_al_alta
    INTO v_periodo_desde, v_periodo_hasta, v_deuda_inicial
    FROM public.client_fiscal_data
    WHERE id = NEW.client_id;

    -- Si no hay período de deuda inicial, no hacer nada
    IF v_periodo_desde IS NULL OR v_periodo_hasta IS NULL THEN
        RETURN NEW;
    END IF;

    -- Construir fecha del mes pagado
    v_fecha_pago := make_date(NEW.anio, NEW.mes, 1);

    -- Si el mes pagado está en el rango de deuda inicial
    IF v_fecha_pago >= v_periodo_desde AND v_fecha_pago <= v_periodo_hasta THEN
        -- Decrementar deuda inicial (mínimo 0)
        UPDATE public.client_fiscal_data
        SET cuotas_adeudadas_al_alta = GREATEST(0, COALESCE(cuotas_adeudadas_al_alta, 0) - 1)
        WHERE id = NEW.client_id;

        -- Si llegó a 0, limpiar períodos
        IF v_deuda_inicial <= 1 THEN
            UPDATE public.client_fiscal_data
            SET periodo_deuda_desde = NULL,
                periodo_deuda_hasta = NULL
            WHERE id = NEW.client_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_ajustar_deuda_inicial ON public.client_cuota_mensual;
CREATE TRIGGER trigger_ajustar_deuda_inicial
    AFTER INSERT OR UPDATE ON public.client_cuota_mensual
    FOR EACH ROW
    EXECUTE FUNCTION public.ajustar_deuda_inicial_al_pagar();

COMMENT ON TRIGGER trigger_ajustar_deuda_inicial ON public.client_cuota_mensual IS
'Decrementa cuotas_adeudadas_al_alta cuando se paga un mes que está en el período de deuda inicial';

-- 6. Actualizar todos los estados de pago
UPDATE public.client_fiscal_data
SET estado_pago_monotributo = public.calcular_estado_pago_monotributo(id)
WHERE tipo_contribuyente = 'monotributista';
