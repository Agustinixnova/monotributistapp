-- Trigger para anular automáticamente el movimiento relacionado en caja secundaria
-- cuando se anula un movimiento en caja principal

CREATE OR REPLACE FUNCTION public.anular_movimiento_caja_secundaria()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el movimiento se está anulando (anulado cambia de false a true)
  IF NEW.anulado = true AND OLD.anulado = false THEN
    -- Anular el movimiento relacionado en caja secundaria (si existe)
    UPDATE public.caja_secundaria_movimientos
    SET 
      descripcion = COALESCE(descripcion, '') || ' (ANULADO: movimiento principal anulado)',
      updated_at = NOW()
    WHERE movimiento_principal_id = NEW.id
      AND user_id = NEW.user_id;
    
    -- Nota: En lugar de marcar como anulado, simplemente eliminamos el registro
    -- para mantener el saldo correcto. Los movimientos secundarios son consecuencia
    -- directa del movimiento principal.
    DELETE FROM public.caja_secundaria_movimientos
    WHERE movimiento_principal_id = NEW.id
      AND user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS tr_anular_movimiento_caja_secundaria ON public.caja_movimientos;
CREATE TRIGGER tr_anular_movimiento_caja_secundaria
  AFTER UPDATE OF anulado ON public.caja_movimientos
  FOR EACH ROW
  EXECUTE FUNCTION public.anular_movimiento_caja_secundaria();

COMMENT ON FUNCTION public.anular_movimiento_caja_secundaria IS
'Cuando se anula un movimiento en caja principal que tiene movimiento relacionado en caja secundaria, elimina el movimiento secundario para mantener el saldo correcto';
