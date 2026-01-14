-- =============================================
-- Tabla: alertas_config
-- Descripcion: Configuracion global de alertas del sistema
-- =============================================

CREATE TABLE IF NOT EXISTS public.alertas_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Alerta de recategorizacion (% del tope de la categoria actual)
    alerta_recategorizacion_porcentaje INTEGER DEFAULT 80 CHECK (alerta_recategorizacion_porcentaje BETWEEN 50 AND 99),

    -- Alerta de exclusion (% del tope maximo categoria K)
    alerta_exclusion_porcentaje INTEGER DEFAULT 90 CHECK (alerta_exclusion_porcentaje BETWEEN 70 AND 99),

    -- Dias de anticipacion para alertas
    dias_alerta_vencimiento_cuota INTEGER DEFAULT 5 CHECK (dias_alerta_vencimiento_cuota BETWEEN 1 AND 15),
    dias_alerta_recategorizacion INTEGER DEFAULT 15 CHECK (dias_alerta_recategorizacion BETWEEN 5 AND 30),

    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Solo puede haber UNA fila de configuracion
CREATE UNIQUE INDEX IF NOT EXISTS idx_alertas_config_singleton ON public.alertas_config ((true));

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_alertas_config_updated_at ON public.alertas_config;
CREATE TRIGGER trigger_alertas_config_updated_at
    BEFORE UPDATE ON public.alertas_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar configuracion por defecto
INSERT INTO public.alertas_config (
    alerta_recategorizacion_porcentaje,
    alerta_exclusion_porcentaje,
    dias_alerta_vencimiento_cuota,
    dias_alerta_recategorizacion
) VALUES (80, 90, 5, 15)
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE public.alertas_config ENABLE ROW LEVEL SECURITY;

-- Solo usuarios con rol admin pueden ver/editar
CREATE POLICY "alertas_config_select" ON public.alertas_config
    FOR SELECT USING (public.is_contador());

CREATE POLICY "alertas_config_update" ON public.alertas_config
    FOR UPDATE USING (public.is_full_access());

CREATE POLICY "alertas_config_insert" ON public.alertas_config
    FOR INSERT WITH CHECK (public.is_full_access());

CREATE POLICY "alertas_config_delete" ON public.alertas_config
    FOR DELETE USING (public.is_full_access());

COMMENT ON TABLE public.alertas_config IS 'Configuracion global de umbrales de alertas para monotributistas';
