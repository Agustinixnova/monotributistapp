-- =====================================================
-- Función para crear cliente con saldo inicial
-- Descripción: Crea un cliente y opcionalmente registra un saldo inicial
-- Fecha: 2026-01-20
-- =====================================================

CREATE OR REPLACE FUNCTION public.caja_crear_cliente_con_saldo(
  p_user_id UUID,
  p_nombre VARCHAR(100),
  p_apellido VARCHAR(100) DEFAULT NULL,
  p_telefono VARCHAR(50) DEFAULT NULL,
  p_limite_credito DECIMAL(12,2) DEFAULT NULL,
  p_comentario TEXT DEFAULT NULL,
  p_saldo_inicial DECIMAL(12,2) DEFAULT NULL,
  p_tipo_saldo VARCHAR(10) DEFAULT NULL, -- 'deuda' o 'favor'
  p_created_by_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cliente_id UUID;
  v_fecha DATE;
  v_hora TIME;
  v_metodo_efectivo_id UUID;
BEGIN
  v_fecha := (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::DATE;
  v_hora := (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::TIME;

  -- 1. Crear el cliente
  INSERT INTO public.caja_clientes_fiado (
    user_id,
    nombre,
    apellido,
    telefono,
    limite_credito,
    activo
  )
  VALUES (
    p_user_id,
    p_nombre,
    p_apellido,
    p_telefono,
    p_limite_credito,
    true
  )
  RETURNING id INTO v_cliente_id;

  -- 2. Si hay saldo inicial, crear el registro correspondiente
  IF p_saldo_inicial IS NOT NULL AND p_saldo_inicial > 0 AND p_tipo_saldo IS NOT NULL THEN

    IF p_tipo_saldo = 'deuda' THEN
      -- Crear registro de fiado (deuda)
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
        v_fecha,
        v_hora,
        p_saldo_inicial,
        'Saldo inicial al crear cliente',
        false,
        COALESCE(p_created_by_id, p_user_id)
      );

    ELSIF p_tipo_saldo = 'favor' THEN
      -- Obtener método de pago efectivo (para el registro)
      SELECT id INTO v_metodo_efectivo_id
      FROM public.caja_metodos_pago
      WHERE es_efectivo = true
        AND (user_id IS NULL OR user_id = p_user_id)
      LIMIT 1;

      -- Crear registro de pago (saldo a favor)
      -- No creamos movimiento de caja porque es saldo inicial, no una entrada real
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
        v_cliente_id,
        v_fecha,
        v_hora,
        p_saldo_inicial,
        v_metodo_efectivo_id,
        NULL, -- Sin movimiento asociado (es saldo inicial)
        'Saldo a favor inicial al crear cliente',
        COALESCE(p_created_by_id, p_user_id)
      );
    END IF;
  END IF;

  RETURN v_cliente_id;
END;
$$;

-- Comentario
COMMENT ON FUNCTION public.caja_crear_cliente_con_saldo IS
'Crea un cliente de cuenta corriente y opcionalmente registra un saldo inicial (deuda o a favor)';
