-- =============================================
-- Tabla: convenio_multilateral_vencimientos
-- Descripcion: Configuracion de vencimientos IIBB por digito de CUIT
-- =============================================

CREATE TABLE IF NOT EXISTS public.convenio_multilateral_vencimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Digitos del CUIT (ej: '0-1', '2-3', '4-5', '6-7', '8-9')
    digitos_cuit TEXT NOT NULL,

    -- Dia de vencimiento (1-28 para evitar problemas con meses cortos)
    dia_vencimiento INTEGER NOT NULL CHECK (dia_vencimiento BETWEEN 1 AND 28),

    -- Orden para mostrar
    orden INTEGER DEFAULT 0,

    -- Vigencia
    vigente_desde DATE DEFAULT CURRENT_DATE,
    vigente_hasta DATE DEFAULT NULL,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),

    -- Unico por digitos mientras este vigente
    UNIQUE(digitos_cuit, vigente_hasta)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_cm_vencimientos_digitos ON public.convenio_multilateral_vencimientos(digitos_cuit);
CREATE INDEX IF NOT EXISTS idx_cm_vencimientos_vigente ON public.convenio_multilateral_vencimientos(vigente_hasta);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_cm_vencimientos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cm_vencimientos_updated_at ON public.convenio_multilateral_vencimientos;
CREATE TRIGGER trigger_cm_vencimientos_updated_at
    BEFORE UPDATE ON public.convenio_multilateral_vencimientos
    FOR EACH ROW
    EXECUTE FUNCTION update_cm_vencimientos_updated_at();

-- Insertar valores por defecto (vencimientos tipicos 2026)
INSERT INTO public.convenio_multilateral_vencimientos (digitos_cuit, dia_vencimiento, orden) VALUES
    ('0-1', 13, 1),
    ('2-3', 14, 2),
    ('4-5', 15, 3),
    ('6-7', 16, 4),
    ('8-9', 17, 5)
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE public.convenio_multilateral_vencimientos ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos los contadores pueden ver
DROP POLICY IF EXISTS "cm_vencimientos_select" ON public.convenio_multilateral_vencimientos;
CREATE POLICY "cm_vencimientos_select" ON public.convenio_multilateral_vencimientos
    FOR SELECT USING (public.is_contador());

-- INSERT/UPDATE/DELETE: Solo full access
DROP POLICY IF EXISTS "cm_vencimientos_insert" ON public.convenio_multilateral_vencimientos;
CREATE POLICY "cm_vencimientos_insert" ON public.convenio_multilateral_vencimientos
    FOR INSERT WITH CHECK (public.is_full_access());

DROP POLICY IF EXISTS "cm_vencimientos_update" ON public.convenio_multilateral_vencimientos;
CREATE POLICY "cm_vencimientos_update" ON public.convenio_multilateral_vencimientos
    FOR UPDATE USING (public.is_full_access());

DROP POLICY IF EXISTS "cm_vencimientos_delete" ON public.convenio_multilateral_vencimientos;
CREATE POLICY "cm_vencimientos_delete" ON public.convenio_multilateral_vencimientos
    FOR DELETE USING (public.is_full_access());

COMMENT ON TABLE public.convenio_multilateral_vencimientos IS 'Vencimientos mensuales de IIBB Convenio Multilateral por ultimo digito de CUIT';

-- =============================================
-- Agregar campos a alertas_config para facturacion pendiente
-- =============================================
-- COMENTADO: Tabla alertas_config no existe
/*
ALTER TABLE public.alertas_config
ADD COLUMN IF NOT EXISTS meses_alerta_facturacion_pendiente INTEGER DEFAULT 1
    CHECK (meses_alerta_facturacion_pendiente BETWEEN 1 AND 6);

COMMENT ON COLUMN public.alertas_config.meses_alerta_facturacion_pendiente IS 'Cantidad de meses sin cargar para mostrar alerta';
*/
