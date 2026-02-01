-- =====================================================
-- FIX: Política RLS de DELETE para caja_secundaria_movimientos
-- Fecha: 2026-02-01
-- =====================================================

-- PROBLEMA:
-- La política de DELETE usaba auth.uid() pero el servicio usa getEffectiveUserId()
-- Cuando un empleado trabaja en la caja del empleador, auth.uid() es el empleado
-- pero el user_id del movimiento es del empleador, causando error 400.

-- SOLUCIÓN:
-- Usar get_caja_owner_id() que devuelve el userId correcto según el contexto

-- Recrear la política de DELETE
DROP POLICY IF EXISTS "delete_caja_secundaria_movimientos" ON public.caja_secundaria_movimientos;

CREATE POLICY "delete_caja_secundaria_movimientos"
  ON public.caja_secundaria_movimientos
  FOR DELETE
  USING (
    user_id = public.get_caja_owner_id()
    OR user_id = auth.uid()
    OR public.is_full_access()
  );

-- También actualizar UPDATE para consistencia
DROP POLICY IF EXISTS "update_caja_secundaria_movimientos" ON public.caja_secundaria_movimientos;

CREATE POLICY "update_caja_secundaria_movimientos"
  ON public.caja_secundaria_movimientos
  FOR UPDATE
  USING (
    user_id = public.get_caja_owner_id()
    OR user_id = auth.uid()
    OR public.is_full_access()
  );

-- Y SELECT también
DROP POLICY IF EXISTS "select_caja_secundaria_movimientos" ON public.caja_secundaria_movimientos;

CREATE POLICY "select_caja_secundaria_movimientos"
  ON public.caja_secundaria_movimientos
  FOR SELECT
  USING (
    user_id = public.get_caja_owner_id()
    OR user_id = auth.uid()
    OR public.is_full_access()
  );

COMMENT ON POLICY "delete_caja_secundaria_movimientos" ON public.caja_secundaria_movimientos IS
'Permite eliminar movimientos propios o del empleador (para empleados)';
