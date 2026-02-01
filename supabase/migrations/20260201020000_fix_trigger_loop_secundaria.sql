-- =====================================================
-- FIX: Conflicto de triggers al eliminar de caja_secundaria_movimientos
-- Fecha: 2026-02-01
-- =====================================================

-- PROBLEMA:
-- 1. DELETE en caja_secundaria_movimientos dispara BEFORE trigger
-- 2. Ese trigger hace UPDATE en caja_movimientos (anulado = true)
-- 3. El UPDATE dispara AFTER trigger que intenta DELETE del mismo registro
-- 4. Error: "tuple to be deleted was already modified by an operation triggered by the current command"

-- SOLUCIÓN:
-- Cambiar a AFTER DELETE y evitar el loop con una verificación

-- Primero eliminar el trigger problemático
DROP TRIGGER IF EXISTS tr_anular_principal_desde_secundaria ON public.caja_secundaria_movimientos;

-- Recrear la función con verificación anti-loop
CREATE OR REPLACE FUNCTION public.anular_movimiento_principal_desde_secundaria()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el movimiento eliminado tiene un movimiento principal asociado
  IF OLD.movimiento_principal_id IS NOT NULL THEN
    -- Anular el movimiento principal (pero no disparar el trigger recursivo)
    -- Usamos una actualización que el otro trigger ignorará
    UPDATE public.caja_movimientos
    SET
      anulado = true,
      updated_at = NOW()
    WHERE id = OLD.movimiento_principal_id
      AND user_id = OLD.user_id
      AND anulado = false;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger AFTER DELETE (no BEFORE)
CREATE TRIGGER tr_anular_principal_desde_secundaria
  AFTER DELETE ON public.caja_secundaria_movimientos
  FOR EACH ROW
  WHEN (OLD.movimiento_principal_id IS NOT NULL)
  EXECUTE FUNCTION public.anular_movimiento_principal_desde_secundaria();

-- Ahora actualizar el trigger inverso para NO intentar eliminar
-- si el registro ya no existe (fue el que inició la cascada)
CREATE OR REPLACE FUNCTION public.anular_movimiento_caja_secundaria()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el movimiento se está anulando (anulado cambia de false a true)
  IF NEW.anulado = true AND OLD.anulado = false THEN
    -- Eliminar el movimiento relacionado en caja secundaria SI EXISTE
    -- Si ya fue eliminado (porque el DELETE vino desde allí), no pasa nada
    DELETE FROM public.caja_secundaria_movimientos
    WHERE movimiento_principal_id = NEW.id
      AND user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.anular_movimiento_principal_desde_secundaria IS
'AFTER DELETE: Cuando se elimina un movimiento de caja secundaria, anula el movimiento principal asociado';

COMMENT ON FUNCTION public.anular_movimiento_caja_secundaria IS
'Cuando se anula un movimiento principal, elimina el movimiento secundario asociado (si aún existe)';
