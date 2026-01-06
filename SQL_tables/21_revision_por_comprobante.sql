-- =============================================
-- MIGRACIÓN: Revisión por comprobante individual
-- =============================================

-- 1. Agregar campos de revisión a cada carga
ALTER TABLE public.client_facturacion_cargas
ADD COLUMN IF NOT EXISTS estado_revision TEXT DEFAULT 'pendiente'
    CHECK (estado_revision IN ('pendiente', 'ok', 'observado')),
ADD COLUMN IF NOT EXISTS nota_observacion TEXT,
ADD COLUMN IF NOT EXISTS revisado_por UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS revisado_at TIMESTAMPTZ;

-- 2. Índice para filtrar por estado
CREATE INDEX IF NOT EXISTS idx_cargas_estado_revision
ON public.client_facturacion_cargas(estado_revision);

-- 3. Función para marcar comprobante como OK
CREATE OR REPLACE FUNCTION public.marcar_comprobante_ok(
    p_carga_id UUID,
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.client_facturacion_cargas
    SET
        estado_revision = 'ok',
        nota_observacion = NULL,
        revisado_por = p_user_id,
        revisado_at = NOW()
    WHERE id = p_carga_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función para marcar comprobante como observado
CREATE OR REPLACE FUNCTION public.marcar_comprobante_observado(
    p_carga_id UUID,
    p_user_id UUID,
    p_nota TEXT
)
RETURNS VOID AS $$
DECLARE
    v_client_id UUID;
    v_fecha DATE;
    v_monto DECIMAL;
    v_tipo TEXT;
BEGIN
    -- Actualizar el comprobante
    UPDATE public.client_facturacion_cargas
    SET
        estado_revision = 'observado',
        nota_observacion = p_nota,
        revisado_por = p_user_id,
        revisado_at = NOW()
    WHERE id = p_carga_id
    RETURNING client_id, fecha_emision, monto, tipo_comprobante
    INTO v_client_id, v_fecha, v_monto, v_tipo;

    -- Crear notificación para el cliente (si existe la función)
    BEGIN
        PERFORM public.crear_notificacion(
            (SELECT user_id FROM public.client_fiscal_data WHERE id = v_client_id),
            'comprobante_observado',
            'Comprobante con observación',
            format('Tu contadora tiene una observación sobre el %s del %s por $%s',
                   v_tipo, to_char(v_fecha, 'DD/MM/YYYY'), v_monto::TEXT),
            v_client_id,
            format('/facturacion?mes=%s-%s',
                   EXTRACT(YEAR FROM v_fecha)::INT,
                   EXTRACT(MONTH FROM v_fecha)::INT)
        );
    EXCEPTION
        WHEN undefined_function THEN NULL;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Función para marcar TODOS los comprobantes del mes como OK
CREATE OR REPLACE FUNCTION public.marcar_todos_ok_mes(
    p_client_id UUID,
    p_anio INTEGER,
    p_mes INTEGER,
    p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.client_facturacion_cargas
    SET
        estado_revision = 'ok',
        nota_observacion = NULL,
        revisado_por = p_user_id,
        revisado_at = NOW()
    WHERE client_id = p_client_id
      AND anio = p_anio
      AND mes = p_mes
      AND estado_revision != 'ok';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Función para verificar si se puede cerrar el mes
CREATE OR REPLACE FUNCTION public.puede_cerrar_mes(
    p_client_id UUID,
    p_anio INTEGER,
    p_mes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_pendientes INTEGER;
    v_observados INTEGER;
BEGIN
    SELECT
        COUNT(*) FILTER (WHERE estado_revision = 'pendiente'),
        COUNT(*) FILTER (WHERE estado_revision = 'observado')
    INTO v_pendientes, v_observados
    FROM public.client_facturacion_cargas
    WHERE client_id = p_client_id
      AND anio = p_anio
      AND mes = p_mes;

    -- Solo se puede cerrar si no hay pendientes ni observados
    RETURN v_pendientes = 0 AND v_observados = 0;
END;
$$ LANGUAGE plpgsql;

-- 7. Función mejorada para cerrar mes (con validación)
CREATE OR REPLACE FUNCTION public.cerrar_mes_facturacion(
    p_client_id UUID,
    p_anio INTEGER,
    p_mes INTEGER,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar que se puede cerrar
    IF NOT public.puede_cerrar_mes(p_client_id, p_anio, p_mes) THEN
        RAISE EXCEPTION 'No se puede cerrar el mes: hay comprobantes pendientes u observados';
    END IF;

    -- Cerrar el mes
    UPDATE public.client_facturacion_mensual_resumen
    SET
        estado = 'cerrado',
        cerrado_por = p_user_id,
        cerrado_at = NOW()
    WHERE client_id = p_client_id
      AND anio = p_anio
      AND mes = p_mes;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Actualizar función recalcular para incluir conteo de estados
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
    v_pendientes INTEGER := 0;
    v_observados INTEGER := 0;
BEGIN
    SELECT
        COALESCE(SUM(CASE WHEN tipo_comprobante = 'FC' THEN monto ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN tipo_comprobante = 'ND' THEN monto ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN tipo_comprobante = 'NC' THEN monto ELSE 0 END), 0),
        COALESCE(SUM(cantidad_comprobantes), 0),
        COUNT(*) FILTER (WHERE estado_revision = 'pendiente'),
        COUNT(*) FILTER (WHERE estado_revision = 'observado')
    INTO v_total_fc, v_total_nd, v_total_nc, v_cantidad, v_pendientes, v_observados
    FROM public.client_facturacion_cargas
    WHERE client_id = p_client_id
      AND anio = p_anio
      AND mes = p_mes;

    v_total_neto := v_total_fc + v_total_nd - v_total_nc;

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

    -- Actualizar estado_revision del resumen basado en comprobantes
    UPDATE public.client_facturacion_mensual_resumen
    SET estado_revision = CASE
        WHEN v_observados > 0 THEN 'observado'
        WHEN v_pendientes > 0 THEN 'pendiente'
        ELSE 'revisado'
    END
    WHERE client_id = p_client_id
      AND anio = p_anio
      AND mes = p_mes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Agregar columnas de cierre si no existen
ALTER TABLE public.client_facturacion_mensual_resumen
ADD COLUMN IF NOT EXISTS cerrado_por UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS cerrado_at TIMESTAMPTZ;

COMMENT ON COLUMN public.client_facturacion_cargas.estado_revision IS 'pendiente=sin revisar, ok=aprobado, observado=requiere atención';
