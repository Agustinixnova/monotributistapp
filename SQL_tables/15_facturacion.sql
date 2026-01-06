-- =============================================
-- Tablas de Facturación
-- =============================================

-- =============================================
-- Tabla: client_facturacion_mensual
-- Descripción: Registro de facturación mensual por cliente
-- =============================================

CREATE TABLE IF NOT EXISTS public.client_facturacion_mensual (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relación con cliente
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,

    -- Período
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2100),
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),

    -- Montos (separados para control)
    monto_declarado DECIMAL NOT NULL DEFAULT 0 CHECK (monto_declarado >= 0),
    monto_ajustado DECIMAL CHECK (monto_ajustado >= 0),

    -- El monto que computa es el ajustado si existe, sino el declarado
    -- Se calcula en la app: COALESCE(monto_ajustado, monto_declarado)

    cantidad_facturas INTEGER DEFAULT 0,

    -- Tipo de carga
    tipo_carga TEXT NOT NULL DEFAULT 'total' CHECK (tipo_carga IN ('total', 'detallado')),

    -- Estado de revisión (workflow contadora)
    estado_revision TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_revision IN ('pendiente', 'revisado', 'observado')),
    nota_revision TEXT,
    revisado_por UUID REFERENCES public.profiles(id),
    revisado_at TIMESTAMPTZ,

    -- Estado del mes
    estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'cerrado')),
    cerrado_por UUID REFERENCES public.profiles(id),
    cerrado_at TIMESTAMPTZ,

    -- Archivos adjuntos (URLs de Storage)
    archivos_adjuntos JSONB DEFAULT '[]'::jsonb,

    -- Auditoría
    cargado_por UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un solo registro por cliente por mes
    UNIQUE(client_id, anio, mes)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_facturacion_mensual_client ON public.client_facturacion_mensual(client_id);
CREATE INDEX IF NOT EXISTS idx_facturacion_mensual_periodo ON public.client_facturacion_mensual(anio, mes);
CREATE INDEX IF NOT EXISTS idx_facturacion_mensual_estado ON public.client_facturacion_mensual(estado_revision);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_facturacion_mensual_updated_at ON public.client_facturacion_mensual;
CREATE TRIGGER trigger_facturacion_mensual_updated_at
    BEFORE UPDATE ON public.client_facturacion_mensual
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.client_facturacion_mensual IS 'Registro de facturación mensual de cada cliente';
COMMENT ON COLUMN public.client_facturacion_mensual.monto_declarado IS 'Monto que cargó el cliente o la contadora inicialmente';
COMMENT ON COLUMN public.client_facturacion_mensual.monto_ajustado IS 'Monto corregido por la contadora si hubo ajuste';

-- =============================================
-- Tabla: client_facturas_detalle
-- Descripción: Detalle individual de facturas (cuando tipo_carga = 'detallado')
-- NOTA: Monotributistas no discriminan IVA, guardamos solo el total del comprobante
-- =============================================

CREATE TABLE IF NOT EXISTS public.client_facturas_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relación con facturación mensual
    facturacion_mensual_id UUID NOT NULL REFERENCES public.client_facturacion_mensual(id) ON DELETE CASCADE,

    -- Datos de la factura
    fecha_emision DATE NOT NULL,
    tipo_comprobante TEXT NOT NULL CHECK (tipo_comprobante IN ('FC_A', 'FC_B', 'FC_C', 'FC_M', 'FC_E', 'NC_A', 'NC_B', 'NC_C', 'ND_A', 'ND_B', 'ND_C', 'RECIBO', 'OTRO')),
    punto_venta TEXT,
    numero_comprobante TEXT,

    -- Receptor
    receptor_razon_social TEXT NOT NULL,
    receptor_cuit TEXT,

    -- Monto total del comprobante (lo que dice la factura, sin desglose de IVA)
    importe_total DECIMAL NOT NULL CHECK (importe_total >= 0),

    -- Descripción/concepto (opcional)
    descripcion TEXT,

    -- Archivo adjunto (URL de Storage)
    archivo_url TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_facturas_detalle_mensual ON public.client_facturas_detalle(facturacion_mensual_id);
CREATE INDEX IF NOT EXISTS idx_facturas_detalle_fecha ON public.client_facturas_detalle(fecha_emision);

COMMENT ON TABLE public.client_facturas_detalle IS 'Detalle individual de comprobantes emitidos';
COMMENT ON COLUMN public.client_facturas_detalle.importe_total IS 'Monto total del comprobante tal como figura en el documento';

-- =============================================
-- RLS Policies para Facturación
-- =============================================

ALTER TABLE public.client_facturacion_mensual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_facturas_detalle ENABLE ROW LEVEL SECURITY;

-- SELECT: Admin y contadoras ven todo
CREATE POLICY "facturacion_mensual_select_admin" ON public.client_facturacion_mensual
    FOR SELECT USING (
        public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora')
    );

-- SELECT: Contador secundario ve solo sus clientes asignados
CREATE POLICY "facturacion_mensual_select_contador" ON public.client_facturacion_mensual
    FOR SELECT USING (
        public.get_user_role() = 'contador_secundario'
        AND client_id IN (
            SELECT cfd.id FROM public.client_fiscal_data cfd
            JOIN public.profiles p ON cfd.user_id = p.id
            WHERE p.assigned_to = auth.uid()
        )
    );

-- SELECT: Cliente ve solo su facturación
CREATE POLICY "facturacion_mensual_select_cliente" ON public.client_facturacion_mensual
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );

-- INSERT: Admin y contadoras pueden siempre
CREATE POLICY "facturacion_mensual_insert_admin" ON public.client_facturacion_mensual
    FOR INSERT WITH CHECK (
        public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
    );

-- INSERT: Cliente solo si es autónomo
CREATE POLICY "facturacion_mensual_insert_cliente" ON public.client_facturacion_mensual
    FOR INSERT WITH CHECK (
        public.get_user_role() IN ('monotributista', 'responsable_inscripto')
        AND client_id IN (
            SELECT id FROM public.client_fiscal_data
            WHERE user_id = auth.uid() AND gestion_facturacion = 'autonomo'
        )
    );

-- UPDATE: Admin y contadoras siempre
CREATE POLICY "facturacion_mensual_update_admin" ON public.client_facturacion_mensual
    FOR UPDATE USING (
        public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
    );

-- UPDATE: Cliente autónomo puede editar solo sus borradores
CREATE POLICY "facturacion_mensual_update_cliente" ON public.client_facturacion_mensual
    FOR UPDATE USING (
        public.get_user_role() IN ('monotributista', 'responsable_inscripto')
        AND estado = 'borrador'
        AND client_id IN (
            SELECT id FROM public.client_fiscal_data
            WHERE user_id = auth.uid() AND gestion_facturacion = 'autonomo'
        )
    );

-- DELETE: Solo admin y contadora principal
CREATE POLICY "facturacion_mensual_delete_admin" ON public.client_facturacion_mensual
    FOR DELETE USING (
        public.get_user_role() IN ('admin', 'contadora_principal')
    );

-- =============================================
-- RLS para client_facturas_detalle (hereda lógica del padre)
-- =============================================

-- SELECT: Si puede ver la facturación mensual, puede ver el detalle
CREATE POLICY "facturas_detalle_select" ON public.client_facturas_detalle
    FOR SELECT USING (
        facturacion_mensual_id IN (
            SELECT id FROM public.client_facturacion_mensual
        )
    );

-- INSERT: Solo admin y contadoras (el detalle lo carga la contadora)
CREATE POLICY "facturas_detalle_insert" ON public.client_facturas_detalle
    FOR INSERT WITH CHECK (
        public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
    );

-- UPDATE: Solo admin y contadoras
CREATE POLICY "facturas_detalle_update" ON public.client_facturas_detalle
    FOR UPDATE USING (
        public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
    );

-- DELETE: Solo admin y contadora principal
CREATE POLICY "facturas_detalle_delete" ON public.client_facturas_detalle
    FOR DELETE USING (
        public.get_user_role() IN ('admin', 'contadora_principal')
    );
