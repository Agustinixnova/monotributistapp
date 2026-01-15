-- =============================================
-- Fix: Validación de coeficientes IIBB
-- Problema: El trigger BEFORE INSERT valida fila por fila,
-- rechazando inserts múltiples válidos (ej: 2 provincias con 50% cada una)
-- Solución: Eliminar trigger row-level, validar en el backend
-- =============================================

-- Eliminar trigger y función anterior
DROP TRIGGER IF EXISTS trigger_validar_coeficientes ON public.client_iibb_jurisdicciones;
DROP FUNCTION IF EXISTS validar_coeficientes_cm();

-- Nota: La validación de que los coeficientes sumen 100% se hace ahora en el backend
-- antes de insertar los registros. Esto permite insertar múltiples provincias
-- simultáneamente sin problemas de validación fila por fila.

-- Mantener constraint de que solo puede haber una sede por cliente
-- (este constraint está en el índice único idx_iibb_una_sede_por_cliente)
