-- =====================================================
-- DATOS SEED para Caja Diaria
-- Descripción: Insertar métodos y categorías predeterminadas
-- Fecha: 2026-01-19
-- =====================================================

-- Métodos de pago predeterminados (usando nombres de iconos de Lucide)
INSERT INTO public.caja_metodos_pago (user_id, nombre, icono, es_efectivo, es_sistema, orden) VALUES
    (NULL, 'Efectivo', 'Banknote', true, true, 1),
    (NULL, 'Mercado Pago', 'Smartphone', false, true, 2),
    (NULL, 'Tarjeta', 'CreditCard', false, true, 3),
    (NULL, 'QR', 'QrCode', false, true, 4),
    (NULL, 'Transferencia', 'ArrowLeftRight', false, true, 5),
    (NULL, 'Otros', 'Package', false, true, 6)
ON CONFLICT (user_id, nombre) DO NOTHING;

-- Categorías predeterminadas - Entradas (usando nombres de iconos de Lucide)
INSERT INTO public.caja_categorias (user_id, nombre, icono, tipo, es_sistema, orden) VALUES
    (NULL, 'Venta offline', 'Store', 'entrada', true, 1),
    (NULL, 'Venta online', 'ShoppingCart', 'entrada', true, 2),
    (NULL, 'Cobro de deuda', 'DollarSign', 'entrada', true, 3),
    (NULL, 'Ingreso varios', 'ArrowDownCircle', 'entrada', true, 4)
ON CONFLICT (user_id, nombre) DO NOTHING;

-- Categorías predeterminadas - Salidas (usando nombres de iconos de Lucide)
INSERT INTO public.caja_categorias (user_id, nombre, icono, tipo, es_sistema, orden) VALUES
    (NULL, 'Pago proveedor', 'Truck', 'salida', true, 10),
    (NULL, 'Pago servicios', 'Receipt', 'salida', true, 11),
    (NULL, 'Retiro de caja', 'UserMinus', 'salida', true, 12),
    (NULL, 'Pago sueldos', 'Briefcase', 'salida', true, 13),
    (NULL, 'Gasto varios', 'ArrowUpCircle', 'salida', true, 14)
ON CONFLICT (user_id, nombre) DO NOTHING;

-- Categorías predeterminadas - Ambos (usando nombres de iconos de Lucide)
INSERT INTO public.caja_categorias (user_id, nombre, icono, tipo, es_sistema, orden) VALUES
    (NULL, 'Ajuste de caja', 'RefreshCw', 'ambos', true, 20)
ON CONFLICT (user_id, nombre) DO NOTHING;
