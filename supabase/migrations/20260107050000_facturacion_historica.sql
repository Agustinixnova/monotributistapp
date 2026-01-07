-- =============================================
-- MIGRACION: Soporte para facturacion historica
-- =============================================

-- 1. Campo es_historico en cargas de facturacion
ALTER TABLE public.client_facturacion_cargas
ADD COLUMN IF NOT EXISTS es_historico BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.client_facturacion_cargas.es_historico IS 'Indica si es una carga historica (sin comprobante adjunto, importada de otro contador)';

-- 2. Tabla de historial de categorias del cliente
CREATE TABLE IF NOT EXISTS public.client_historial_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,
    categoria TEXT NOT NULL CHECK (categoria IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K')),
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE,  -- NULL = categoria actual
    motivo TEXT CHECK (motivo IN ('alta', 'recategorizacion', 'migracion')),
    notas TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_historial_cat_client ON public.client_historial_categorias(client_id);
CREATE INDEX IF NOT EXISTS idx_historial_cat_fecha ON public.client_historial_categorias(fecha_desde);

-- RLS
ALTER TABLE public.client_historial_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historial_cat_select" ON public.client_historial_categorias
    FOR SELECT USING (public.is_contador());

CREATE POLICY "historial_cat_insert" ON public.client_historial_categorias
    FOR INSERT WITH CHECK (public.is_contador());

CREATE POLICY "historial_cat_update" ON public.client_historial_categorias
    FOR UPDATE USING (public.is_full_access());

CREATE POLICY "historial_cat_delete" ON public.client_historial_categorias
    FOR DELETE USING (public.is_full_access());

-- 3. Campos adicionales en client_fiscal_data para historial
ALTER TABLE public.client_fiscal_data
ADD COLUMN IF NOT EXISTS facturacion_historica_total DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS facturacion_historica_fecha_corte DATE,
ADD COLUMN IF NOT EXISTS facturacion_historica_nota TEXT;

COMMENT ON COLUMN public.client_fiscal_data.facturacion_historica_total IS 'Total facturado historico (antes de gestion actual)';
COMMENT ON COLUMN public.client_fiscal_data.facturacion_historica_fecha_corte IS 'Fecha hasta la cual aplica el monto historico';
COMMENT ON COLUMN public.client_fiscal_data.facturacion_historica_nota IS 'Nota interna sobre la facturacion historica';

-- 4. Comentarios de tabla
COMMENT ON TABLE public.client_historial_categorias IS 'Historial de categorias del monotributo por cliente';
