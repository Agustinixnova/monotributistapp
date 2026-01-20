-- Cambiar categoría "Fiado" de tipo 'salida' a 'entrada'
-- El fiado se registra desde la pantalla de ENTRADA (cliente compra fiado)
-- pero NO genera movimiento en caja (solo registra deuda)

UPDATE public.caja_categorias
SET tipo = 'entrada'
WHERE nombre = 'Fiado'
  AND es_sistema = true;

COMMENT ON TABLE public.caja_fiados IS 'Ventas a crédito (fiados). Se registran desde Entrada pero NO afectan la caja del día. Solo registran la deuda del cliente.';
