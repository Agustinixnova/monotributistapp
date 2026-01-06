-- =============================================
-- Row Level Security Policies
-- Descripción: Políticas de seguridad a nivel de fila
-- Última actualización: 2025-01-06
-- =============================================

-- =============================================
-- FUNCIONES HELPER (IMPORTANTE)
-- =============================================
--
-- SIEMPRE usar estas funciones en las políticas RLS.
-- NUNCA hardcodear roles directamente.
--
-- get_user_role(): Retorna el nombre del rol del usuario actual
-- is_full_access(): TRUE si es admin, contadora_principal, desarrollo, comunicadora
-- is_admin(): Alias de is_full_access() (para compatibilidad)
-- is_contador(): TRUE si es admin, contadora_principal, contador_secundario, desarrollo, comunicadora
--
-- Ejemplo correcto:
--   CREATE POLICY "mi_policy" ON mi_tabla
--       FOR UPDATE USING (public.is_full_access());
--
-- Ejemplo INCORRECTO (NO HACER):
--   CREATE POLICY "mi_policy" ON mi_tabla
--       FOR UPDATE USING (public.get_user_role() IN ('admin', 'contadora_principal'));
--
-- =============================================

-- =============================================
-- ROLES CON ACCESO TOTAL
-- =============================================
-- admin
-- contadora_principal
-- desarrollo
-- comunicadora
--
-- Estos roles pueden ver/editar/eliminar en la mayoría de las tablas.
-- Si necesitás agregar un nuevo rol con acceso total, modificar is_full_access()
-- en la migración 20250106000001_fix_rls_full_access.sql
-- =============================================

-- POLÍTICAS POR TABLA:

-- ROLES:
-- SELECT: Todos pueden leer
-- INSERT/UPDATE/DELETE: Solo is_full_access()

-- MODULES:
-- SELECT: Todos pueden leer
-- INSERT/UPDATE/DELETE: Solo is_full_access()

-- ROLE_DEFAULT_MODULES:
-- SELECT: Todos pueden leer
-- INSERT/UPDATE/DELETE: Solo is_full_access()

-- PROFILES:
-- SELECT:
--   - Usuario ve su propio perfil
--   - is_full_access() ven todo
--   - Contador_secundario ve solo sus clientes asignados
-- INSERT: is_full_access()
-- UPDATE: Usuario propio perfil + is_full_access()
-- DELETE: Solo is_full_access()

-- USER_MODULE_ACCESS:
-- SELECT: Usuario propio + is_full_access()
-- INSERT/UPDATE/DELETE: is_full_access()

-- CLIENT_FISCAL_DATA:
-- SELECT: Mismo criterio que profiles
-- INSERT/UPDATE: is_full_access()
-- DELETE: Solo is_full_access()

-- MONOTRIBUTO_CATEGORIAS:
-- SELECT: Todos (lectura pública)
-- INSERT/UPDATE/DELETE: Solo is_full_access()

-- ALERTAS_CONFIG:
-- SELECT: is_contador()
-- INSERT/UPDATE/DELETE: is_full_access()

-- NOTIFICACIONES:
-- SELECT: Usuario propio + is_full_access()
-- UPDATE: Usuario propio (marcar leída)
-- DELETE: is_full_access()

-- CLIENT_FACTURACION_MENSUAL:
-- SELECT: Usuario propio + is_contador()
-- INSERT/UPDATE: is_contador() + cliente propio
-- DELETE: is_full_access()

-- CLIENT_CUOTA_MENSUAL:
-- SELECT: Usuario propio + is_contador()
-- INSERT/UPDATE: is_contador() + cliente propio
-- DELETE: is_full_access()

-- =============================================
-- Ver migraciones para implementación:
-- - 20250104000003_rls_policies.sql (políticas base)
-- - 20250106000001_fix_rls_full_access.sql (funciones centralizadas)
-- =============================================
