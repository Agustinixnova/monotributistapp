-- ========================================
-- POLÍTICA PARA PERMITIR LEER PERFILES BÁSICOS
-- Necesaria para el buzón de mensajes (ver nombre de quien envió)
-- ========================================

-- Permitir a usuarios autenticados ver información básica de otros usuarios
DROP POLICY IF EXISTS "profiles_select_basic" ON public.profiles;
CREATE POLICY "profiles_select_basic" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
    );

-- Nota: Esta política permite a cualquier usuario autenticado ver
-- la información de profiles. La aplicación debe filtrar qué campos
-- exponer en las consultas (solo id, nombre, apellido, email).
