-- =============================================
-- Row Level Security Policies
-- Descripción: Políticas de seguridad a nivel de fila
-- =============================================

-- FUNCIONES HELPER

-- get_user_role(): Retorna el nombre del rol del usuario actual
-- is_admin(): Retorna TRUE si el usuario es admin
-- is_contador(): Retorna TRUE si el usuario es admin, contadora_principal o contador_secundario

-- POLÍTICAS POR TABLA:

-- ROLES:
-- SELECT: Todos pueden leer
-- INSERT/UPDATE: Solo admin
-- DELETE: Solo admin, y solo si is_system = FALSE

-- MODULES:
-- SELECT: Todos pueden leer
-- INSERT/UPDATE/DELETE: Solo admin

-- ROLE_DEFAULT_MODULES:
-- SELECT: Todos pueden leer
-- INSERT/UPDATE/DELETE: Solo admin

-- PROFILES:
-- SELECT:
--   - Usuario ve su propio perfil
--   - Admin y contadora_principal ven todo
--   - Contador_secundario ve solo sus clientes asignados
-- INSERT: Admin y contadora_principal
-- UPDATE: Usuario propio perfil + Admin + contadora_principal
-- DELETE: Solo admin

-- USER_MODULE_ACCESS:
-- SELECT: Usuario propio + Admin + contadora_principal
-- INSERT/UPDATE/DELETE: Admin y contadora_principal

-- CLIENT_FISCAL_DATA:
-- SELECT: Mismo criterio que profiles
-- INSERT/UPDATE: Admin y contadora_principal
-- DELETE: Solo admin

-- MONOTRIBUTO_CATEGORIAS:
-- SELECT: Todos (lectura pública)
-- INSERT/UPDATE/DELETE: Solo admin

-- Ver archivo de migración 20250104000003_rls_policies.sql para implementación completa
