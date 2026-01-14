-- =============================================
-- MIGRACION: Cargas multiples por mes
-- =============================================

-- 1. Renombrar tabla actual (backup)
-- COMENTADO: En proyecto nuevo no hay tabla para renombrar
-- ALTER TABLE IF EXISTS public.client_facturacion_mensual
-- RENAME TO client_facturacion_mensual_old;

-- 2. Crear nueva tabla de cargas (permite multiples por mes)
CREATE TABLE IF NOT EXISTS public.client_facturacion_cargas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relacion con cliente
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,

    -- Periodo
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2100),
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),

    -- Fecha de emision de los comprobantes (dia real)
    fecha_emision DATE NOT NULL,

    -- Tipo de comprobante
    tipo_comprobante TEXT NOT NULL CHECK (tipo_comprobante IN ('FC', 'NC', 'ND')),
    letra_comprobante TEXT NOT NULL CHECK (letra_comprobante IN ('A', 'B', 'C', 'M', 'E')),

    -- Monto (positivo para FC/ND, las NC se guardan positivas pero se restan al calcular)
    monto DECIMAL NOT NULL CHECK (monto >= 0),

    -- Cantidad de comprobantes en esta carga
    cantidad_comprobantes INTEGER NOT NULL DEFAULT 1 CHECK (cantidad_comprobantes >= 1),

    -- Receptor del comprobante
    receptor_tipo TEXT NOT NULL DEFAULT 'consumidor_final'
        CHECK (receptor_tipo IN ('consumidor_final', 'con_datos')),
    receptor_razon_social TEXT,
    receptor_cuit TEXT,

    -- Nota/descripcion opcional
    nota TEXT,

    -- Archivos adjuntos (array de objetos con path, fileName, size, type)
    archivos_adjuntos JSONB DEFAULT '[]'::jsonb,

    -- Auditoria
    cargado_por UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_cargas_client ON public.client_facturacion_cargas(client_id);
CREATE INDEX IF NOT EXISTS idx_cargas_periodo ON public.client_facturacion_cargas(anio, mes);
CREATE INDEX IF NOT EXISTS idx_cargas_fecha ON public.client_facturacion_cargas(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_cargas_tipo ON public.client_facturacion_cargas(tipo_comprobante);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cargas_updated_at ON public.client_facturacion_cargas;
CREATE TRIGGER trigger_cargas_updated_at
    BEFORE UPDATE ON public.client_facturacion_cargas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE public.client_facturacion_cargas IS 'Cargas de facturacion - permite multiples por mes';
COMMENT ON COLUMN public.client_facturacion_cargas.tipo_comprobante IS 'FC=Factura, NC=Nota Credito, ND=Nota Debito';
COMMENT ON COLUMN public.client_facturacion_cargas.monto IS 'Siempre positivo. Las NC se restan al calcular totales';
COMMENT ON COLUMN public.client_facturacion_cargas.receptor_tipo IS 'consumidor_final o con_datos (tiene razon social/CUIT)';
COMMENT ON COLUMN public.client_facturacion_cargas.receptor_razon_social IS 'Razon social del receptor (si receptor_tipo=con_datos)';

-- =============================================
-- 3. Tabla resumen mensual (se calcula automaticamente)
-- =============================================

CREATE TABLE IF NOT EXISTS public.client_facturacion_mensual_resumen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relacion con cliente
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,

    -- Periodo
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2100),
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),

    -- Totales calculados (se actualizan via trigger)
    total_facturas DECIMAL DEFAULT 0,
    total_notas_debito DECIMAL DEFAULT 0,
    total_notas_credito DECIMAL DEFAULT 0,
    total_neto DECIMAL DEFAULT 0,
    cantidad_comprobantes INTEGER DEFAULT 0,

    -- Estado de revision (workflow contadora)
    estado_revision TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_revision IN ('pendiente', 'revisado', 'observado')),
    nota_revision TEXT,
    revisado_por UUID REFERENCES public.profiles(id),
    revisado_at TIMESTAMPTZ,

    -- Estado del mes (para cierre)
    estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
    cerrado_por UUID REFERENCES public.profiles(id),
    cerrado_at TIMESTAMPTZ,

    -- Notas internas (solo visible para contadora)
    notas_internas TEXT,

    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un solo resumen por cliente por mes
    UNIQUE(client_id, anio, mes)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_resumen_client ON public.client_facturacion_mensual_resumen(client_id);
CREATE INDEX IF NOT EXISTS idx_resumen_periodo ON public.client_facturacion_mensual_resumen(anio, mes);
CREATE INDEX IF NOT EXISTS idx_resumen_estado ON public.client_facturacion_mensual_resumen(estado_revision);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_resumen_updated_at ON public.client_facturacion_mensual_resumen;
CREATE TRIGGER trigger_resumen_updated_at
    BEFORE UPDATE ON public.client_facturacion_mensual_resumen
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.client_facturacion_mensual_resumen IS 'Resumen mensual calculado automaticamente desde las cargas';
COMMENT ON COLUMN public.client_facturacion_mensual_resumen.notas_internas IS 'Notas privadas de la contadora, no visibles para el cliente';

-- =============================================
-- 4. Funcion para recalcular resumen mensual
-- =============================================

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. Trigger para recalcular al insertar/actualizar/eliminar cargas
-- =============================================

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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cargas_recalcular ON public.client_facturacion_cargas;
CREATE TRIGGER trigger_cargas_recalcular
    AFTER INSERT OR UPDATE OR DELETE ON public.client_facturacion_cargas
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_recalcular_resumen();

-- =============================================
-- 6. RLS Policies para client_facturacion_cargas
-- =============================================

ALTER TABLE public.client_facturacion_cargas ENABLE ROW LEVEL SECURITY;

-- SELECT: Roles administrativos ven todo
CREATE POLICY "cargas_select_admin" ON public.client_facturacion_cargas
    FOR SELECT USING (
        public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora')
    );

-- SELECT: Contador secundario ve solo sus clientes asignados
CREATE POLICY "cargas_select_contador" ON public.client_facturacion_cargas
    FOR SELECT USING (
        public.get_user_role() = 'contador_secundario'
        AND client_id IN (
            SELECT cfd.id FROM public.client_fiscal_data cfd
            JOIN public.profiles p ON cfd.user_id = p.id
            WHERE p.assigned_to = auth.uid()
        )
    );

-- SELECT: Cliente ve solo sus cargas
CREATE POLICY "cargas_select_cliente" ON public.client_facturacion_cargas
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );

-- INSERT: Roles administrativos pueden siempre
CREATE POLICY "cargas_insert_admin" ON public.client_facturacion_cargas
    FOR INSERT WITH CHECK (
        public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
    );

-- INSERT: Cliente autonomo puede cargar sus propias facturas
-- NOTA: Verificación de gestion_facturacion='autonomo' comentada temporalmente
-- porque la columna se agrega en migración posterior
CREATE POLICY "cargas_insert_cliente" ON public.client_facturacion_cargas
    FOR INSERT WITH CHECK (
        public.get_user_role() IN ('monotributista', 'responsable_inscripto')
        AND client_id IN (
            SELECT id FROM public.client_fiscal_data
            WHERE user_id = auth.uid() -- AND gestion_facturacion = 'autonomo'
        )
    );

-- UPDATE: Roles administrativos pueden siempre
CREATE POLICY "cargas_update_admin" ON public.client_facturacion_cargas
    FOR UPDATE USING (
        public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
    );

-- UPDATE: Cliente autonomo puede editar sus cargas (si el mes no esta cerrado)
-- NOTA: Verificación de gestion_facturacion='autonomo' comentada temporalmente
CREATE POLICY "cargas_update_cliente" ON public.client_facturacion_cargas
    FOR UPDATE USING (
        public.get_user_role() IN ('monotributista', 'responsable_inscripto')
        AND client_id IN (
            SELECT id FROM public.client_fiscal_data
            WHERE user_id = auth.uid() -- AND gestion_facturacion = 'autonomo'
        )
        AND NOT EXISTS (
            SELECT 1 FROM public.client_facturacion_mensual_resumen r
            WHERE r.client_id = client_facturacion_cargas.client_id
              AND r.anio = client_facturacion_cargas.anio
              AND r.mes = client_facturacion_cargas.mes
              AND r.estado = 'cerrado'
        )
    );

-- DELETE: Solo admin y contadora principal
CREATE POLICY "cargas_delete_admin" ON public.client_facturacion_cargas
    FOR DELETE USING (
        public.get_user_role() IN ('admin', 'contadora_principal')
    );

-- =============================================
-- 7. RLS Policies para client_facturacion_mensual_resumen
-- =============================================

ALTER TABLE public.client_facturacion_mensual_resumen ENABLE ROW LEVEL SECURITY;

-- SELECT: Roles administrativos ven todo
CREATE POLICY "resumen_select_admin" ON public.client_facturacion_mensual_resumen
    FOR SELECT USING (
        public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora')
    );

-- SELECT: Contador secundario ve solo sus clientes
CREATE POLICY "resumen_select_contador" ON public.client_facturacion_mensual_resumen
    FOR SELECT USING (
        public.get_user_role() = 'contador_secundario'
        AND client_id IN (
            SELECT cfd.id FROM public.client_fiscal_data cfd
            JOIN public.profiles p ON cfd.user_id = p.id
            WHERE p.assigned_to = auth.uid()
        )
    );

-- SELECT: Cliente ve su resumen (pero SIN notas_internas)
CREATE POLICY "resumen_select_cliente" ON public.client_facturacion_mensual_resumen
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );

-- UPDATE: Solo roles administrativos (para revision, cierre, notas)
CREATE POLICY "resumen_update_admin" ON public.client_facturacion_mensual_resumen
    FOR UPDATE USING (
        public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
    );

-- INSERT: Se crea automaticamente via trigger, pero permitir a admin
CREATE POLICY "resumen_insert_admin" ON public.client_facturacion_mensual_resumen
    FOR INSERT WITH CHECK (
        public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
    );

-- DELETE: Solo admin
CREATE POLICY "resumen_delete_admin" ON public.client_facturacion_mensual_resumen
    FOR DELETE USING (
        public.get_user_role() = 'admin'
    );

-- =============================================
-- 8. Vista para ocultar notas_internas a clientes
-- =============================================

CREATE OR REPLACE VIEW public.client_facturacion_resumen_cliente AS
SELECT
    id,
    client_id,
    anio,
    mes,
    total_facturas,
    total_notas_debito,
    total_notas_credito,
    total_neto,
    cantidad_comprobantes,
    estado,
    created_at,
    updated_at
    -- NO incluye: estado_revision, nota_revision, notas_internas
FROM public.client_facturacion_mensual_resumen
WHERE client_id IN (
    SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
);

COMMENT ON VIEW public.client_facturacion_resumen_cliente IS 'Vista del resumen para clientes - sin datos internos de la contadora';

-- =============================================
-- 9. Migrar datos existentes (si hay)
-- =============================================
-- COMENTADO: En proyecto nuevo no hay tabla old para migrar datos
/*
-- Si la tabla vieja tenia datos, migrarlos como una carga unica por mes
INSERT INTO public.client_facturacion_cargas (
    client_id, anio, mes, fecha_emision,
    tipo_comprobante, letra_comprobante, monto,
    cantidad_comprobantes, nota, archivos_adjuntos, cargado_por
)
SELECT
    client_id,
    anio,
    mes,
    COALESCE(fecha_carga, make_date(anio, mes, 1)),
    'FC',
    'C',
    ABS(COALESCE(monto, 0)),
    COALESCE(cantidad_comprobantes, 1),
    COALESCE(nota, 'Migrado del sistema anterior'),
    COALESCE(archivos_adjuntos, '[]'::jsonb),
    cargado_por
FROM public.client_facturacion_mensual_old
WHERE COALESCE(monto, 0) > 0;

-- Migrar notas de credito (montos negativos) como NC
INSERT INTO public.client_facturacion_cargas (
    client_id, anio, mes, fecha_emision,
    tipo_comprobante, letra_comprobante, monto,
    cantidad_comprobantes, nota, archivos_adjuntos, cargado_por
)
SELECT
    client_id,
    anio,
    mes,
    COALESCE(fecha_carga, make_date(anio, mes, 1)),
    'NC',
    'C',
    ABS(monto),
    COALESCE(cantidad_comprobantes, 1),
    COALESCE(nota, 'Nota de credito migrada'),
    COALESCE(archivos_adjuntos, '[]'::jsonb),
    cargado_por
FROM public.client_facturacion_mensual_old
WHERE monto < 0;
*/

-- =============================================
-- 10. Limpiar (despues de verificar migracion)
-- =============================================

-- NOTA: Ejecutar esto SOLO despues de verificar que la migracion funciono
-- DROP TABLE IF EXISTS public.client_facturacion_mensual_old;
-- DROP TABLE IF EXISTS public.client_facturas_detalle;
