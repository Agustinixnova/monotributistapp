-- =============================================
-- FIX: Permitir que el trigger actualice el resumen
-- El problema es que SECURITY DEFINER no bypasea RLS automaticamente en Supabase
-- =============================================

-- Opcion 1: Dar permiso al role 'service_role' y ejecutar la funcion con ese role
-- Esto requiere que la funcion se ejecute sin RLS

-- Recrear la funcion con SET search_path y asegurar bypass de RLS
CREATE OR REPLACE FUNCTION public.recalcular_resumen_mensual(
    p_client_id UUID,
    p_anio INTEGER,
    p_mes INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_total_fc DECIMAL := 0;
    v_total_nd DECIMAL := 0;
    v_total_nc DECIMAL := 0;
    v_total_neto DECIMAL := 0;
    v_cantidad INTEGER := 0;
BEGIN
    -- Calcular totales desde las cargas
    SELECT
        COALESCE(SUM(CASE WHEN tipo_comprobante = 'FC' THEN monto ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN tipo_comprobante = 'ND' THEN monto ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN tipo_comprobante = 'NC' THEN monto ELSE 0 END), 0),
        COALESCE(SUM(cantidad_comprobantes), 0)
    INTO v_total_fc, v_total_nd, v_total_nc, v_cantidad
    FROM public.client_facturacion_cargas
    WHERE client_id = p_client_id
      AND anio = p_anio
      AND mes = p_mes;

    -- Neto = FC + ND - NC
    v_total_neto := v_total_fc + v_total_nd - v_total_nc;

    -- Si no hay cargas, eliminar el resumen si existe
    IF v_cantidad = 0 THEN
        DELETE FROM public.client_facturacion_mensual_resumen
        WHERE client_id = p_client_id AND anio = p_anio AND mes = p_mes;
        RETURN;
    END IF;

    -- Insertar o actualizar resumen
    INSERT INTO public.client_facturacion_mensual_resumen (
        client_id, anio, mes,
        total_facturas, total_notas_debito, total_notas_credito,
        total_neto, cantidad_comprobantes
    )
    VALUES (
        p_client_id, p_anio, p_mes,
        v_total_fc, v_total_nd, v_total_nc,
        v_total_neto, v_cantidad
    )
    ON CONFLICT (client_id, anio, mes)
    DO UPDATE SET
        total_facturas = v_total_fc,
        total_notas_debito = v_total_nd,
        total_notas_credito = v_total_nc,
        total_neto = v_total_neto,
        cantidad_comprobantes = v_cantidad,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Asegurar que el owner sea el superuser para bypass de RLS
ALTER FUNCTION public.recalcular_resumen_mensual(UUID, INTEGER, INTEGER) OWNER TO postgres;

-- Recrear el trigger por si acaso
DROP TRIGGER IF EXISTS trigger_cargas_recalcular ON public.client_facturacion_cargas;
CREATE TRIGGER trigger_cargas_recalcular
    AFTER INSERT OR UPDATE OR DELETE ON public.client_facturacion_cargas
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_recalcular_resumen();

-- Agregar policy mas permisiva para INSERT en resumen
-- El trigger necesita poder crear el primer resumen
DROP POLICY IF EXISTS "resumen_insert_trigger" ON public.client_facturacion_mensual_resumen;
CREATE POLICY "resumen_insert_trigger" ON public.client_facturacion_mensual_resumen
    FOR INSERT WITH CHECK (true);

-- Agregar policy para UPDATE desde trigger
DROP POLICY IF EXISTS "resumen_update_trigger" ON public.client_facturacion_mensual_resumen;
CREATE POLICY "resumen_update_trigger" ON public.client_facturacion_mensual_resumen
    FOR UPDATE USING (true);

-- Dar permisos al authenticated role para insert/update via trigger
GRANT INSERT, UPDATE ON public.client_facturacion_mensual_resumen TO authenticated;

-- Verificar que el trigger_recalcular_resumen tambien tenga SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.trigger_recalcular_resumen()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.recalcular_resumen_mensual(OLD.client_id, OLD.anio, OLD.mes);
        RETURN OLD;
    ELSE
        PERFORM public.recalcular_resumen_mensual(NEW.client_id, NEW.anio, NEW.mes);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

ALTER FUNCTION public.trigger_recalcular_resumen() OWNER TO postgres;
