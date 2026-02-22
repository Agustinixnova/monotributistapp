-- =====================================================
-- FIX: Política RLS de INSERT + UNIQUE constraint + mejora de trigger
-- para caja_secundaria_movimientos
-- Fecha: 2026-02-22
-- =====================================================

-- =====================================================
-- 1. FIX RLS INSERT: Agregar get_caja_owner_id()
-- =====================================================
-- PROBLEMA:
-- La política de INSERT solo verificaba user_id = auth.uid() OR is_full_access().
-- Cuando un empleado opera en la caja del empleador, el user_id es del dueño
-- pero auth.uid() es del empleado, causando error 42501 (RLS violation).
-- Las políticas de SELECT, UPDATE y DELETE ya fueron corregidas para usar
-- get_caja_owner_id(), pero INSERT no fue actualizada.

DROP POLICY IF EXISTS "insert_caja_secundaria_movimientos" ON public.caja_secundaria_movimientos;

CREATE POLICY "insert_caja_secundaria_movimientos"
  ON public.caja_secundaria_movimientos
  FOR INSERT
  WITH CHECK (
    user_id = public.get_caja_owner_id()
    OR user_id = auth.uid()
    OR public.is_full_access()
  );

COMMENT ON POLICY "insert_caja_secundaria_movimientos" ON public.caja_secundaria_movimientos IS
'Permite insertar movimientos propios o del empleador (para empleados)';

-- =====================================================
-- 2. UNIQUE CONSTRAINT en movimiento_principal_id
-- =====================================================
-- PROBLEMA:
-- El trigger sync_caja_secundaria() verifica con un SELECT si ya existe
-- un movimiento secundario para el principal, pero SIN constraint UNIQUE.
-- Bajo condiciones de race condition (retries de red, service worker PWA),
-- se pueden crear duplicados que causan que el saldo suba descontroladamente.

-- Primero limpiar duplicados existentes si los hay
-- (mantener solo el más antiguo de cada movimiento_principal_id)
DELETE FROM public.caja_secundaria_movimientos
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY movimiento_principal_id
             ORDER BY created_at ASC
           ) AS rn
    FROM public.caja_secundaria_movimientos
    WHERE movimiento_principal_id IS NOT NULL
  ) sub
  WHERE sub.rn > 1
);

-- Crear índice UNIQUE parcial (solo donde movimiento_principal_id no es NULL)
-- Los movimientos directos (gastos) tienen movimiento_principal_id = NULL y no se ven afectados
CREATE UNIQUE INDEX IF NOT EXISTS idx_caja_secundaria_mov_principal_unique
  ON public.caja_secundaria_movimientos (movimiento_principal_id)
  WHERE movimiento_principal_id IS NOT NULL;

-- =====================================================
-- 3. MEJORAR trigger sync_caja_secundaria con ON CONFLICT
-- =====================================================
-- Usar INSERT ... ON CONFLICT DO NOTHING para que sea idempotente.
-- Si por cualquier razón el trigger se ejecuta dos veces para el mismo
-- movimiento principal, la segunda ejecución simplemente no hace nada.

CREATE OR REPLACE FUNCTION public.sync_caja_secundaria()
RETURNS TRIGGER AS $$
DECLARE
  v_categoria_nombre TEXT;
  v_es_a_secundaria BOOLEAN := false;
  v_es_desde_secundaria BOOLEAN := false;
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
      BEGIN
        INSERT INTO public.caja_secundaria_movimientos (
          user_id, fecha, hora, tipo, monto,
          descripcion, origen, movimiento_principal_id, created_by_id
        ) VALUES (
          NEW.user_id, NEW.fecha, NEW.hora, 'entrada', NEW.monto_total,
          COALESCE(NEW.descripcion, 'Transferencia desde caja principal'),
          'transferencia', NEW.id, NEW.created_by_id
        )
        ON CONFLICT (movimiento_principal_id)
          WHERE movimiento_principal_id IS NOT NULL
          DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error al crear movimiento secundario: % - %', SQLERRM, SQLSTATE;
      END;
    END IF;

    -- Caso 2: Entrada "Desde caja secundaria" → Crear salida en secundaria
    IF v_es_desde_secundaria AND NEW.tipo = 'entrada' THEN
      BEGIN
        INSERT INTO public.caja_secundaria_movimientos (
          user_id, fecha, hora, tipo, monto,
          descripcion, origen, movimiento_principal_id, created_by_id
        ) VALUES (
          NEW.user_id, NEW.fecha, NEW.hora, 'salida', NEW.monto_total,
          COALESCE(NEW.descripcion, 'Reintegro a caja principal'),
          'reintegro', NEW.id, NEW.created_by_id
        )
        ON CONFLICT (movimiento_principal_id)
          WHERE movimiento_principal_id IS NOT NULL
          DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error al crear movimiento secundario (salida): % - %', SQLERRM, SQLSTATE;
      END;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.sync_caja_secundaria IS
'Sincroniza automáticamente movimientos entre caja principal y secundaria. Usa ON CONFLICT para idempotencia.';
