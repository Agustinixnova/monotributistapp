-- =====================================================
-- Tabla: facturas_pendientes
-- Descripción: Cola de facturas que fallaron al emitirse
--              por problemas de conexión con ARCA/AFIP
-- =====================================================

CREATE TABLE IF NOT EXISTS public.facturas_pendientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    turno_id UUID REFERENCES public.agenda_turnos(id) ON DELETE SET NULL,

    -- Tipo de comprobante (11=FC, 13=NC, 12=ND)
    tipo_comprobante INTEGER NOT NULL DEFAULT 11,

    -- Datos necesarios para reintentar la emisión (JSONB)
    datos_factura JSONB NOT NULL,

    -- Info del error
    ultimo_error TEXT,
    intentos INTEGER DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ultimo_intento_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Estado: pendiente, emitido, descartado
    estado VARCHAR(20) DEFAULT 'pendiente'
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_facturas_pendientes_user_id ON public.facturas_pendientes(user_id);
CREATE INDEX IF NOT EXISTS idx_facturas_pendientes_estado ON public.facturas_pendientes(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_pendientes_turno_id ON public.facturas_pendientes(turno_id);

-- RLS
ALTER TABLE public.facturas_pendientes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own pending invoices"
    ON public.facturas_pendientes
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pending invoices"
    ON public.facturas_pendientes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending invoices"
    ON public.facturas_pendientes
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pending invoices"
    ON public.facturas_pendientes
    FOR DELETE
    USING (auth.uid() = user_id);

-- Comentarios
COMMENT ON TABLE public.facturas_pendientes IS 'Cola de facturas pendientes de emisión por fallos de conexión con ARCA';
COMMENT ON COLUMN public.facturas_pendientes.datos_factura IS 'JSON con todos los datos necesarios para reintentar: importeTotal, receptorTipoDoc, receptorNroDoc, receptorNombre, etc.';
COMMENT ON COLUMN public.facturas_pendientes.tipo_comprobante IS '11=Factura C, 13=Nota de Crédito C, 12=Nota de Débito C';
