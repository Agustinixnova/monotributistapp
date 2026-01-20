-- ============================================
-- SISTEMA DE FIADOS PARA CAJA DIARIA
-- ============================================
-- Fecha: 2026-01-19
-- Descripción: Tablas para gestionar ventas a crédito (fiados)
--              y cobranzas de clientes
-- ============================================

-- TABLA: caja_clientes_fiado
-- Clientes que pueden comprar fiado
CREATE TABLE IF NOT EXISTS public.caja_clientes_fiado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100),
  telefono VARCHAR(50),
  limite_credito DECIMAL(12,2) DEFAULT NULL,  -- NULL = sin límite
  comentario VARCHAR(500),                     -- Notas sobre el cliente
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_caja_clientes_fiado_unique
  ON public.caja_clientes_fiado(user_id, nombre, COALESCE(apellido, ''));

-- TABLA: caja_fiados
-- Ventas a crédito (deudas) - NO afectan la caja del día
CREATE TABLE IF NOT EXISTS public.caja_fiados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.caja_clientes_fiado(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
  descripcion VARCHAR(200),
  saldado BOOLEAN DEFAULT false,  -- true cuando se pagó completamente
  created_by_id UUID REFERENCES auth.users(id),  -- Usuario que registró el fiado
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: caja_pagos_fiado
-- Cobranzas de deudas - SÍ generan entrada en caja
CREATE TABLE IF NOT EXISTS public.caja_pagos_fiado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.caja_clientes_fiado(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
  metodo_pago_id UUID NOT NULL REFERENCES public.caja_metodos_pago(id),
  movimiento_id UUID REFERENCES public.caja_movimientos(id),  -- FK al movimiento de entrada
  nota VARCHAR(200),
  created_by_id UUID REFERENCES auth.users(id),  -- Usuario que cobró
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCIONES RPC
-- ============================================

-- caja_cliente_deuda(p_cliente_id): Retorna deuda total de un cliente
-- caja_clientes_con_deuda(p_user_id): Lista clientes con saldo > 0
-- caja_cliente_historial(p_cliente_id): Fiados + pagos del cliente (incluye usuario que registró)
-- caja_registrar_pago_fiado(...): Registra pago y actualiza fiados saldados (FIFO)

-- ============================================
-- CATEGORÍAS DE SISTEMA
-- ============================================

-- "Fiado" (entrada): Aparece en categorías de ENTRADA, al seleccionarla
--                    se abre un flujo especial que NO genera movimiento en caja
--                    Solo registra la deuda del cliente
-- "Cobro de deuda" (entrada): Se usa automáticamente cuando se cobra una deuda

-- ============================================
-- FLUJO DE USO
-- ============================================

-- 1. REGISTRAR FIADO (venta a crédito):
--    - Usuario va a "Nueva Entrada"
--    - Ingresa el monto
--    - Selecciona categoría "Fiado"
--    - Se abre selector de cliente
--    - Selecciona el cliente (o crea uno nuevo)
--    - Se guarda en caja_fiados (NO en caja_movimientos)
--    - NO afecta la caja del día

-- 2. COBRAR DEUDA:
--    - Usuario va a botón "Cobranzas" (icono billete)
--    - Ve lista de clientes con deuda
--    - Selecciona un cliente
--    - Ve el historial (fecha, hora, usuario que entregó, monto)
--    - Ingresa monto a cobrar (total o parcial)
--    - Selecciona método de pago
--    - Se registra pago en caja_pagos_fiado
--    - Se crea movimiento de ENTRADA en caja_movimientos
--    - SÍ afecta la caja del día

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. Los fiados NO aparecen en caja_movimientos ni afectan los totales del día
-- 2. Las cobranzas SÍ generan un movimiento de entrada en caja_movimientos
-- 3. Al cobrar, los fiados se marcan como saldados en orden FIFO
-- 4. El límite de crédito es opcional (NULL = sin límite)
-- 5. Los clientes se desactivan (soft delete), no se eliminan físicamente
-- 6. El historial muestra quién registró cada fiado (created_by_id → profiles.full_name)
