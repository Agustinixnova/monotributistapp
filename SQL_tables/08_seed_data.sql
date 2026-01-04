-- =============================================
-- Seed Data: Datos iniciales del sistema
-- =============================================

-- ROLES INICIALES
-- is_system = TRUE significa que no pueden ser eliminados

INSERT INTO public.roles (name, display_name, description, is_system) VALUES
    ('admin', 'Administrador', 'Acceso total al sistema', TRUE),
    ('contadora_principal', 'Contadora Principal', 'Gestión completa de clientes', TRUE),
    ('contador_secundario', 'Contador Secundario', 'Solo sus clientes asignados', TRUE),
    ('monotributista', 'Monotributista', 'Cliente monotributista', TRUE),
    ('responsable_inscripto', 'Responsable Inscripto', 'Cliente RI', TRUE),
    ('operador_gastos', 'Operador de Gastos', 'Solo módulo gastos', TRUE);

-- MÓDULOS INICIALES
-- icon = nombre del icono de Lucide React

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
    ('Configuración', 'configuracion', 'Configuración del sistema', 'Settings', '/configuracion', 10);

-- ASIGNACIÓN DE MÓDULOS POR ROL
-- Ver archivo 03_role_default_modules.sql para estructura
-- Las asignaciones se hacen por queries dinámicos (ver migración seed_data)
