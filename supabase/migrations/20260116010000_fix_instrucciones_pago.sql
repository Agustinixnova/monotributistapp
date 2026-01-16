-- =============================================
-- Fix: VEP es número de 11 dígitos, no link
-- Agregar campo para boleta de pago en efectivo
-- =============================================

-- Renombrar columna vep_link a vep_numero
ALTER TABLE public.client_instrucciones_pago
    RENAME COLUMN vep_link TO vep_numero;

-- Cambiar tipo a VARCHAR(11) para el número de VEP
ALTER TABLE public.client_instrucciones_pago
    ALTER COLUMN vep_numero TYPE VARCHAR(20);

-- Agregar columna para el archivo de boleta de pago (efectivo)
ALTER TABLE public.client_instrucciones_pago
    ADD COLUMN IF NOT EXISTS efectivo_boleta_url TEXT;

-- Actualizar comentarios
COMMENT ON COLUMN public.client_instrucciones_pago.vep_numero IS 'Número de VEP de 11 dígitos (solo para método vep)';
COMMENT ON COLUMN public.client_instrucciones_pago.efectivo_boleta_url IS 'URL del archivo de boleta de pago adjunta (solo para método efectivo)';
