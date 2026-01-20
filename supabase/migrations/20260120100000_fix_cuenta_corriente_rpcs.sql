-- =====================================================
-- FIX: Crear funciones RPC para cuenta corriente
-- =====================================================

-- DROP de funciones existentes para poder recrearlas con nueva firma
DROP FUNCTION IF EXISTS public.caja_cliente_deuda(UUID);
DROP FUNCTION IF EXISTS public.caja_clientes_con_deuda(UUID);
DROP FUNCTION IF EXISTS public.caja_todos_clientes_con_saldo(UUID);
DROP FUNCTION IF EXISTS public.caja_cliente_historial(UUID);
DROP FUNCTION IF EXISTS public.caja_registrar_pago_fiado(UUID, UUID, DECIMAL, UUID, DATE, TIME, VARCHAR, UUID);
DROP FUNCTION IF EXISTS public.caja_crear_cliente_con_saldo(UUID, VARCHAR, VARCHAR, VARCHAR, DECIMAL, VARCHAR, DECIMAL, VARCHAR, UUID);

-- 1. Función para obtener deuda total de un cliente
CREATE OR REPLACE FUNCTION public.caja_cliente_deuda(p_cliente_id UUID)
RETURNS DECIMAL(12,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_fiados DECIMAL(12,2);
  v_total_pagos DECIMAL(12,2);
BEGIN
  -- Total de fiados (deudas registradas, saldadas o no)
  SELECT COALESCE(SUM(monto), 0)
  INTO v_total_fiados
  FROM public.caja_fiados
  WHERE cliente_id = p_cliente_id;

  -- Total de pagos realizados
  SELECT COALESCE(SUM(pf.monto), 0)
  INTO v_total_pagos
  FROM public.caja_pagos_fiado pf
  WHERE pf.cliente_id = p_cliente_id;

  -- Retornar diferencia (positivo = debe, negativo = a favor)
  RETURN v_total_fiados - v_total_pagos;
END;
$$;

-- 2. Función para obtener clientes con deuda
CREATE OR REPLACE FUNCTION public.caja_clientes_con_deuda(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  nombre VARCHAR(100),
  apellido VARCHAR(100),
  telefono VARCHAR(50),
  limite_credito DECIMAL(12,2),
  deuda_total DECIMAL(12,2),
  comentario VARCHAR(500)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.nombre,
    c.apellido,
    c.telefono,
    c.limite_credito,
    public.caja_cliente_deuda(c.id) AS deuda_total,
    c.comentario
  FROM public.caja_clientes_fiado c
  WHERE c.user_id = p_user_id
    AND c.activo = true
    AND public.caja_cliente_deuda(c.id) > 0
  ORDER BY public.caja_cliente_deuda(c.id) DESC;
END;
$$;

-- 3. Función para obtener TODOS los clientes con su saldo (incluye saldo 0 y negativos)
CREATE OR REPLACE FUNCTION public.caja_todos_clientes_con_saldo(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  nombre VARCHAR(100),
  apellido VARCHAR(100),
  telefono VARCHAR(50),
  limite_credito DECIMAL(12,2),
  saldo DECIMAL(12,2),
  comentario VARCHAR(500)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.nombre,
    c.apellido,
    c.telefono,
    c.limite_credito,
    public.caja_cliente_deuda(c.id) AS saldo,
    c.comentario
  FROM public.caja_clientes_fiado c
  WHERE c.user_id = p_user_id
    AND c.activo = true
  ORDER BY c.nombre, c.apellido;
END;
$$;

-- 4. Función para obtener historial de un cliente (fiados + pagos)
CREATE OR REPLACE FUNCTION public.caja_cliente_historial(p_cliente_id UUID)
RETURNS TABLE (
  id UUID,
  tipo VARCHAR(10),
  fecha DATE,
  hora TIME,
  monto DECIMAL(12,2),
  descripcion VARCHAR(200),
  metodo_pago VARCHAR(100),
  saldado BOOLEAN,
  created_at TIMESTAMPTZ,
  created_by_nombre VARCHAR(200)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Fiados
  SELECT
    f.id,
    'fiado'::VARCHAR(10) AS tipo,
    f.fecha,
    f.hora,
    f.monto,
    f.descripcion,
    NULL::VARCHAR(100) AS metodo_pago,
    f.saldado,
    f.created_at,
    COALESCE(
      NULLIF(TRIM(COALESCE(p.nombre, '') || ' ' || COALESCE(p.apellido, '')), ''),
      u.email,
      'Usuario'
    )::VARCHAR(200) AS created_by_nombre
  FROM public.caja_fiados f
  LEFT JOIN auth.users u ON u.id = f.created_by_id
  LEFT JOIN public.profiles p ON p.id = f.created_by_id
  WHERE f.cliente_id = p_cliente_id

  UNION ALL

  -- Pagos
  SELECT
    pf.id,
    'pago'::VARCHAR(10) AS tipo,
    pf.fecha,
    pf.hora,
    pf.monto,
    pf.nota AS descripcion,
    mp.nombre AS metodo_pago,
    NULL::BOOLEAN AS saldado,
    pf.created_at,
    COALESCE(
      NULLIF(TRIM(COALESCE(p.nombre, '') || ' ' || COALESCE(p.apellido, '')), ''),
      u.email,
      'Usuario'
    )::VARCHAR(200) AS created_by_nombre
  FROM public.caja_pagos_fiado pf
  LEFT JOIN public.caja_metodos_pago mp ON mp.id = pf.metodo_pago_id
  LEFT JOIN auth.users u ON u.id = pf.created_by_id
  LEFT JOIN public.profiles p ON p.id = pf.created_by_id
  WHERE pf.cliente_id = p_cliente_id

  ORDER BY created_at DESC;
END;
$$;

-- 5. Función para registrar pago y actualizar fiados saldados
CREATE OR REPLACE FUNCTION public.caja_registrar_pago_fiado(
  p_user_id UUID,
  p_cliente_id UUID,
  p_monto DECIMAL(12,2),
  p_metodo_pago_id UUID,
  p_fecha DATE,
  p_hora TIME,
  p_nota VARCHAR(200) DEFAULT NULL,
  p_created_by_id UUID DEFAULT NULL
)
RETURNS TABLE (
  pago_id UUID,
  movimiento_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pago_id UUID;
  v_movimiento_id UUID;
  v_categoria_id UUID;
  v_monto_restante DECIMAL(12,2);
  v_fiado RECORD;
BEGIN
  -- Obtener o crear categoría "Cobro de deuda"
  SELECT id INTO v_categoria_id
  FROM public.caja_categorias
  WHERE nombre = 'Cobro de deuda'
    AND (user_id IS NULL OR user_id = p_user_id)
  LIMIT 1;

  -- Si no existe, crear categoría de sistema
  IF v_categoria_id IS NULL THEN
    INSERT INTO public.caja_categorias (user_id, nombre, icono, tipo, es_sistema, orden, activo)
    VALUES (NULL, 'Cobro de deuda', 'HandCoins', 'entrada', true, 15, true)
    RETURNING id INTO v_categoria_id;
  END IF;

  -- 1. Crear movimiento de entrada en caja
  INSERT INTO public.caja_movimientos (
    user_id,
    created_by_id,
    tipo,
    categoria_id,
    descripcion,
    fecha,
    hora,
    monto_total,
    anulado
  )
  VALUES (
    p_user_id,
    p_created_by_id,
    'entrada',
    v_categoria_id,
    COALESCE(p_nota, 'Cobro de deuda'),
    p_fecha,
    p_hora,
    p_monto,
    false
  )
  RETURNING id INTO v_movimiento_id;

  -- 2. Crear registro de pago en caja_movimientos_pagos
  INSERT INTO public.caja_movimientos_pagos (movimiento_id, metodo_pago_id, monto)
  VALUES (v_movimiento_id, p_metodo_pago_id, p_monto);

  -- 3. Registrar el pago de fiado
  INSERT INTO public.caja_pagos_fiado (
    user_id,
    cliente_id,
    fecha,
    hora,
    monto,
    metodo_pago_id,
    movimiento_id,
    nota,
    created_by_id
  )
  VALUES (
    p_user_id,
    p_cliente_id,
    p_fecha,
    p_hora,
    p_monto,
    p_metodo_pago_id,
    v_movimiento_id,
    p_nota,
    p_created_by_id
  )
  RETURNING id INTO v_pago_id;

  -- 4. Marcar fiados como saldados según corresponda (FIFO)
  v_monto_restante := p_monto;

  FOR v_fiado IN
    SELECT f.id, f.monto
    FROM public.caja_fiados f
    WHERE f.cliente_id = p_cliente_id
      AND f.saldado = false
    ORDER BY f.fecha ASC, f.hora ASC
  LOOP
    IF v_monto_restante >= v_fiado.monto THEN
      -- Saldar completamente este fiado
      UPDATE public.caja_fiados
      SET saldado = true
      WHERE id = v_fiado.id;

      v_monto_restante := v_monto_restante - v_fiado.monto;
    ELSE
      -- No alcanza para saldar más
      EXIT;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_pago_id, v_movimiento_id;
END;
$$;

-- 6. Función para crear cliente con saldo inicial
CREATE OR REPLACE FUNCTION public.caja_crear_cliente_con_saldo(
  p_user_id UUID,
  p_nombre VARCHAR(100),
  p_apellido VARCHAR(100) DEFAULT NULL,
  p_telefono VARCHAR(50) DEFAULT NULL,
  p_limite_credito DECIMAL(12,2) DEFAULT NULL,
  p_comentario VARCHAR(500) DEFAULT NULL,
  p_saldo_inicial DECIMAL(12,2) DEFAULT 0,
  p_tipo_saldo VARCHAR(10) DEFAULT 'debe',
  p_created_by_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cliente_id UUID;
  v_hoy DATE;
  v_ahora TIME;
BEGIN
  v_hoy := (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::DATE;
  v_ahora := (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::TIME;

  -- 1. Crear cliente
  INSERT INTO public.caja_clientes_fiado (
    user_id,
    nombre,
    apellido,
    telefono,
    limite_credito,
    comentario,
    activo
  )
  VALUES (
    p_user_id,
    p_nombre,
    p_apellido,
    p_telefono,
    p_limite_credito,
    p_comentario,
    true
  )
  RETURNING id INTO v_cliente_id;

  -- 2. Registrar saldo inicial si corresponde
  IF p_saldo_inicial > 0 THEN
    IF p_tipo_saldo = 'debe' THEN
      -- Crear fiado de saldo inicial
      INSERT INTO public.caja_fiados (
        user_id,
        cliente_id,
        fecha,
        hora,
        monto,
        descripcion,
        saldado,
        created_by_id
      )
      VALUES (
        p_user_id,
        v_cliente_id,
        v_hoy,
        v_ahora,
        p_saldo_inicial,
        'Saldo inicial',
        false,
        p_created_by_id
      );
    ELSE
      -- Crear pago de saldo inicial (a favor del cliente)
      -- Buscar método de pago "Efectivo"
      DECLARE
        v_metodo_pago_id UUID;
      BEGIN
        SELECT id INTO v_metodo_pago_id
        FROM public.caja_metodos_pago
        WHERE user_id = p_user_id
          AND es_efectivo = true
        LIMIT 1;

        IF v_metodo_pago_id IS NOT NULL THEN
          INSERT INTO public.caja_pagos_fiado (
            user_id,
            cliente_id,
            fecha,
            hora,
            monto,
            metodo_pago_id,
            nota,
            created_by_id
          )
          VALUES (
            p_user_id,
            v_cliente_id,
            v_hoy,
            v_ahora,
            p_saldo_inicial,
            v_metodo_pago_id,
            'Saldo inicial a favor',
            p_created_by_id
          );
        END IF;
      END;
    END IF;
  END IF;

  RETURN v_cliente_id;
END;
$$;

-- Comentarios (con firma completa para funciones con múltiples versiones)
COMMENT ON FUNCTION public.caja_cliente_deuda(UUID) IS
'Calcula el saldo de un cliente. Positivo = debe, Negativo = tiene saldo a favor, Cero = al día';

COMMENT ON FUNCTION public.caja_clientes_con_deuda(UUID) IS
'Retorna clientes con saldo > 0 (deudores)';

COMMENT ON FUNCTION public.caja_todos_clientes_con_saldo(UUID) IS
'Retorna TODOS los clientes con su saldo (positivo, negativo o cero)';

COMMENT ON FUNCTION public.caja_cliente_historial(UUID) IS
'Retorna historial completo de fiados y pagos de un cliente';

COMMENT ON FUNCTION public.caja_registrar_pago_fiado(UUID, UUID, DECIMAL, UUID, DATE, TIME, VARCHAR, UUID) IS
'Registra un pago de deuda y crea movimiento en caja (FIFO)';

COMMENT ON FUNCTION public.caja_crear_cliente_con_saldo(UUID, VARCHAR, VARCHAR, VARCHAR, DECIMAL, VARCHAR, DECIMAL, VARCHAR, UUID) IS
'Crea un cliente con saldo inicial (debe o a favor)';

-- Permisos (con firma completa para funciones con múltiples versiones)
GRANT EXECUTE ON FUNCTION public.caja_cliente_deuda(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.caja_clientes_con_deuda(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.caja_todos_clientes_con_saldo(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.caja_cliente_historial(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.caja_registrar_pago_fiado(UUID, UUID, DECIMAL, UUID, DATE, TIME, VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.caja_crear_cliente_con_saldo(UUID, VARCHAR, VARCHAR, VARCHAR, DECIMAL, VARCHAR, DECIMAL, VARCHAR, UUID) TO authenticated;
