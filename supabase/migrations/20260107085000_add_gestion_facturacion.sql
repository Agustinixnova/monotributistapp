-- Agregar columna faltante gestion_facturacion
ALTER TABLE public.client_fiscal_data
ADD COLUMN IF NOT EXISTS gestion_facturacion VARCHAR(20) DEFAULT 'contadora';

-- Comentario
COMMENT ON COLUMN public.client_fiscal_data.gestion_facturacion IS 'Tipo de gestion de facturacion: contadora (por defecto) o autonomo (cliente carga sus propias facturas)';

-- Check constraint
ALTER TABLE public.client_fiscal_data
DROP CONSTRAINT IF EXISTS check_gestion_facturacion;

ALTER TABLE public.client_fiscal_data
ADD CONSTRAINT check_gestion_facturacion
CHECK (gestion_facturacion IN ('contadora', 'autonomo'));
