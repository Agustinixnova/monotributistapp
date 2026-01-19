-- =====================================================
-- MIGRACIÓN: Actualizar iconos a nombres de Lucide React
-- Fecha: 2026-01-18
-- Descripción: Corrige los iconos para usar nombres PascalCase de Lucide
-- =====================================================

-- Aumentar tamaño del campo icono para soportar nombres de Lucide
ALTER TABLE public.caja_metodos_pago ALTER COLUMN icono TYPE VARCHAR(50);
ALTER TABLE public.caja_categorias ALTER COLUMN icono TYPE VARCHAR(50);

-- Actualizar iconos de métodos de pago a nombres de Lucide
UPDATE public.caja_metodos_pago
SET icono = CASE nombre
    WHEN 'Efectivo' THEN 'Banknote'
    WHEN 'Mercado Pago' THEN 'Smartphone'
    WHEN 'Tarjeta' THEN 'CreditCard'
    WHEN 'QR' THEN 'QrCode'
    WHEN 'Transferencia' THEN 'ArrowLeftRight'
    WHEN 'Otros' THEN 'Package'
    ELSE icono
END
WHERE es_sistema = true;

-- Actualizar iconos de categorías a nombres de Lucide
-- CORREGIDO: Usar los nombres correctos de las categorías según la migración principal
UPDATE public.caja_categorias
SET icono = CASE nombre
    -- Entradas
    WHEN 'Venta offline' THEN 'Store'
    WHEN 'Venta online' THEN 'ShoppingCart'
    WHEN 'Cobro de deuda' THEN 'DollarSign'
    WHEN 'Ingreso varios' THEN 'ArrowDownCircle'
    -- Salidas (nombres correctos)
    WHEN 'Pago proveedor' THEN 'Truck'
    WHEN 'Pago servicios' THEN 'Receipt'
    WHEN 'Retiro de caja' THEN 'UserMinus'
    WHEN 'Pago sueldos' THEN 'Briefcase'
    WHEN 'Gasto varios' THEN 'ArrowUpCircle'
    -- Ambos
    WHEN 'Ajuste de caja' THEN 'RefreshCw'
    ELSE icono
END
WHERE es_sistema = true;

-- Asegurar que cualquier icono NULL o vacío tenga un valor por defecto
UPDATE public.caja_categorias
SET icono = 'List'
WHERE icono IS NULL OR icono = '';

UPDATE public.caja_metodos_pago
SET icono = 'Wallet'
WHERE icono IS NULL OR icono = '';
