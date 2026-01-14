-- =============================================
-- Tabla: client_cuota_mensual
-- Descripcion: Seguimiento del pago de cuota mensual del monotributo
-- =============================================

CREATE TABLE IF NOT EXISTS public.client_cuota_mensual (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2100),
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    monto_cuota DECIMAL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'informada', 'verificada', 'vencida')),
    fecha_pago DATE,
    comprobante_url TEXT,
    nota TEXT,
    informado_por UUID REFERENCES public.profiles(id),
    verificado_por UUID REFERENCES public.profiles(id),
    verificado_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, anio, mes)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_cuota_mensual_client ON public.client_cuota_mensual(client_id);
CREATE INDEX IF NOT EXISTS idx_cuota_mensual_periodo ON public.client_cuota_mensual(anio, mes);
CREATE INDEX IF NOT EXISTS idx_cuota_mensual_estado ON public.client_cuota_mensual(estado);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_cuota_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cuota_mensual_updated_at ON public.client_cuota_mensual;
CREATE TRIGGER trigger_cuota_mensual_updated_at
    BEFORE UPDATE ON public.client_cuota_mensual
    FOR EACH ROW
    EXECUTE FUNCTION update_cuota_updated_at();

COMMENT ON TABLE public.client_cuota_mensual IS 'Seguimiento del pago de cuota mensual del monotributo';

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE public.client_cuota_mensual ENABLE ROW LEVEL SECURITY;

-- SELECT: Contadores ven todo
DROP POLICY IF EXISTS "cuota_mensual_select_contador" ON public.client_cuota_mensual;
CREATE POLICY "cuota_mensual_select_contador" ON public.client_cuota_mensual
    FOR SELECT USING (public.is_contador());

-- SELECT: Cliente ve solo sus cuotas
DROP POLICY IF EXISTS "cuota_mensual_select_cliente" ON public.client_cuota_mensual;
CREATE POLICY "cuota_mensual_select_cliente" ON public.client_cuota_mensual
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );

-- INSERT: Contadores pueden crear
DROP POLICY IF EXISTS "cuota_mensual_insert_contador" ON public.client_cuota_mensual;
CREATE POLICY "cuota_mensual_insert_contador" ON public.client_cuota_mensual
    FOR INSERT WITH CHECK (public.is_contador());

-- INSERT: Cliente puede informar su pago
DROP POLICY IF EXISTS "cuota_mensual_insert_cliente" ON public.client_cuota_mensual;
CREATE POLICY "cuota_mensual_insert_cliente" ON public.client_cuota_mensual
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );

-- UPDATE: Contadores pueden actualizar
DROP POLICY IF EXISTS "cuota_mensual_update_contador" ON public.client_cuota_mensual;
CREATE POLICY "cuota_mensual_update_contador" ON public.client_cuota_mensual
    FOR UPDATE USING (public.is_contador());

-- UPDATE: Cliente puede actualizar sus cuotas pendientes
DROP POLICY IF EXISTS "cuota_mensual_update_cliente" ON public.client_cuota_mensual;
CREATE POLICY "cuota_mensual_update_cliente" ON public.client_cuota_mensual
    FOR UPDATE USING (
        estado IN ('pendiente', 'informada')
        AND client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );

-- DELETE: Solo admin
DROP POLICY IF EXISTS "cuota_mensual_delete_admin" ON public.client_cuota_mensual;
CREATE POLICY "cuota_mensual_delete_admin" ON public.client_cuota_mensual
    FOR DELETE USING (public.is_full_access());
