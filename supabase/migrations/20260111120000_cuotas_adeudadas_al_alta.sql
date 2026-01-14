-- =============================================
-- Agregar campo para registrar cuotas adeudadas al momento del alta
-- =============================================

ALTER TABLE public.client_fiscal_data
ADD COLUMN IF NOT EXISTS cuotas_adeudadas_al_alta INTEGER DEFAULT 0;

COMMENT ON COLUMN public.client_fiscal_data.cuotas_adeudadas_al_alta IS
'Cantidad de cuotas que el cliente adeudaba al momento de darse de alta en el sistema.
Usado para calcular correctamente las cuotas vencidas desde el inicio.';

-- Actualizar clientes existentes que tienen estado de pago inicial
UPDATE public.client_fiscal_data
SET cuotas_adeudadas_al_alta =
    CASE
        WHEN estado_pago_monotributo = 'al_dia' THEN 0
        WHEN estado_pago_monotributo = 'debe_1_cuota' THEN 1
        WHEN estado_pago_monotributo = 'debe_2_mas' THEN 2
        ELSE 0
    END
WHERE cuotas_adeudadas_al_alta IS NULL;
