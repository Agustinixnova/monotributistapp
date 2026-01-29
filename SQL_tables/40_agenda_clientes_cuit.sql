-- =====================================================
-- Agenda Clientes - Campo CUIT para facturación
-- Fecha: 2026-01-29
-- =====================================================
--
-- Agrega campo CUIT para facturación electrónica.
-- Si el cliente tiene CUIT válido (11 dígitos), se factura con sus datos.
-- Si no tiene CUIT o está incompleto, se factura como Consumidor Final.
--
-- =====================================================

-- Agregar columna cuit a agenda_clientes
ALTER TABLE public.agenda_clientes
ADD COLUMN IF NOT EXISTS cuit VARCHAR(11);

-- Índice para búsqueda por CUIT
CREATE INDEX IF NOT EXISTS idx_agenda_clientes_cuit
ON public.agenda_clientes(duenio_id, cuit)
WHERE cuit IS NOT NULL;

-- Comentario
COMMENT ON COLUMN public.agenda_clientes.cuit IS
'CUIT del cliente para facturación electrónica (11 dígitos). Si es NULL o incompleto, se factura como Consumidor Final.';

-- =====================================================
-- LÓGICA DE FACTURACIÓN
-- =====================================================
--
-- En el modal de cliente:
-- - Dropdown: "Consumidor Final" / "Factura con CUIT"
-- - Si selecciona "Factura con CUIT", aparece campo para ingresar CUIT
-- - Si el CUIT no tiene 11 dígitos, se guarda NULL (consumidor final)
--
-- Al facturar:
-- - Si cliente.cuit tiene 11 dígitos → receptor_tipo_doc = 80, receptor_nro_doc = CUIT
-- - Si cliente.cuit es NULL → receptor_tipo_doc = 99, receptor_nro_doc = 0 (Consumidor Final)
--
-- =====================================================
