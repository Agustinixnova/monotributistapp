-- =============================================
-- FIX: Corregir funciones de notas internas
-- Usar nombre + apellido en lugar de full_name
-- =============================================

-- 1. Actualizar funcion get_notas_cliente
CREATE OR REPLACE FUNCTION public.get_notas_cliente(p_client_id UUID)
RETURNS TABLE (
    id UUID,
    tipo TEXT,
    contenido TEXT,
    anio INTEGER,
    mes INTEGER,
    fecha_recordatorio DATE,
    recordatorio_completado BOOLEAN,
    created_by UUID,
    created_by_nombre TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.tipo,
        n.contenido,
        n.anio,
        n.mes,
        n.fecha_recordatorio,
        n.recordatorio_completado,
        n.created_by,
        COALESCE(p.nombre || ' ' || p.apellido, p.email) as created_by_nombre,
        n.created_at
    FROM public.client_notas_internas n
    JOIN public.profiles p ON n.created_by = p.id
    WHERE n.client_id = p_client_id
      AND n.archived = FALSE
    ORDER BY
        CASE WHEN n.tipo = 'urgente' THEN 0 ELSE 1 END,
        n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Actualizar funcion get_recordatorios_pendientes
CREATE OR REPLACE FUNCTION public.get_recordatorios_pendientes()
RETURNS TABLE (
    id UUID,
    client_id UUID,
    cliente_nombre TEXT,
    contenido TEXT,
    fecha_recordatorio DATE,
    dias_restantes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.client_id,
        COALESCE(p.nombre || ' ' || p.apellido, c.razon_social) as cliente_nombre,
        n.contenido,
        n.fecha_recordatorio,
        (n.fecha_recordatorio - CURRENT_DATE)::INTEGER as dias_restantes
    FROM public.client_notas_internas n
    JOIN public.client_fiscal_data c ON n.client_id = c.id
    LEFT JOIN public.profiles p ON c.user_id = p.id
    WHERE n.fecha_recordatorio IS NOT NULL
      AND n.recordatorio_completado = FALSE
      AND n.archived = FALSE
      AND n.fecha_recordatorio <= CURRENT_DATE + INTERVAL '30 days'
    ORDER BY n.fecha_recordatorio ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
