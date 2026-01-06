-- =============================================
-- MIGRACIÓN: Campos de notas internas
-- =============================================

-- 1. Notas internas en profiles (Datos Personales)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notas_internas TEXT;

COMMENT ON COLUMN public.profiles.notas_internas IS 'Observaciones internas sobre el usuario/cliente, solo visible para contadora';

-- 2. Notas internas en datos fiscales
ALTER TABLE public.client_fiscal_data
ADD COLUMN IF NOT EXISTS notas_internas_fiscales TEXT;

COMMENT ON COLUMN public.client_fiscal_data.notas_internas_fiscales IS 'Observaciones internas sobre situacion fiscal, solo visible para contadora';
