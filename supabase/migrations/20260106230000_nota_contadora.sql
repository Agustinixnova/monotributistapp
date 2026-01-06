-- Agregar campo para observaciones de la contadora en cada carga
ALTER TABLE public.client_facturacion_cargas
ADD COLUMN IF NOT EXISTS nota_contadora TEXT;

COMMENT ON COLUMN public.client_facturacion_cargas.nota_contadora IS 'Observacion interna de la contadora, no visible para el cliente';
