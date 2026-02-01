-- Agregar política de INSERT para caja_categorias si no existe
DROP POLICY IF EXISTS "caja_categorias_insert" ON public.caja_categorias;
CREATE POLICY "caja_categorias_insert" ON public.caja_categorias
  FOR INSERT WITH CHECK (auth.uid() = user_id);
