-- =====================================================
-- Categorías para ajustes de arqueo
-- Descripción: Agregar categorías específicas para faltantes y sobrantes de caja
-- Fecha: 2026-01-20
-- =====================================================

-- Categoría para cuando falta dinero en el arqueo
INSERT INTO public.caja_categorias (user_id, nombre, icono, tipo, es_sistema, orden) VALUES
    (NULL, 'Faltante de caja', 'TrendingDown', 'salida', true, 15)
ON CONFLICT (user_id, nombre) DO NOTHING;

-- Categoría para cuando sobra dinero en el arqueo
INSERT INTO public.caja_categorias (user_id, nombre, icono, tipo, es_sistema, orden) VALUES
    (NULL, 'Sobrante de caja', 'TrendingUp', 'entrada', true, 5)
ON CONFLICT (user_id, nombre) DO NOTHING;
