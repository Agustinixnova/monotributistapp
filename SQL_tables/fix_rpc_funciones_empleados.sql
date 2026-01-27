-- =====================================================
-- FIX: Funciones RPC para empleados de caja
-- Fecha: 2026-01-27
-- =====================================================

-- PROBLEMA:
-- Existían dos versiones de las funciones caja_resumen_dia y caja_totales_por_metodo:
-- 1. Versión antigua: caja_resumen_dia(p_user_id UUID, p_fecha DATE)
-- 2. Versión nueva: caja_resumen_dia(p_fecha DATE) que usa get_caja_owner_id()
--
-- El código JavaScript estaba llamando a la versión antigua pasando p_user_id,
-- lo que causaba que empleados vean la caja vacía ($0) porque el userId pasado
-- era el del empleado, no el del dueño.

-- SOLUCIÓN:
-- 1. Eliminar versiones antiguas con p_user_id
-- 2. Mantener solo versiones que usan get_caja_owner_id() internamente
-- 3. Actualizar código JavaScript para no pasar p_user_id

-- Ver migración completa en:
-- supabase/migrations/20260127000000_fix_rpc_funciones_empleados.sql

-- FUNCIONES AFECTADAS:
-- - caja_resumen_dia(DATE) - Resumen del día
-- - caja_totales_por_metodo(DATE) - Totales por método de pago

-- PARA EJECUTAR MANUALMENTE EN SUPABASE:
-- Copiar y pegar el contenido de la migración en el SQL Editor
