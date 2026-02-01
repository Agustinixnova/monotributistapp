-- Trigger para sincronizar automáticamente movimientos entre caja principal y secundaria
-- Cuando se crea/modifica un movimiento con categoría "A caja secundaria" o "Desde caja secundaria"

CREATE OR REPLACE FUNCTION public.sync_caja_secundaria()
RETURNS TRIGGER AS $$
DECLARE
  v_categoria_nombre TEXT;
  v_es_a_secundaria BOOLEAN := false;
  v_es_desde_secundaria BOOLEAN := false;
  v_movimiento_secundaria_id UUID;
BEGIN
  -- Obtener el nombre de la categoría
  SELECT nombre INTO v_categoria_nombre
  FROM public.caja_categorias
  WHERE id = NEW.categoria_id;

  -- Verificar si es una de las categorías de sistema de caja secundaria
  v_es_a_secundaria := v_categoria_nombre ILIKE 'a caja secundaria';
  v_es_desde_secundaria := v_categoria_nombre ILIKE 'desde caja secundaria';

  -- Solo procesar si es una categoría relevante y no está anulado
  IF (v_es_a_secundaria OR v_es_desde_secundaria) AND NEW.anulado = false THEN

    -- Caso 1: Salida "A caja secundaria" → Crear entrada en secundaria
    IF v_es_a_secundaria AND NEW.tipo = 'salida' THEN
      -- Verificar si ya existe un movimiento secundario vinculado
      SELECT id INTO v_movimiento_secundaria_id
      FROM public.caja_secundaria_movimientos
      WHERE movimiento_principal_id = NEW.id;

      -- Si no existe, crearlo
      IF v_movimiento_secundaria_id IS NULL THEN
        INSERT INTO public.caja_secundaria_movimientos (
          user_id,
          fecha,
          hora,
          tipo,
          monto,
          descripcion,
          origen,
          movimiento_principal_id,
          created_by_id
        ) VALUES (
          NEW.user_id,
          NEW.fecha,
          NEW.hora,
          'entrada',
          NEW.monto_total,
          COALESCE(NEW.descripcion, 'Transferencia desde caja principal'),
          'transferencia',
          NEW.id,
          NEW.created_by_id
        );
      END IF;
    END IF;

    -- Caso 2: Entrada "Desde caja secundaria" → Crear salida en secundaria
    IF v_es_desde_secundaria AND NEW.tipo = 'entrada' THEN
      -- Verificar si ya existe un movimiento secundario vinculado
      SELECT id INTO v_movimiento_secundaria_id
      FROM public.caja_secundaria_movimientos
      WHERE movimiento_principal_id = NEW.id;

      -- Si no existe, crearlo
      IF v_movimiento_secundaria_id IS NULL THEN
        INSERT INTO public.caja_secundaria_movimientos (
          user_id,
          fecha,
          hora,
          tipo,
          monto,
          descripcion,
          origen,
          movimiento_principal_id,
          created_by_id
        ) VALUES (
          NEW.user_id,
          NEW.fecha,
          NEW.hora,
          'salida',
          NEW.monto_total,
          COALESCE(NEW.descripcion, 'Reintegro a caja principal'),
          'reintegro',
          NEW.id,
          NEW.created_by_id
        );
      END IF;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para INSERT
DROP TRIGGER IF EXISTS tr_sync_caja_secundaria_insert ON public.caja_movimientos;
CREATE TRIGGER tr_sync_caja_secundaria_insert
  AFTER INSERT ON public.caja_movimientos
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_caja_secundaria();

-- Crear trigger para UPDATE (por si cambian la categoría)
DROP TRIGGER IF EXISTS tr_sync_caja_secundaria_update ON public.caja_movimientos;
CREATE TRIGGER tr_sync_caja_secundaria_update
  AFTER UPDATE ON public.caja_movimientos
  FOR EACH ROW
  WHEN (OLD.categoria_id IS DISTINCT FROM NEW.categoria_id OR OLD.anulado IS DISTINCT FROM NEW.anulado)
  EXECUTE FUNCTION public.sync_caja_secundaria();

COMMENT ON FUNCTION public.sync_caja_secundaria IS
'Sincroniza automáticamente movimientos entre caja principal y secundaria cuando se usan las categorías "A caja secundaria" o "Desde caja secundaria"';
