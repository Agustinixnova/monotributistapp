-- Asegurar que la categoría Fiado exista y sea de tipo 'entrada'

-- Primero intentar actualizar si existe
UPDATE public.caja_categorias
SET tipo = 'entrada', activo = true
WHERE nombre = 'Fiado'
  AND user_id IS NULL;

-- Si no se actualizó ninguna fila, insertar
INSERT INTO public.caja_categorias (user_id, nombre, icono, tipo, es_sistema, orden, activo)
SELECT NULL, 'Fiado', 'UserPlus', 'entrada', true, 16, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.caja_categorias
  WHERE nombre = 'Fiado' AND user_id IS NULL
);
