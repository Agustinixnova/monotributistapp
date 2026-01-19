-- =====================================================
-- SCRIPT DE CORRECCIÓN: Iconos de Caja Diaria
-- Ejecutar este script en Supabase Dashboard > SQL Editor
-- Fecha: 2026-01-18
-- PROBLEMA: Los iconos tienen emojis en vez de nombres Lucide
-- =====================================================

-- =====================================================
-- CORRECCIÓN DE CATEGORÍAS (forzar iconos correctos)
-- =====================================================

-- Entradas
UPDATE public.caja_categorias SET icono = 'Store' WHERE nombre = 'Venta offline';
UPDATE public.caja_categorias SET icono = 'ShoppingCart' WHERE nombre = 'Venta online';
UPDATE public.caja_categorias SET icono = 'DollarSign' WHERE nombre = 'Cobro de deuda';
UPDATE public.caja_categorias SET icono = 'ArrowDownCircle' WHERE nombre = 'Ingreso varios';

-- Salidas
UPDATE public.caja_categorias SET icono = 'Truck' WHERE nombre = 'Pago proveedor';
UPDATE public.caja_categorias SET icono = 'Receipt' WHERE nombre = 'Pago servicios';
UPDATE public.caja_categorias SET icono = 'UserMinus' WHERE nombre = 'Retiro de caja';
UPDATE public.caja_categorias SET icono = 'Briefcase' WHERE nombre = 'Pago sueldos';
UPDATE public.caja_categorias SET icono = 'ArrowUpCircle' WHERE nombre = 'Gasto varios';

-- Ambos
UPDATE public.caja_categorias SET icono = 'RefreshCw' WHERE nombre = 'Ajuste de caja';

-- =====================================================
-- CORRECCIÓN DE MÉTODOS DE PAGO (forzar iconos correctos)
-- =====================================================

UPDATE public.caja_metodos_pago SET icono = 'Banknote' WHERE nombre = 'Efectivo';
UPDATE public.caja_metodos_pago SET icono = 'Smartphone' WHERE nombre = 'Mercado Pago';
UPDATE public.caja_metodos_pago SET icono = 'CreditCard' WHERE nombre = 'Tarjeta';
UPDATE public.caja_metodos_pago SET icono = 'QrCode' WHERE nombre = 'QR';
UPDATE public.caja_metodos_pago SET icono = 'ArrowLeftRight' WHERE nombre = 'Transferencia';
UPDATE public.caja_metodos_pago SET icono = 'Package' WHERE nombre = 'Otros';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT 'CATEGORÍAS' as tabla, nombre, icono FROM public.caja_categorias WHERE es_sistema = true ORDER BY orden;
SELECT 'MÉTODOS' as tabla, nombre, icono FROM public.caja_metodos_pago WHERE es_sistema = true ORDER BY orden;
