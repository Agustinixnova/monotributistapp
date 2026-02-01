-- Actualizar descripciones de movimientos existentes
-- Cambiar textos antiguos por los nuevos

-- Actualizar "Transferencia desde caja principal" → "Ingreso desde caja principal"
UPDATE public.caja_secundaria_movimientos
SET descripcion = 'Ingreso desde caja principal'
WHERE descripcion = 'Transferencia desde caja principal';

-- Actualizar "Desde arqueo de caja" → "Ingreso desde arqueo de caja"
UPDATE public.caja_secundaria_movimientos
SET descripcion = 'Ingreso desde arqueo de caja'
WHERE descripcion = 'Desde arqueo de caja';

-- Actualizar "Reintegro a caja principal" → "Egreso a caja principal"
UPDATE public.caja_secundaria_movimientos
SET descripcion = 'Egreso a caja principal'
WHERE descripcion = 'Reintegro a caja principal';

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Descripciones actualizadas exitosamente';
END $$;
