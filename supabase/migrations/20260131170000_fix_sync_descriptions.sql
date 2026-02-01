-- Actualizar las descripciones en el trigger de sincronización
-- Cambiar "Transferencia desde caja principal" por "Ingreso desde caja principal"

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

  -- Log para debug
  RAISE NOTICE 'Trigger sync_caja_secundaria ejecutado. Categoría: %, Tipo: %, Anulado: %',
    v_categoria_nombre, NEW.tipo, NEW.anulado;

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
        BEGIN
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
            COALESCE(NEW.descripcion, 'Ingreso desde caja principal'),
            'transferencia',
            NEW.id,
            NEW.created_by_id
          );

          RAISE NOTICE 'Movimiento secundario creado exitosamente para movimiento %', NEW.id;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Error al crear movimiento secundario: % - %', SQLERRM, SQLSTATE;
        END;
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
        BEGIN
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
            COALESCE(NEW.descripcion, 'Egreso a caja principal'),
            'reintegro',
            NEW.id,
            NEW.created_by_id
          );

          RAISE NOTICE 'Movimiento secundario (salida) creado exitosamente para movimiento %', NEW.id;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Error al crear movimiento secundario (salida): % - %', SQLERRM, SQLSTATE;
        END;
      END IF;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;
