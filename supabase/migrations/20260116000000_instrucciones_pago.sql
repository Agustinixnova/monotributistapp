-- =============================================
-- Tabla: client_instrucciones_pago
-- Almacena instrucciones de pago generadas por contadores
-- para que los clientes vean en su dashboard
-- =============================================

CREATE TABLE public.client_instrucciones_pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,

    -- Tipo de impuesto
    tipo TEXT NOT NULL CHECK (tipo IN ('monotributo', 'iibb')),

    -- Método de pago
    metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('debito_automatico', 'vep', 'mercado_pago', 'efectivo')),

    -- Datos específicos según método de pago
    vep_link TEXT,
    vep_monto DECIMAL(12,2),
    vep_vencimiento DATE,
    mercadopago_link TEXT,
    cpe_codigo TEXT,  -- Código de pago electrónico para efectivo

    -- Período (mes/año de la obligación)
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL,

    -- Notas adicionales del contador
    notas TEXT,

    -- Auditoría
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un solo registro activo por cliente/tipo/mes
    UNIQUE(client_id, tipo, anio, mes)
);

-- Comentarios
COMMENT ON TABLE public.client_instrucciones_pago IS 'Instrucciones de pago generadas por contadores para clientes';
COMMENT ON COLUMN public.client_instrucciones_pago.tipo IS 'Tipo de impuesto: monotributo o iibb';
COMMENT ON COLUMN public.client_instrucciones_pago.metodo_pago IS 'Método de pago: debito_automatico, vep, mercado_pago, efectivo';
COMMENT ON COLUMN public.client_instrucciones_pago.vep_link IS 'Link al VEP generado (solo para método vep)';
COMMENT ON COLUMN public.client_instrucciones_pago.vep_monto IS 'Monto del VEP (solo para método vep)';
COMMENT ON COLUMN public.client_instrucciones_pago.cpe_codigo IS 'Código de pago electrónico para pago en efectivo';

-- Índices
CREATE INDEX idx_instrucciones_client ON public.client_instrucciones_pago(client_id);
CREATE INDEX idx_instrucciones_periodo ON public.client_instrucciones_pago(anio, mes);
CREATE INDEX idx_instrucciones_tipo ON public.client_instrucciones_pago(tipo);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_instrucciones_pago_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_instrucciones_pago_updated_at
    BEFORE UPDATE ON public.client_instrucciones_pago
    FOR EACH ROW
    EXECUTE FUNCTION update_instrucciones_pago_updated_at();

-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE public.client_instrucciones_pago ENABLE ROW LEVEL SECURITY;

-- Contadores pueden hacer todo (CRUD completo)
CREATE POLICY "instrucciones_contador_all" ON public.client_instrucciones_pago
    FOR ALL USING (public.is_contador());

-- Clientes solo pueden ver sus propias instrucciones
CREATE POLICY "instrucciones_cliente_select" ON public.client_instrucciones_pago
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );
