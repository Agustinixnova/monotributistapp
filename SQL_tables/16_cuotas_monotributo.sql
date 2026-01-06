-- =============================================
-- Tabla: client_cuota_mensual
-- Descripción: Seguimiento del pago de cuota mensual del monotributo
-- =============================================

CREATE TABLE IF NOT EXISTS public.client_cuota_mensual (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relación con cliente
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,

    -- Período
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2100),
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),

    -- Monto de la cuota (se obtiene de monotributo_categorias según la categoría del cliente)
    monto_cuota DECIMAL,

    -- Estado del pago
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'informada', 'verificada', 'vencida')),

    -- Fecha de pago informada
    fecha_pago DATE,

    -- Comprobante (URL de Storage)
    comprobante_url TEXT,

    -- Notas
    nota TEXT,

    -- Auditoría
    informado_por UUID REFERENCES public.profiles(id),
    verificado_por UUID REFERENCES public.profiles(id),
    verificado_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un solo registro por cliente por mes
    UNIQUE(client_id, anio, mes)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cuota_mensual_client ON public.client_cuota_mensual(client_id);
CREATE INDEX IF NOT EXISTS idx_cuota_mensual_periodo ON public.client_cuota_mensual(anio, mes);
CREATE INDEX IF NOT EXISTS idx_cuota_mensual_estado ON public.client_cuota_mensual(estado);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_cuota_mensual_updated_at ON public.client_cuota_mensual;
CREATE TRIGGER trigger_cuota_mensual_updated_at
    BEFORE UPDATE ON public.client_cuota_mensual
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.client_cuota_mensual IS 'Seguimiento del pago de cuota mensual del monotributo';
COMMENT ON COLUMN public.client_cuota_mensual.estado IS 'pendiente=no pagó, informada=cliente dijo que pagó, verificada=contadora confirmó, vencida=pasó el día 20 sin pago';

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE public.client_cuota_mensual ENABLE ROW LEVEL SECURITY;

-- SELECT: Admin y contadoras ven todo
CREATE POLICY "cuota_mensual_select_admin" ON public.client_cuota_mensual
    FOR SELECT USING (
        public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora')
    );

-- SELECT: Contador secundario ve solo sus clientes
CREATE POLICY "cuota_mensual_select_contador" ON public.client_cuota_mensual
    FOR SELECT USING (
        public.get_user_role() = 'contador_secundario'
        AND client_id IN (
            SELECT cfd.id FROM public.client_fiscal_data cfd
            JOIN public.profiles p ON cfd.user_id = p.id
            WHERE p.assigned_to = auth.uid()
        )
    );

-- SELECT: Cliente ve solo sus cuotas
CREATE POLICY "cuota_mensual_select_cliente" ON public.client_cuota_mensual
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );

-- INSERT: Admin y contadoras
CREATE POLICY "cuota_mensual_insert_admin" ON public.client_cuota_mensual
    FOR INSERT WITH CHECK (
        public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
    );

-- INSERT: Cliente puede informar su pago
CREATE POLICY "cuota_mensual_insert_cliente" ON public.client_cuota_mensual
    FOR INSERT WITH CHECK (
        public.get_user_role() IN ('monotributista', 'responsable_inscripto')
        AND client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );

-- UPDATE: Admin y contadoras (para verificar)
CREATE POLICY "cuota_mensual_update_admin" ON public.client_cuota_mensual
    FOR UPDATE USING (
        public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
    );

-- UPDATE: Cliente puede actualizar solo estado 'pendiente' a 'informada'
CREATE POLICY "cuota_mensual_update_cliente" ON public.client_cuota_mensual
    FOR UPDATE USING (
        public.get_user_role() IN ('monotributista', 'responsable_inscripto')
        AND estado IN ('pendiente', 'informada')
        AND client_id IN (
            SELECT id FROM public.client_fiscal_data WHERE user_id = auth.uid()
        )
    );

-- DELETE: Solo admin
CREATE POLICY "cuota_mensual_delete_admin" ON public.client_cuota_mensual
    FOR DELETE USING (
        public.get_user_role() = 'admin'
    );
