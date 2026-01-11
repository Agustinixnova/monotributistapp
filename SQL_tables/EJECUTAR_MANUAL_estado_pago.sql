-- =============================================
-- SCRIPT MANUAL: Verificar y actualizar estado de pago
-- =============================================
-- Ejecutar este script en el SQL Editor de Supabase
-- si la migración automática no se aplicó correctamente
-- =============================================

-- PASO 1: Verificar si la función existe
-- =============================================
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'calcular_estado_pago_monotributo';

-- Si NO devuelve resultados, ejecutar desde PASO 2
-- Si devuelve resultados, saltar al PASO 4

-- PASO 2: Crear la función si no existe
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
    v_max_meses_check INTEGER := 12;
BEGIN
    v_ahora_arg := NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires';
    v_dia_actual := EXTRACT(DAY FROM v_ahora_arg);
    v_mes_actual := EXTRACT(MONTH FROM v_ahora_arg);
    v_anio_actual := EXTRACT(YEAR FROM v_ahora_arg);

    v_anio_check := v_anio_actual;
    v_mes_check := v_mes_actual;

    IF v_dia_actual < 20 THEN
        v_mes_check := v_mes_check - 1;
        IF v_mes_check = 0 THEN
            v_mes_check := 12;
            v_anio_check := v_anio_check - 1;
        END IF;
    END IF;

    FOR i IN 1..v_max_meses_check LOOP
        SELECT estado INTO v_cuota_estado
        FROM public.client_cuota_mensual
        WHERE client_id = p_client_id
          AND anio = v_anio_check
          AND mes = v_mes_check
          AND estado IN ('informada', 'verificada')
        LIMIT 1;

        IF v_cuota_estado IS NOT NULL THEN
            EXIT;
        END IF;

        v_meses_adeudados := v_meses_adeudados + 1;

        v_mes_check := v_mes_check - 1;
        IF v_mes_check = 0 THEN
            v_mes_check := 12;
            v_anio_check := v_anio_check - 1;
        END IF;
    END LOOP;

    IF v_meses_adeudados = 0 THEN
        RETURN 'al_dia';
    ELSIF v_meses_adeudados = 1 THEN
        RETURN 'debe_1_cuota';
    ELSE
        RETURN 'debe_2_mas';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Crear el trigger si no existe
-- =============================================
CREATE OR REPLACE FUNCTION public.actualizar_estado_pago_trigger()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.client_fiscal_data
    SET estado_pago_monotributo = public.calcular_estado_pago_monotributo(NEW.client_id)
    WHERE id = NEW.client_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_actualizar_estado_pago ON public.client_cuota_mensual;
CREATE TRIGGER trigger_actualizar_estado_pago
    AFTER INSERT OR UPDATE ON public.client_cuota_mensual
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_estado_pago_trigger();

-- PASO 4: Probar la función con un cliente específico
-- =============================================
-- Descomentar y reemplazar 'uuid-del-cliente' con un ID real
-- SELECT id, razon_social, estado_pago_monotributo,
--        public.calcular_estado_pago_monotributo(id) as estado_calculado
-- FROM public.client_fiscal_data
-- WHERE id = 'uuid-del-cliente'
-- LIMIT 1;

-- PASO 5: Actualizar TODOS los clientes monotributistas
-- =============================================
-- IMPORTANTE: Esto actualizará todos los monotributistas
-- Verificar primero con PASO 4 antes de ejecutar

UPDATE public.client_fiscal_data
SET estado_pago_monotributo = public.calcular_estado_pago_monotributo(id)
WHERE tipo_contribuyente = 'monotributista';

-- PASO 6: Verificar resultados
-- =============================================
SELECT
    estado_pago_monotributo,
    COUNT(*) as cantidad
FROM public.client_fiscal_data
WHERE tipo_contribuyente = 'monotributista'
GROUP BY estado_pago_monotributo
ORDER BY estado_pago_monotributo;

-- PASO 7 (OPCIONAL): Ver detalle de clientes que deben
-- =============================================
-- SELECT
--     cfd.razon_social,
--     cfd.estado_pago_monotributo,
--     p.nombre,
--     p.apellido
-- FROM public.client_fiscal_data cfd
-- JOIN public.profiles p ON cfd.user_id = p.id
-- WHERE cfd.tipo_contribuyente = 'monotributista'
--   AND cfd.estado_pago_monotributo IN ('debe_1_cuota', 'debe_2_mas')
-- ORDER BY cfd.estado_pago_monotributo DESC, cfd.razon_social;
