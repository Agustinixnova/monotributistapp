-- =============================================
-- Fix: Crear perfil para usuario admin existente
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Insertar perfil para el usuario actual
INSERT INTO public.profiles (id, email, nombre, apellido, role_id, is_active)
SELECT
    '70adb020-fb12-4586-bdda-f10b2e414f9e',
    u.email,
    COALESCE(u.raw_user_meta_data->>'nombre', 'Admin'),
    COALESCE(u.raw_user_meta_data->>'apellido', 'Sistema'),
    r.id,
    TRUE
FROM auth.users u
CROSS JOIN public.roles r
WHERE u.id = '70adb020-fb12-4586-bdda-f10b2e414f9e'
  AND r.name = 'admin'
ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    is_active = TRUE;

-- Verificar que se creó correctamente
SELECT p.*, r.name as role_name
FROM profiles p
JOIN roles r ON p.role_id = r.id
WHERE p.id = '70adb020-fb12-4586-bdda-f10b2e414f9e';
