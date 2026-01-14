-- =============================================
-- Tabla: client_facturas_detalle
-- Descripción: Detalle individual de facturas
-- =============================================

CREATE TABLE IF NOT EXISTS public.client_facturas_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relación con facturación mensual (NOTA: puede referenciar tabla antigua o nueva)
    facturacion_mensual_id UUID NOT NULL,

    -- Datos de la factura
    fecha_emision DATE NOT NULL,
    tipo_comprobante TEXT NOT NULL CHECK (tipo_comprobante IN ('FC_A', 'FC_B', 'FC_C', 'FC_M', 'FC_E', 'NC_A', 'NC_B', 'NC_C', 'ND_A', 'ND_B', 'ND_C', 'RECIBO', 'OTRO')),
    punto_venta TEXT,
    numero_comprobante TEXT,

    -- Receptor
    receptor_razon_social TEXT NOT NULL,
    receptor_cuit TEXT,

    -- Monto total del comprobante
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
-- RLS Policies
-- =============================================

ALTER TABLE public.client_facturas_detalle ENABLE ROW LEVEL SECURITY;

-- SELECT: Admin y desarrollo ven todo
CREATE POLICY "facturas_detalle_select_admin" ON public.client_facturas_detalle
    FOR SELECT USING (public.is_full_access());

-- INSERT: Solo admin puede insertar
CREATE POLICY "facturas_detalle_insert_admin" ON public.client_facturas_detalle
    FOR INSERT WITH CHECK (public.is_full_access());

-- UPDATE: Solo admin puede actualizar
CREATE POLICY "facturas_detalle_update_admin" ON public.client_facturas_detalle
    FOR UPDATE USING (public.is_full_access());

-- DELETE: Solo admin puede eliminar
CREATE POLICY "facturas_detalle_delete" ON public.client_facturas_detalle
    FOR DELETE USING (public.is_full_access());
