-- =====================================================
-- Script para ocultar "Cobro de deuda" del selector
-- Esta categoría solo debe usarse automáticamente desde
-- el módulo de Cuenta Corriente, no manualmente
-- =====================================================

DO $$
DECLARE
  v_count INTEGER;
  v_movimientos_existentes INTEGER;
  rec RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'OCULTANDO "Cobro de deuda" DEL SELECTOR';
  RAISE NOTICE '========================================';

  -- 1. Verificar si hay movimientos con esta categoría
  RAISE NOTICE '';
  RAISE NOTICE '1. Verificando movimientos existentes...';

  SELECT COUNT(*)
  INTO v_movimientos_existentes
  FROM public.caja_movimientos m
  JOIN public.caja_categorias c ON c.id = m.categoria_id
  WHERE c.nombre = 'Cobro de deuda';

  RAISE NOTICE '   Movimientos con "Cobro de deuda": %', v_movimientos_existentes;

  -- 2. Desactivar la categoría para que no aparezca en selectores
  RAISE NOTICE '';
  RAISE NOTICE '2. Ocultando categoría del selector...';

  UPDATE public.caja_categorias
  SET activo = false
  WHERE nombre = 'Cobro de deuda'
    AND es_sistema = true;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RAISE NOTICE '   Categorías actualizadas: %', v_count;

  -- 3. Verificar resultado
  RAISE NOTICE '';
  RAISE NOTICE '3. Estado de la categoría:';

  FOR rec IN (
    SELECT id, nombre, activo, es_sistema
    FROM public.caja_categorias
    WHERE nombre = 'Cobro de deuda'
  ) LOOP
    RAISE NOTICE '   Categoría: %', rec.nombre;
    RAISE NOTICE '   Activa: %', rec.activo;
    RAISE NOTICE '   Es sistema: %', rec.es_sistema;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CATEGORÍA OCULTA CORRECTAMENTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Resultado:';
  RAISE NOTICE '  • "Cobro de deuda" NO aparecerá en el selector de categorías';
  RAISE NOTICE '  • Los % movimientos existentes seguirán visibles', v_movimientos_existentes;
  RAISE NOTICE '  • Los cobros se seguirán registrando automáticamente';
  RAISE NOTICE '    desde el módulo de Cuenta Corriente';
  RAISE NOTICE '========================================';
END $$;
