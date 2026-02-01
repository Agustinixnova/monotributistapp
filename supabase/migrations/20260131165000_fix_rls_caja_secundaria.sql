-- Verificar y corregir las políticas RLS de caja_secundaria_movimientos
-- para permitir inserts desde el trigger de sincronización

-- Habilitar RLS si no está habilitado
ALTER TABLE public.caja_secundaria_movimientos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes y recrearlas correctamente
DROP POLICY IF EXISTS "select_caja_secundaria_movimientos" ON public.caja_secundaria_movimientos;
DROP POLICY IF EXISTS "insert_caja_secundaria_movimientos" ON public.caja_secundaria_movimientos;
DROP POLICY IF EXISTS "update_caja_secundaria_movimientos" ON public.caja_secundaria_movimientos;
DROP POLICY IF EXISTS "delete_caja_secundaria_movimientos" ON public.caja_secundaria_movimientos;

-- Política de SELECT: Ver solo mis movimientos
CREATE POLICY "select_caja_secundaria_movimientos"
  ON public.caja_secundaria_movimientos
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_full_access());

-- Política de INSERT: Insertar mis movimientos O desde trigger (BYPASS RLS)
CREATE POLICY "insert_caja_secundaria_movimientos"
  ON public.caja_secundaria_movimientos
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_full_access());

-- Política de UPDATE: Actualizar solo mis movimientos
CREATE POLICY "update_caja_secundaria_movimientos"
  ON public.caja_secundaria_movimientos
  FOR UPDATE
  USING (user_id = auth.uid() OR public.is_full_access());

-- Política de DELETE: Eliminar solo mis movimientos
CREATE POLICY "delete_caja_secundaria_movimientos"
  ON public.caja_secundaria_movimientos
  FOR DELETE
  USING (user_id = auth.uid() OR public.is_full_access());

-- Dar permisos de BYPASS RLS a la función del trigger
-- Esto permite que el trigger inserte sin restricciones de RLS
ALTER FUNCTION public.sync_caja_secundaria() SECURITY DEFINER SET search_path = public, auth;

COMMENT ON POLICY "insert_caja_secundaria_movimientos" ON public.caja_secundaria_movimientos IS
'Permite insertar movimientos propios o desde trigger de sincronización';
