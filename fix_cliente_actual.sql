-- Script para arreglar el cliente que debe 1 cuota
-- Ejecutar en Supabase SQL Editor

-- PASO 1: Ejecutar la migración del campo
-- (copiar desde supabase/migrations/20260111120000_cuotas_adeudadas_al_alta.sql)

ALTER TABLE public.client_fiscal_data
ADD COLUMN IF NOT EXISTS cuotas_adeudadas_al_alta INTEGER DEFAULT 0;

COMMENT ON COLUMN public.client_fiscal_data.cuotas_adeudadas_al_alta IS
'Cantidad de cuotas que el cliente adeudaba al momento de darse de alta en el sistema.
Usado para calcular correctamente las cuotas vencidas desde el inicio.';

-- PASO 2: Actualizar clientes existentes basándose en su estado inicial
UPDATE public.client_fiscal_data
SET cuotas_adeudadas_al_alta =
    CASE
        WHEN estado_pago_monotributo = 'al_dia' THEN 0
        WHEN estado_pago_monotributo = 'debe_1_cuota' THEN 1
        WHEN estado_pago_monotributo = 'debe_2_mas' THEN 2
        WHEN estado_pago_monotributo = 'desconocido' THEN 0
        ELSE 0
    END
WHERE cuotas_adeudadas_al_alta IS NULL OR cuotas_adeudadas_al_alta = 0;

-- PASO 3: Verificar el resultado
SELECT
    razon_social,
    estado_pago_monotributo,
    cuotas_adeudadas_al_alta,
    fecha_alta_monotributo
FROM public.client_fiscal_data
WHERE tipo_contribuyente = 'monotributista'
ORDER BY razon_social;
