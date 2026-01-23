-- Insertar módulo Agenda & Turnos en la tabla modules

INSERT INTO public.modules (name, slug, description, icon, route, parent_id, "order", is_active)
VALUES (
  'Agenda & Turnos',
  'agenda_turnos',
  'Gestión de citas, turnos y servicios para micro-emprendedores',
  'Calendar',
  '/herramientas/agenda-turnos',
  (SELECT id FROM public.modules WHERE slug = 'herramientas' LIMIT 1), -- Submódulo de herramientas
  35, -- Después de caja diaria (30)
  TRUE
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  route = EXCLUDED.route,
  parent_id = EXCLUDED.parent_id,
  "order" = EXCLUDED."order",
  is_active = EXCLUDED.is_active;

-- Dar acceso al módulo a los roles correspondientes
-- operador_gastos (usuarios free / dueños)
INSERT INTO public.role_default_modules (role_id, module_id)
SELECT r.id, m.id
FROM public.roles r
CROSS JOIN public.modules m
WHERE r.name = 'operador_gastos'
AND m.slug = 'agenda_turnos'
ON CONFLICT DO NOTHING;

-- operador_gastos_empleado (empleados)
INSERT INTO public.role_default_modules (role_id, module_id)
SELECT r.id, m.id
FROM public.roles r
CROSS JOIN public.modules m
WHERE r.name = 'operador_gastos_empleado'
AND m.slug = 'agenda_turnos'
ON CONFLICT DO NOTHING;

-- desarrollo (para testing)
INSERT INTO public.role_default_modules (role_id, module_id)
SELECT r.id, m.id
FROM public.roles r
CROSS JOIN public.modules m
WHERE r.name = 'desarrollo'
AND m.slug = 'agenda_turnos'
ON CONFLICT DO NOTHING;
