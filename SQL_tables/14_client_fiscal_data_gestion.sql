-- =============================================
-- Modificación: Agregar campo gestión de facturación
-- Descripción: Define quién carga la facturación (el cliente o la contadora)
-- =============================================

ALTER TABLE public.client_fiscal_data
ADD COLUMN IF NOT EXISTS gestion_facturacion TEXT
DEFAULT 'contadora'
CHECK (gestion_facturacion IN ('autonomo', 'contadora'));

COMMENT ON COLUMN public.client_fiscal_data.gestion_facturacion IS
'autonomo = el cliente carga su facturación en la app, contadora = la contadora la carga por él';

UPDATE public.client_fiscal_data
SET gestion_facturacion = 'contadora'
WHERE gestion_facturacion IS NULL;
