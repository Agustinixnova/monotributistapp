-- Script para debuggear el estado de cuotas de un cliente
-- Ejecutar en Supabase SQL Editor

-- Reemplazar 'EMAIL_DEL_CLIENTE' con el email del cliente que debe 1 cuota

-- 1. Ver datos del cliente
SELECT
    cfd.id,
    p.email,
    cfd.razon_social,
    cfd.categoria_monotributo,
    cfd.estado_pago_monotributo,
    cfd.fecha_alta_monotributo
FROM client_fiscal_data cfd
JOIN profiles p ON cfd.user_id = p.id
WHERE p.email = 'EMAIL_DEL_CLIENTE';

-- 2. Ver si tiene registros de cuotas
SELECT * FROM client_cuota_mensual
WHERE client_id = (
    SELECT cfd.id
    FROM client_fiscal_data cfd
    JOIN profiles p ON cfd.user_id = p.id
    WHERE p.email = 'EMAIL_DEL_CLIENTE'
)
ORDER BY anio DESC, mes DESC;

-- 3. Ver historial de categorías
SELECT * FROM client_historial_categorias
WHERE client_id = (
    SELECT cfd.id
    FROM client_fiscal_data cfd
    JOIN profiles p ON cfd.user_id = p.id
    WHERE p.email = 'EMAIL_DEL_CLIENTE'
)
ORDER BY fecha_desde DESC;

-- 4. Probar la función de cálculo (si existe)
SELECT public.calcular_estado_pago_monotributo(
    (SELECT cfd.id
     FROM client_fiscal_data cfd
     JOIN profiles p ON cfd.user_id = p.id
     WHERE p.email = 'EMAIL_DEL_CLIENTE')
);
