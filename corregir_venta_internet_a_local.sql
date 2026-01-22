-- =====================================================
-- Script para corregir categorías de "Venta por internet" a "Venta en local"
-- Usuario: elizabeth3612@hotmail.com
-- ID: c671f12e-d88c-45e2-86c7-a37a8040492d
-- =====================================================

DO $$
DECLARE
  v_user_id UUID := 'c671f12e-d88c-45e2-86c7-a37a8040492d';
  v_cat_internet_id UUID;
  v_cat_local_id UUID;
  v_count_before INTEGER;
  v_count_updated INTEGER;
  v_count_after_internet INTEGER;
  v_count_after_local INTEGER;
  rec RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CORRECCIÓN: Venta por internet → Venta en local';
  RAISE NOTICE 'Usuario: %', v_user_id;
  RAISE NOTICE '========================================';

  -- 1. Buscar categorías "Venta por internet" y "Venta en local"
  SELECT id INTO v_cat_internet_id
  FROM public.caja_categorias
  WHERE nombre = 'Venta por internet'
  LIMIT 1;

  SELECT id INTO v_cat_local_id
  FROM public.caja_categorias
  WHERE nombre = 'Venta en local'
  LIMIT 1;

  -- Verificar que existan ambas categorías
  IF v_cat_internet_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró la categoría "Venta por internet"';
  END IF;

  IF v_cat_local_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró la categoría "Venta en local"';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '1. Categorías encontradas:';
  RAISE NOTICE '   Venta por internet: %', v_cat_internet_id;
  RAISE NOTICE '   Venta en local:     %', v_cat_local_id;

  -- 2. Contar movimientos en "Venta por internet" antes de la corrección
  SELECT COUNT(*)
  INTO v_count_before
  FROM public.caja_movimientos
  WHERE user_id = v_user_id
    AND categoria_id = v_cat_internet_id
    AND anulado = false;

  RAISE NOTICE '';
  RAISE NOTICE '2. Movimientos en "Venta por internet": %', v_count_before;

  IF v_count_before = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'No hay movimientos para corregir. Todo está bien.';
    RETURN;
  END IF;

  -- 3. Mostrar algunos ejemplos de movimientos a corregir
  RAISE NOTICE '';
  RAISE NOTICE '3. Ejemplos de movimientos a corregir:';

  FOR rec IN (
    SELECT fecha, hora, monto_total, descripcion
    FROM public.caja_movimientos
    WHERE user_id = v_user_id
      AND categoria_id = v_cat_internet_id
      AND anulado = false
    ORDER BY fecha DESC, hora DESC
    LIMIT 5
  ) LOOP
    RAISE NOTICE '   % % - $% - %', rec.fecha, rec.hora, rec.monto_total, COALESCE(rec.descripcion, '(sin descripción)');
  END LOOP;

  -- 4. Hacer la actualización
  RAISE NOTICE '';
  RAISE NOTICE '4. Actualizando movimientos...';

  UPDATE public.caja_movimientos
  SET categoria_id = v_cat_local_id
  WHERE user_id = v_user_id
    AND categoria_id = v_cat_internet_id
    AND anulado = false;

  GET DIAGNOSTICS v_count_updated = ROW_COUNT;

  RAISE NOTICE '   Movimientos actualizados: %', v_count_updated;

  -- 5. Verificar resultado final
  SELECT COUNT(*)
  INTO v_count_after_internet
  FROM public.caja_movimientos
  WHERE user_id = v_user_id
    AND categoria_id = v_cat_internet_id
    AND anulado = false;

  SELECT COUNT(*)
  INTO v_count_after_local
  FROM public.caja_movimientos
  WHERE user_id = v_user_id
    AND categoria_id = v_cat_local_id
    AND anulado = false;

  RAISE NOTICE '';
  RAISE NOTICE '5. Resultado final:';
  RAISE NOTICE '   Venta por internet: % movimientos', v_count_after_internet;
  RAISE NOTICE '   Venta en local:     % movimientos', v_count_after_local;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CORRECCIÓN COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '========================================';
END $$;
