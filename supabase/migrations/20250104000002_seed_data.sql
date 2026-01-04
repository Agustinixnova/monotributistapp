-- =============================================
-- Migración: Seed data inicial
-- Fecha: 2025-01-04
-- =============================================

-- ROLES INICIALES
INSERT INTO public.roles (name, display_name, description, is_system) VALUES
    ('admin', 'Administrador', 'Acceso total al sistema', TRUE),
    ('contadora_principal', 'Contadora Principal', 'Gestión completa de clientes', TRUE),
    ('contador_secundario', 'Contador Secundario', 'Solo sus clientes asignados', TRUE),
    ('monotributista', 'Monotributista', 'Cliente monotributista', TRUE),
    ('responsable_inscripto', 'Responsable Inscripto', 'Cliente RI', TRUE),
    ('operador_gastos', 'Operador de Gastos', 'Solo módulo gastos', TRUE)
ON CONFLICT (name) DO NOTHING;

-- MÓDULOS INICIALES
INSERT INTO public.modules (name, slug, description, icon, route, "order") VALUES
    ('Dashboard', 'dashboard', 'Panel principal', 'LayoutDashboard', '/', 1),
    ('Gestión de Usuarios', 'usuarios', 'Administración de usuarios y roles', 'Users', '/usuarios', 2),
    ('Clientes', 'clientes', 'Gestión de clientes', 'Briefcase', '/clientes', 3),
    ('Facturación', 'facturacion', 'Registro de facturación', 'FileText', '/facturacion', 4),
    ('Gastos', 'gastos', 'Registro de gastos', 'Receipt', '/gastos', 5),
    ('Mensajes', 'mensajes', 'Chat y comunicación', 'MessageSquare', '/mensajes', 6),
    ('Notificaciones', 'notificaciones', 'Centro de notificaciones', 'Bell', '/notificaciones', 7),
    ('Biblioteca', 'biblioteca', 'Documentos compartidos', 'BookOpen', '/biblioteca', 8),
    ('Herramientas', 'herramientas', 'Calculadoras y simuladores', 'Calculator', '/herramientas', 9),
    ('Configuración', 'configuracion', 'Configuración del sistema', 'Settings', '/configuracion', 10)
ON CONFLICT (slug) DO NOTHING;

-- ASIGNACIÓN DE MÓDULOS POR ROL

-- Admin: TODOS los módulos
INSERT INTO public.role_default_modules (role_id, module_id)
SELECT r.id, m.id
FROM public.roles r, public.modules m
WHERE r.name = 'admin'
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Contadora Principal: TODOS los módulos
INSERT INTO public.role_default_modules (role_id, module_id)
SELECT r.id, m.id
FROM public.roles r, public.modules m
WHERE r.name = 'contadora_principal'
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Contador Secundario: dashboard, clientes, facturacion, gastos, mensajes, notificaciones, biblioteca, herramientas
INSERT INTO public.role_default_modules (role_id, module_id)
SELECT r.id, m.id
FROM public.roles r, public.modules m
WHERE r.name = 'contador_secundario'
AND m.slug IN ('dashboard', 'clientes', 'facturacion', 'gastos', 'mensajes', 'notificaciones', 'biblioteca', 'herramientas')
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Monotributista: dashboard, facturacion, gastos, mensajes, notificaciones, biblioteca, herramientas
INSERT INTO public.role_default_modules (role_id, module_id)
SELECT r.id, m.id
FROM public.roles r, public.modules m
WHERE r.name = 'monotributista'
AND m.slug IN ('dashboard', 'facturacion', 'gastos', 'mensajes', 'notificaciones', 'biblioteca', 'herramientas')
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Responsable Inscripto: igual que monotributista
INSERT INTO public.role_default_modules (role_id, module_id)
SELECT r.id, m.id
FROM public.roles r, public.modules m
WHERE r.name = 'responsable_inscripto'
AND m.slug IN ('dashboard', 'facturacion', 'gastos', 'mensajes', 'notificaciones', 'biblioteca', 'herramientas')
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Operador de Gastos: dashboard, gastos
INSERT INTO public.role_default_modules (role_id, module_id)
SELECT r.id, m.id
FROM public.roles r, public.modules m
WHERE r.name = 'operador_gastos'
AND m.slug IN ('dashboard', 'gastos')
ON CONFLICT (role_id, module_id) DO NOTHING;
