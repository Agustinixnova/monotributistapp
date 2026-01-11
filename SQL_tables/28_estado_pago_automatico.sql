-- =============================================
-- CALCULO AUTOMATICO DE ESTADO DE PAGO
-- Descripción: Sistema automático para calcular el estado de pago
-- del monotributo basándose en cuotas mensuales
-- =============================================

-- Ver migración: supabase/migrations/20260111000000_calcular_estado_pago_automatico.sql

-- =============================================
-- FUNCION: calcular_estado_pago_monotributo
-- =============================================
-- Calcula el estado de pago de un cliente basándose en:
-- 1. Registros en client_cuota_mensual con estado 'informada' o 'verificada'
-- 2. Fecha actual en Argentina (UTC-3)
-- 3. Día 20 como fecha de vencimiento
-- 4. Cuenta meses consecutivos adeudados hacia atrás desde el mes más reciente

-- Retorna:
-- - 'al_dia': No debe cuotas
-- - 'debe_1_cuota': Debe 1 mes
-- - 'debe_2_mas': Debe 2 o más meses

-- Ejemplo de uso:
-- SELECT public.calcular_estado_pago_monotributo('uuid-del-cliente');

-- =============================================
-- TRIGGER: actualizar_estado_pago_trigger
-- =============================================
-- Se ejecuta automáticamente cuando:
-- - Se inserta un registro en client_cuota_mensual
-- - Se actualiza un registro en client_cuota_mensual
--
-- Acción:
-- Actualiza el campo estado_pago_monotributo en client_fiscal_data

-- =============================================
-- LÓGICA DE CÁLCULO
-- =============================================

-- 1. Obtener fecha actual en Argentina (UTC-3)
-- 2. Determinar el mes a evaluar:
--    - Si hoy es día 20 o posterior: evaluar mes actual
--    - Si hoy es antes del día 20: evaluar desde mes anterior
-- 3. Contar meses adeudados consecutivos hacia atrás:
--    - Si NO existe registro con estado 'informada' o 'verificada' → mes adeudado
--    - Si existe registro pagado → detener conteo
-- 4. Clasificar:
--    - 0 meses adeudados → 'al_dia'
--    - 1 mes adeudado → 'debe_1_cuota'
--    - 2+ meses adeudados → 'debe_2_mas'

-- =============================================
-- EJEMPLOS
-- =============================================

-- Caso 1: Cliente al día
-- Fecha actual: 11 de Enero 2026 (antes del día 20)
-- Cuota Diciembre 2025: pagada ✓
-- Resultado: 'al_dia'

-- Caso 2: Cliente debe 1 cuota
-- Fecha actual: 25 de Enero 2026 (después del día 20)
-- Cuota Enero 2026: NO pagada ✗
-- Cuota Diciembre 2025: pagada ✓
-- Resultado: 'debe_1_cuota'

-- Caso 3: Cliente debe 2 cuotas
-- Fecha actual: 25 de Febrero 2026
-- Cuota Febrero 2026: NO pagada ✗
-- Cuota Enero 2026: NO pagada ✗
-- Cuota Diciembre 2025: pagada ✓
-- Resultado: 'debe_2_mas'

-- =============================================
-- IMPORTANTE
-- =============================================

-- El campo estado_pago_monotributo en client_fiscal_data:
-- 1. Se actualiza AUTOMÁTICAMENTE vía trigger cuando se registra un pago
-- 2. Puede ser recalculado manualmente ejecutando:
--    UPDATE client_fiscal_data
--    SET estado_pago_monotributo = calcular_estado_pago_monotributo(id)
--    WHERE id = 'uuid-del-cliente';

-- 3. ARCA da de baja del monotributo con 10 cuotas impagas (consecutivas o alternadas)
--    Esta función solo controla el estado visual, NO aplica la baja automática
