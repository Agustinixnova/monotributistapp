-- Script para corregir movimientos faltantes en caja secundaria
-- Busca todos los movimientos de caja principal con categorías de sistema
-- que no tienen su movimiento correspondiente en caja secundaria

DO $$
DECLARE
  v_movimiento RECORD;
  v_categoria_nombre TEXT;
BEGIN
  -- Recorrer todos los movimientos de caja principal no anulados
  FOR v_movimiento IN
    SELECT cm.*, cc.nombre as categoria_nombre
    FROM public.caja_movimientos cm
    JOIN public.caja_categorias cc ON cm.categoria_id = cc.id
    WHERE cm.anulado = false
      AND (cc.nombre ILIKE 'a caja secundaria' OR cc.nombre ILIKE 'desde caja secundaria')
  LOOP
    -- Verificar si ya existe el movimiento en caja secundaria
    IF NOT EXISTS (
      SELECT 1
      FROM public.caja_secundaria_movimientos
      WHERE movimiento_principal_id = v_movimiento.id
    ) THEN

      -- Caso 1: Salida "A caja secundaria" → Crear entrada en secundaria
      IF v_movimiento.categoria_nombre ILIKE 'a caja secundaria' AND v_movimiento.tipo = 'salida' THEN
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
          v_movimiento.user_id,
          v_movimiento.fecha,
          v_movimiento.hora,
          'entrada',
          v_movimiento.monto_total,
          COALESCE(v_movimiento.descripcion, 'Transferencia desde caja principal'),
          'transferencia',
          v_movimiento.id,
          v_movimiento.created_by_id
        );

        RAISE NOTICE 'Creado movimiento secundario de entrada para movimiento %', v_movimiento.id;
      END IF;

      -- Caso 2: Entrada "Desde caja secundaria" → Crear salida en secundaria
      IF v_movimiento.categoria_nombre ILIKE 'desde caja secundaria' AND v_movimiento.tipo = 'entrada' THEN
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
          v_movimiento.user_id,
          v_movimiento.fecha,
          v_movimiento.hora,
          'salida',
          v_movimiento.monto_total,
          COALESCE(v_movimiento.descripcion, 'Reintegro a caja principal'),
          'reintegro',
          v_movimiento.id,
          v_movimiento.created_by_id
        );

        RAISE NOTICE 'Creado movimiento secundario de salida para movimiento %', v_movimiento.id;
      END IF;

    END IF;
  END LOOP;

  RAISE NOTICE 'Sincronización completada';
END $$;
