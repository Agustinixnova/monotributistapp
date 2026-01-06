-- =============================================
-- MIGRACION: Campo es_historico para cargas importadas
-- =============================================

-- Agregar columna para identificar cargas historicas (importadas de otro contador)
ALTER TABLE public.client_facturacion_cargas
ADD COLUMN IF NOT EXISTS es_historico BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.client_facturacion_cargas.es_historico IS 'Indica si la carga fue importada como facturacion historica de otro contador';

-- Indice para filtrar cargas historicas si es necesario
CREATE INDEX IF NOT EXISTS idx_client_facturacion_cargas_es_historico
ON public.client_facturacion_cargas(es_historico)
WHERE es_historico = TRUE;
