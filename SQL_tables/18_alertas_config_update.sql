-- =============================================
-- Modificación: Agregar alerta de facturación pendiente
-- =============================================

ALTER TABLE public.alertas_config
ADD COLUMN IF NOT EXISTS dias_alerta_facturacion_pendiente INTEGER DEFAULT 5
CHECK (dias_alerta_facturacion_pendiente BETWEEN 1 AND 15);

COMMENT ON COLUMN public.alertas_config.dias_alerta_facturacion_pendiente IS
'Días antes de fin de mes para alertar si cliente autónomo no cargó facturación';

UPDATE public.alertas_config
SET dias_alerta_facturacion_pendiente = 5
WHERE dias_alerta_facturacion_pendiente IS NULL;
