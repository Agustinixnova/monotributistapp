-- =============================================
-- Agregar categorias faltantes: Regalos y Ahorro
-- Fecha: 2026-01-17
-- =============================================

-- Agregar Regalos (orden 12)
INSERT INTO public.fp_categorias (user_id, nombre, emoji, color, es_sistema, orden)
VALUES (NULL, 'Regalos', '🎁', 'pink', true, 12)
ON CONFLICT DO NOTHING;

-- Agregar Ahorro (orden 13) - con color emerald (verde)
INSERT INTO public.fp_categorias (user_id, nombre, emoji, color, es_sistema, orden)
VALUES (NULL, 'Ahorro', '🐷', 'emerald', true, 13)
ON CONFLICT DO NOTHING;
