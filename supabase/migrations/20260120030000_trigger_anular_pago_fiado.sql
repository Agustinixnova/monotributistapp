-- =====================================================
-- Trigger para revertir pagos de cuenta corriente al anular movimiento
-- Descripción: Cuando se anula un movimiento de "Cobro de deuda",
--              se elimina el registro de pago y se revierten los fiados saldados
-- Fecha: 2026-01-20
-- =====================================================

-- Función que se ejecuta al anular un movimiento
CREATE OR REPLACE FUNCTION public.caja_on_movimiento_anulado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pago RECORD;
  v_monto_a_revertir DECIMAL(12,2);
  v_fiado RECORD;
BEGIN
  -- Solo actuar si el movimiento cambió a anulado=true
  IF NEW.anulado = true AND OLD.anulado = false THEN

    -- Buscar si este movimiento tiene un pago de fiado asociado
    SELECT * INTO v_pago
    FROM public.caja_pagos_fiado
    WHERE movimiento_id = NEW.id;

    -- Si encontramos un pago asociado, revertir
    IF v_pago.id IS NOT NULL THEN
      v_monto_a_revertir := v_pago.monto;

      -- Revertir los fiados saldados (de más reciente a más antiguo)
      -- para deshacer el FIFO original
      FOR v_fiado IN
        SELECT f.id, f.monto
        FROM public.caja_fiados f
        WHERE f.cliente_id = v_pago.cliente_id
          AND f.saldado = true
        ORDER BY f.fecha DESC, f.hora DESC
      LOOP
        IF v_monto_a_revertir >= v_fiado.monto THEN
          -- Revertir este fiado a no saldado
          UPDATE public.caja_fiados
          SET saldado = false
          WHERE id = v_fiado.id;

          v_monto_a_revertir := v_monto_a_revertir - v_fiado.monto;
        END IF;

        -- Si ya revertimos todo el monto, salir
        IF v_monto_a_revertir <= 0 THEN
          EXIT;
        END IF;
      END LOOP;

      -- Eliminar el registro de pago de fiado
      DELETE FROM public.caja_pagos_fiado
      WHERE id = v_pago.id;

    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_caja_movimiento_anulado ON public.caja_movimientos;
CREATE TRIGGER trigger_caja_movimiento_anulado
  AFTER UPDATE OF anulado ON public.caja_movimientos
  FOR EACH ROW
  WHEN (NEW.anulado = true AND OLD.anulado = false)
  EXECUTE FUNCTION public.caja_on_movimiento_anulado();

-- Comentario explicativo
COMMENT ON FUNCTION public.caja_on_movimiento_anulado() IS
'Trigger que revierte los pagos de cuenta corriente cuando se anula un movimiento de cobro de deuda.
Elimina el registro de caja_pagos_fiado y revierte los fiados marcados como saldados.';
