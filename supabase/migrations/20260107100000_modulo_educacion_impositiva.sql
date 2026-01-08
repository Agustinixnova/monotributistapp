-- Insertar modulo de Educacion Impositiva en sidebar
INSERT INTO public.modules (name, slug, description, icon, route, "order", is_active)
VALUES (
    'Educacion Impositiva',
    'educacion-impositiva',
    'Informacion y guias sobre temas fiscales',
    'GraduationCap',
    '/educacion',
    50,
    true
) ON CONFLICT (slug) DO NOTHING;

-- Asignar a roles que pueden ver
INSERT INTO public.role_default_modules (role_id, module_id)
SELECT r.id, m.id
FROM public.roles r, public.modules m
WHERE m.slug = 'educacion-impositiva'
AND r.name IN ('admin', 'contadora_principal', 'contador_secundario', 'comunicadora', 'desarrollo', 'monotributista', 'responsable_inscripto')
ON CONFLICT DO NOTHING;
