-- Agregar campo comentario a caja_clientes_fiado
ALTER TABLE public.caja_clientes_fiado
ADD COLUMN IF NOT EXISTS comentario VARCHAR(500);

COMMENT ON COLUMN public.caja_clientes_fiado.comentario IS 'Notas o comentarios sobre el cliente';
