-- =============================================
-- Modulo: Panel Economico
-- Fecha: 2026-01-17
-- Descripcion: Registrar modulo Panel Economico en el sidebar
-- =============================================

-- Registrar modulo Panel Economico como hijo de Herramientas
DO $$
DECLARE
    v_herramientas_id UUID;
    v_panel_id UUID;
BEGIN
    -- Obtener ID de Herramientas
    SELECT id INTO v_herramientas_id FROM public.modules WHERE slug = 'herramientas';

    -- Insertar Panel Economico
    INSERT INTO public.modules (name, slug, description, icon, route, parent_id, "order", is_active)
    VALUES (
        'Panel Economico',
        'panel-economico',
        'Cotizaciones, inflacion e indicadores economicos',
        'TrendingUp',
        '/herramientas/panel-economico',
        v_herramientas_id,
        2,
        true
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        route = EXCLUDED.route
    RETURNING id INTO v_panel_id;

    -- Asignar a todos los roles menos operador_gastos
    INSERT INTO public.role_default_modules (role_id, module_id)
    SELECT r.id, v_panel_id
    FROM public.roles r
    WHERE r.name IN ('admin', 'contadora_principal', 'contador_secundario', 'monotributista', 'responsable_inscripto', 'comunicadora', 'desarrollo')
    ON CONFLICT (role_id, module_id) DO NOTHING;

    RAISE NOTICE 'Modulo Panel Economico creado con ID: %', v_panel_id;
END $$;
