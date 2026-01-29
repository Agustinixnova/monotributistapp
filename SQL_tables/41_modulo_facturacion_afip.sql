-- =====================================================
-- MIGRACIÓN: Módulo Facturación AFIP (Premium)
-- Fecha: 2026-01-29
-- =====================================================
--
-- Crea el módulo de facturación electrónica AFIP como
-- feature premium que se habilita manualmente a usuarios
-- que pagan la suscripción.
--
-- =====================================================

-- 1. Crear el módulo Facturación AFIP
INSERT INTO public.modules (name, slug, description, icon, route, "order", is_active)
VALUES (
    'Facturación AFIP',
    'facturacion-afip',
    'Facturación electrónica AFIP para monotributistas (Premium)',
    'Receipt',
    '/mi-cuenta', -- Se accede desde Mi Cuenta, pestaña Facturación
    99, -- Al final, es un feature premium
    true
)
ON CONFLICT (slug) DO NOTHING;

-- 2. NO se asigna a ningún rol por defecto
-- Se habilita manualmente a usuarios premium via user_module_access

-- Comentario
COMMENT ON TABLE public.modules IS 'Módulos/menú del sistema. facturacion-afip es premium y se habilita manualmente.';

-- =====================================================
-- CÓMO HABILITAR A UN USUARIO PREMIUM
-- =====================================================
--
-- Para habilitar facturación a un usuario:
--
-- INSERT INTO public.user_module_access (user_id, module_id)
-- SELECT
--   'UUID_DEL_USUARIO',
--   id
-- FROM public.modules
-- WHERE slug = 'facturacion-afip';
--
-- Para deshabilitar:
--
-- DELETE FROM public.user_module_access
-- WHERE user_id = 'UUID_DEL_USUARIO'
-- AND module_id = (SELECT id FROM public.modules WHERE slug = 'facturacion-afip');
--
-- =====================================================
