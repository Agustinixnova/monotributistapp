-- ============================================
-- Fix: Actualizar categoría "Fiado" a "Cuenta Corriente"
-- ============================================

-- Paso 1: Verificar si existe la categoría "Cuenta Corriente"
-- Si no existe, renombrar "Fiado" a "Cuenta Corriente"
-- Si existe, actualizar movimientos de "Fiado" a "Cuenta Corriente" y luego eliminar "Fiado"

DO $$
DECLARE
  v_fiado_id UUID;
  v_cuenta_corriente_id UUID;
BEGIN
  -- Buscar ID de categoría "Fiado"
  SELECT id INTO v_fiado_id
  FROM public.caja_categorias
  WHERE nombre = 'Fiado' AND es_sistema = true
  LIMIT 1;

  -- Buscar ID de categoría "Cuenta Corriente"
  SELECT id INTO v_cuenta_corriente_id
  FROM public.caja_categorias
  WHERE nombre = 'Cuenta Corriente' AND es_sistema = true
  LIMIT 1;

  -- Caso 1: Si existe "Fiado" pero no existe "Cuenta Corriente"
  IF v_fiado_id IS NOT NULL AND v_cuenta_corriente_id IS NULL THEN
    -- Simplemente renombrar "Fiado" a "Cuenta Corriente" y cambiar tipo
    UPDATE public.caja_categorias
    SET nombre = 'Cuenta Corriente',
        tipo = 'entrada'
    WHERE id = v_fiado_id;

    RAISE NOTICE 'Categoría "Fiado" renombrada a "Cuenta Corriente"';

  -- Caso 2: Si existen ambas categorías
  ELSIF v_fiado_id IS NOT NULL AND v_cuenta_corriente_id IS NOT NULL THEN
    -- Actualizar todos los movimientos que usan "Fiado" para que usen "Cuenta Corriente"
    UPDATE public.caja_movimientos
    SET categoria_id = v_cuenta_corriente_id
    WHERE categoria_id = v_fiado_id;

    -- Actualizar todos los fiados que puedan referenciar la categoría (si existe tal campo)
    -- (Por ahora caja_fiados no tiene categoria_id, pero por si acaso)

    -- Ahora sí podemos eliminar "Fiado"
    DELETE FROM public.caja_categorias
    WHERE id = v_fiado_id;

    -- Asegurar que "Cuenta Corriente" tiene tipo entrada
    UPDATE public.caja_categorias
    SET tipo = 'entrada'
    WHERE id = v_cuenta_corriente_id;

    RAISE NOTICE 'Movimientos actualizados y categoría "Fiado" eliminada';

  -- Caso 3: Solo existe "Cuenta Corriente"
  ELSIF v_cuenta_corriente_id IS NOT NULL THEN
    -- Solo asegurar que tiene tipo entrada
    UPDATE public.caja_categorias
    SET tipo = 'entrada'
    WHERE id = v_cuenta_corriente_id;

    RAISE NOTICE 'Categoría "Cuenta Corriente" actualizada';

  -- Caso 4: No existe ninguna - crear "Cuenta Corriente"
  ELSE
    INSERT INTO public.caja_categorias (user_id, nombre, icono, tipo, es_sistema, orden, activo)
    VALUES (NULL, 'Cuenta Corriente', 'UserPlus', 'entrada', true, 16, true);

    RAISE NOTICE 'Categoría "Cuenta Corriente" creada';
  END IF;

  -- Asegurar que existe "Cobro de deuda"
  INSERT INTO public.caja_categorias (user_id, nombre, icono, tipo, es_sistema, orden, activo)
  VALUES (NULL, 'Cobro de deuda', 'HandCoins', 'entrada', true, 15, true)
  ON CONFLICT (user_id, nombre) DO UPDATE
  SET tipo = 'entrada',
      activo = true;

END $$;
