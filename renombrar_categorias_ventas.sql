-- =====================================================
-- Script para renombrar categorías de ventas
-- "Venta offline" → "Venta en local"
-- "Venta online" → "Venta por internet"
-- =====================================================

DO $$
DECLARE
  v_count_offline INTEGER;
  v_count_online INTEGER;
  rec RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RENOMBRANDO CATEGORÍAS DE VENTAS';
  RAISE NOTICE '========================================';

  -- 1. Renombrar "Venta offline" a "Venta en local"
  RAISE NOTICE '';
  RAISE NOTICE '1. Renombrando "Venta offline" → "Venta en local"...';

  UPDATE public.caja_categorias
  SET nombre = 'Venta en local'
  WHERE nombre = 'Venta offline';

  GET DIAGNOSTICS v_count_offline = ROW_COUNT;

  RAISE NOTICE '   Categorías actualizadas: %', v_count_offline;

  -- 2. Renombrar "Venta online" a "Venta por internet"
  RAISE NOTICE '';
  RAISE NOTICE '2. Renombrando "Venta online" → "Venta por internet"...';

  UPDATE public.caja_categorias
  SET nombre = 'Venta por internet'
  WHERE nombre = 'Venta online';

  GET DIAGNOSTICS v_count_online = ROW_COUNT;

  RAISE NOTICE '   Categorías actualizadas: %', v_count_online;

  -- 3. Verificar resultado
  RAISE NOTICE '';
  RAISE NOTICE '3. Verificando categorías actuales...';

  FOR rec IN (
    SELECT id, nombre, user_id, tipo
    FROM public.caja_categorias
    WHERE nombre IN ('Venta en local', 'Venta por internet')
    ORDER BY nombre
  ) LOOP
    RAISE NOTICE '   ✓ % (User: %, Tipo: %)', rec.nombre, COALESCE(rec.user_id::TEXT, 'sistema'), rec.tipo;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RENOMBRADO COMPLETADO';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora tus clientes verán:';
  RAISE NOTICE '  • "Venta en local" - Para ventas en el negocio físico';
  RAISE NOTICE '  • "Venta por internet" - Para ventas online/delivery';
  RAISE NOTICE '';
  RAISE NOTICE 'No importa si cobran con efectivo, QR, tarjeta o MercadoPago.';
  RAISE NOTICE 'Lo que importa es DÓNDE se hizo la venta.';
  RAISE NOTICE '========================================';
END $$;
