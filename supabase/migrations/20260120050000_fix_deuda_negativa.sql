-- =====================================================
-- Fix: Permitir saldo a favor (deuda negativa) en clientes
-- Descripción: Modificar caja_cliente_deuda para que retorne valores negativos
--              cuando el cliente tiene saldo a favor
-- Fecha: 2026-01-20
-- =====================================================

-- Actualizar función para permitir valores negativos (saldo a favor)
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

-- Comentario
COMMENT ON FUNCTION public.caja_cliente_deuda(UUID) IS
'Calcula el saldo de un cliente. Positivo = debe, Negativo = tiene saldo a favor, Cero = al día';
