-- Corregir función caja_arqueos_del_dia - usar nombre y apellido en lugar de nombre_completo
DROP FUNCTION IF EXISTS public.caja_arqueos_del_dia(UUID, DATE);

CREATE OR REPLACE FUNCTION public.caja_arqueos_del_dia(
    p_user_id UUID,
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    id UUID,
    hora TIME,
    efectivo_esperado DECIMAL,
    efectivo_real DECIMAL,
    diferencia DECIMAL,
    motivo_diferencia VARCHAR,
    notas VARCHAR,
    created_at TIMESTAMPTZ,
    created_by_id UUID,
    creador_nombre TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.hora,
        a.efectivo_esperado,
        a.efectivo_real,
        a.diferencia,
        a.motivo_diferencia,
        a.notas,
        a.created_at,
        a.created_by_id,
        COALESCE(
            TRIM(p.nombre || ' ' || COALESCE(p.apellido, '')),
            split_part((SELECT email FROM auth.users WHERE id = a.created_by_id), '@', 1),
            'Usuario'
        )::TEXT as creador_nombre
    FROM public.caja_arqueos a
    LEFT JOIN public.profiles p ON p.id = a.created_by_id
    WHERE a.user_id = p_user_id
    AND a.fecha = p_fecha
    ORDER BY a.hora DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
