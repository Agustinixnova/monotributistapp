-- Script para actualizar un cliente específico
-- Ejecutar en Supabase SQL Editor

-- PASO 1: Primero ejecutar la migración si no la ejecutaste
ALTER TABLE public.client_fiscal_data
ADD COLUMN IF NOT EXISTS cuotas_adeudadas_al_alta INTEGER DEFAULT 0;

-- PASO 2: Buscar el cliente por email o nombre
SELECT
    id,
    razon_social,
    estado_pago_monotributo,
    cuotas_adeudadas_al_alta,
    fecha_alta_monotributo
FROM public.client_fiscal_data cfd
JOIN public.profiles p ON cfd.user_id = p.id
WHERE p.email = 'EMAIL_DEL_CLIENTE'  -- Reemplazar con el email del cliente
   OR cfd.razon_social ILIKE '%NOMBRE_CLIENTE%';  -- O buscar por nombre

-- PASO 3: Actualizar ese cliente específico con las cuotas correctas
-- Reemplazar 'ID_DEL_CLIENTE' con el ID que obtuviste en PASO 2
UPDATE public.client_fiscal_data
SET cuotas_adeudadas_al_alta = 1  -- Si debía 1 cuota al momento del alta
WHERE id = 'ID_DEL_CLIENTE';

-- PASO 4: Verificar que se actualizó
SELECT
    id,
    razon_social,
    estado_pago_monotributo,
    cuotas_adeudadas_al_alta,
    fecha_alta_monotributo
FROM public.client_fiscal_data
WHERE id = 'ID_DEL_CLIENTE';
