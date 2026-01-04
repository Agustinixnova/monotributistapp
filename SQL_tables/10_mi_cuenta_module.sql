-- =============================================
-- Módulo: Mi Cuenta
-- Descripción: Módulo para que clientes gestionen su cuenta y suscripción
-- Para roles: monotributista, responsable_inscripto
-- =============================================

-- 1. Insertar módulo Mi Cuenta
INSERT INTO public.modules (name, slug, description, icon, route, "order")
VALUES (
  'Mi Cuenta',
  'mi-cuenta',
  'Gestión de datos personales y suscripción',
  'UserCircle',
  '/mi-cuenta',
  11
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Asignar módulo a roles de clientes
-- Monotributista
INSERT INTO public.role_default_modules (role_id, module_id)
SELECT r.id, m.id
FROM public.roles r, public.modules m
WHERE r.name = 'monotributista'
  AND m.slug = 'mi-cuenta'
ON CONFLICT DO NOTHING;

-- Responsable Inscripto
INSERT INTO public.role_default_modules (role_id, module_id)
SELECT r.id, m.id
FROM public.roles r, public.modules m
WHERE r.name = 'responsable_inscripto'
  AND m.slug = 'mi-cuenta'
ON CONFLICT DO NOTHING;
