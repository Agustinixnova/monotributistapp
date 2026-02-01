-- Trigger bidireccional para sincronizar anulaciones entre caja principal y secundaria
-- Si se elimina un movimiento de caja secundaria, debe anular el movimiento principal

CREATE OR REPLACE FUNCTION public.anular_movimiento_principal_desde_secundaria()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el movimiento eliminado tiene un movimiento principal asociado
  IF OLD.movimiento_principal_id IS NOT NULL THEN
    -- Anular el movimiento principal
    UPDATE public.caja_movimientos
    SET
      anulado = true,
      updated_at = NOW()
    WHERE id = OLD.movimiento_principal_id
      AND user_id = OLD.user_id
      AND anulado = false; -- Solo anular si no está ya anulado
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para DELETE en caja_secundaria_movimientos
DROP TRIGGER IF EXISTS tr_anular_principal_desde_secundaria ON public.caja_secundaria_movimientos;
CREATE TRIGGER tr_anular_principal_desde_secundaria
  BEFORE DELETE ON public.caja_secundaria_movimientos
  FOR EACH ROW
  WHEN (OLD.movimiento_principal_id IS NOT NULL)
  EXECUTE FUNCTION public.anular_movimiento_principal_desde_secundaria();

COMMENT ON FUNCTION public.anular_movimiento_principal_desde_secundaria IS
'Cuando se elimina un movimiento de caja secundaria vinculado a uno principal, anula automáticamente el movimiento principal para mantener la sincronización';

-- Actualizar el trigger de anulación de caja principal para evitar loops
CREATE OR REPLACE FUNCTION public.anular_movimiento_caja_secundaria()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el movimiento se está anulando (anulado cambia de false a true)
  IF NEW.anulado = true AND OLD.anulado = false THEN
    -- Eliminar el movimiento relacionado en caja secundaria (si existe)
    -- El trigger de eliminación NO intentará anular el principal porque ya está anulado
    DELETE FROM public.caja_secundaria_movimientos
    WHERE movimiento_principal_id = NEW.id
      AND user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger (por si acaso)
DROP TRIGGER IF EXISTS tr_anular_movimiento_caja_secundaria ON public.caja_movimientos;
CREATE TRIGGER tr_anular_movimiento_caja_secundaria
  AFTER UPDATE OF anulado ON public.caja_movimientos
  FOR EACH ROW
  EXECUTE FUNCTION public.anular_movimiento_caja_secundaria();
