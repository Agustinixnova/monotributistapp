-- =============================================
-- Tabla: monotributo_categorias
-- Descripción: Categorías del monotributo con valores vigentes
-- =============================================

CREATE TABLE IF NOT EXISTS public.monotributo_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria TEXT UNIQUE NOT NULL CHECK (categoria IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K')),
    tope_facturacion_anual DECIMAL,
    tope_facturacion_servicios DECIMAL,
    cuota_total_servicios DECIMAL,
    cuota_total_productos DECIMAL,
    impuesto_integrado_servicios DECIMAL,
    impuesto_integrado_productos DECIMAL,
    aporte_sipa DECIMAL,
    aporte_obra_social DECIMAL,
    superficie_maxima DECIMAL,
    energia_maxima DECIMAL,
    alquiler_maximo DECIMAL,
    precio_unitario_maximo DECIMAL,
    vigente_desde DATE NOT NULL,
    vigente_hasta DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_monotributo_categorias_categoria ON public.monotributo_categorias(categoria);
CREATE INDEX IF NOT EXISTS idx_monotributo_categorias_vigencia ON public.monotributo_categorias(vigente_desde, vigente_hasta);

-- Comentarios
COMMENT ON TABLE public.monotributo_categorias IS 'Categorías del monotributo argentino con valores y topes';
COMMENT ON COLUMN public.monotributo_categorias.vigente_hasta IS 'NULL significa que es la categoría vigente actual';
COMMENT ON COLUMN public.monotributo_categorias.tope_facturacion_servicios IS 'Tope solo para categorías E a K en servicios';
