-- =============================================
-- Add: mercadopago_vencimiento column
-- =============================================

-- Agregar columna mercadopago_vencimiento
ALTER TABLE public.client_instrucciones_pago
    ADD COLUMN IF NOT EXISTS mercadopago_vencimiento DATE;

-- Actualizar comentario
COMMENT ON COLUMN public.client_instrucciones_pago.mercadopago_vencimiento IS 'Fecha de vencimiento para pago con Mercado Pago (solo para método mercado_pago)';
