-- ============================================
-- Fix: Asegurar que existe la categoría "Cuenta Corriente" con tipo entrada
-- ============================================

-- Eliminar cualquier categoría "Fiado" que pueda existir
DELETE FROM public.caja_categorias
WHERE nombre = 'Fiado' AND es_sistema = true;

-- Eliminar cualquier categoría "Cuenta Corriente" existente para evitar duplicados
DELETE FROM public.caja_categorias
WHERE nombre = 'Cuenta Corriente' AND es_sistema = true;

-- Insertar la categoría "Cuenta Corriente" con tipo entrada
INSERT INTO public.caja_categorias (user_id, nombre, icono, tipo, es_sistema, orden, activo)
VALUES (NULL, 'Cuenta Corriente', 'UserPlus', 'entrada', true, 16, true);

-- Asegurar que también existe la categoría "Cobro de deuda"
INSERT INTO public.caja_categorias (user_id, nombre, icono, tipo, es_sistema, orden, activo)
VALUES (NULL, 'Cobro de deuda', 'HandCoins', 'entrada', true, 15, true)
ON CONFLICT DO NOTHING;
