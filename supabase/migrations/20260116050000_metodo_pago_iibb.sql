-- =============================================
-- Add: metodo_pago_iibb column to client_fiscal_data
-- =============================================

-- Agregar columna metodo_pago_iibb
ALTER TABLE public.client_fiscal_data
    ADD COLUMN IF NOT EXISTS metodo_pago_iibb TEXT
    CHECK (metodo_pago_iibb IS NULL OR metodo_pago_iibb IN ('debito_automatico', 'vep', 'mercadopago', 'efectivo', 'otro'));

-- Actualizar comentario
COMMENT ON COLUMN public.client_fiscal_data.metodo_pago_iibb IS 'Método de pago para IIBB (solo para local o convenio multilateral)';
