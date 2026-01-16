-- =============================================
-- Agregar campos de deuda de monotributo
-- =============================================

-- Agregar columna para monto de deuda
ALTER TABLE public.client_fiscal_data
    ADD COLUMN IF NOT EXISTS monto_deuda_monotributo DECIMAL(12,2);

-- Agregar columna para cantidad de cuotas adeudadas
ALTER TABLE public.client_fiscal_data
    ADD COLUMN IF NOT EXISTS cuotas_adeudadas_monotributo INTEGER;

-- Actualizar el check constraint de estado_pago_monotributo para incluir 'con_deuda'
-- Primero eliminamos el constraint existente si lo hay
ALTER TABLE public.client_fiscal_data
    DROP CONSTRAINT IF EXISTS client_fiscal_data_estado_pago_monotributo_check;

-- Crear nuevo constraint con el valor 'con_deuda'
ALTER TABLE public.client_fiscal_data
    ADD CONSTRAINT client_fiscal_data_estado_pago_monotributo_check
    CHECK (estado_pago_monotributo IS NULL OR estado_pago_monotributo IN ('al_dia', 'con_deuda', 'debe_1_cuota', 'debe_2_mas', 'desconocido'));

-- Migrar datos existentes: si tiene 'debe_1_cuota' o 'debe_2_mas', cambiar a 'con_deuda'
UPDATE public.client_fiscal_data
SET estado_pago_monotributo = 'con_deuda'
WHERE estado_pago_monotributo IN ('debe_1_cuota', 'debe_2_mas');

-- Comentarios
COMMENT ON COLUMN public.client_fiscal_data.monto_deuda_monotributo IS 'Monto total adeudado de monotributo (incluyendo intereses)';
COMMENT ON COLUMN public.client_fiscal_data.cuotas_adeudadas_monotributo IS 'Cantidad de cuotas de monotributo adeudadas';
