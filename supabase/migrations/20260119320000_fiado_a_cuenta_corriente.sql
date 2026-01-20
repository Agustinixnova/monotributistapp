-- Renombrar categoría "Fiado" a "Cuenta Corriente"

UPDATE public.caja_categorias
SET nombre = 'Cuenta Corriente'
WHERE nombre = 'Fiado'
  AND es_sistema = true;
