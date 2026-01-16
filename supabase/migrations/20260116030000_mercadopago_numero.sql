-- =============================================
-- Fix: Mercado Pago también es número, no link
-- =============================================

-- Renombrar columna mercadopago_link a mercadopago_numero
ALTER TABLE public.client_instrucciones_pago
    RENAME COLUMN mercadopago_link TO mercadopago_numero;

-- Cambiar tipo a VARCHAR(20)
ALTER TABLE public.client_instrucciones_pago
    ALTER COLUMN mercadopago_numero TYPE VARCHAR(20);

-- Actualizar comentario
COMMENT ON COLUMN public.client_instrucciones_pago.mercadopago_numero IS 'Número de Mercado Pago de 11 dígitos (solo para método mercado_pago)';
