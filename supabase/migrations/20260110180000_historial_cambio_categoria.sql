-- =============================================
-- Tabla: historial_cambio_categoria
-- Descripcion: Registro de cambios de categoria de monotributo
-- =============================================

CREATE TABLE IF NOT EXISTS public.historial_cambio_categoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Cliente afectado
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,

    -- Cambio realizado
    categoria_anterior TEXT NOT NULL,
    categoria_nueva TEXT NOT NULL,

    -- Contexto del cambio
    motivo TEXT,
    facturacion_al_momento NUMERIC(15,2),
    porcentaje_tope_anterior NUMERIC(5,2),
    porcentaje_tope_nuevo NUMERIC(5,2),

    -- Quien y cuando
    realizado_por UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_historial_categoria_client ON public.historial_cambio_categoria(client_id);
CREATE INDEX IF NOT EXISTS idx_historial_categoria_fecha ON public.historial_cambio_categoria(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historial_categoria_usuario ON public.historial_cambio_categoria(realizado_por);

-- RLS
ALTER TABLE public.historial_cambio_categoria ENABLE ROW LEVEL SECURITY;

-- SELECT: Contadores pueden ver historial de sus clientes
DROP POLICY IF EXISTS "historial_categoria_select" ON public.historial_cambio_categoria;
CREATE POLICY "historial_categoria_select" ON public.historial_cambio_categoria
    FOR SELECT USING (public.is_contador());

-- INSERT: Contadores pueden registrar cambios
DROP POLICY IF EXISTS "historial_categoria_insert" ON public.historial_cambio_categoria;
CREATE POLICY "historial_categoria_insert" ON public.historial_cambio_categoria
    FOR INSERT WITH CHECK (public.is_contador());

COMMENT ON TABLE public.historial_cambio_categoria IS 'Historial de cambios de categoria de monotributo por cliente';
COMMENT ON COLUMN public.historial_cambio_categoria.facturacion_al_momento IS 'Facturacion acumulada 12 meses al momento del cambio';
