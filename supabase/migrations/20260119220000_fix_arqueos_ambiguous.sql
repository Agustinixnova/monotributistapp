-- Corregir ambigüedad de columna id en función caja_arqueos_del_dia
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
        a.id AS id,
        a.hora AS hora,
        a.efectivo_esperado AS efectivo_esperado,
        a.efectivo_real AS efectivo_real,
        a.diferencia AS diferencia,
        a.motivo_diferencia AS motivo_diferencia,
        a.notas AS notas,
        a.created_at AS created_at,
        a.created_by_id AS created_by_id,
        COALESCE(
            TRIM(p.nombre || ' ' || COALESCE(p.apellido, '')),
            split_part((SELECT u.email FROM auth.users u WHERE u.id = a.created_by_id), '@', 1),
            'Usuario'
        )::TEXT AS creador_nombre
    FROM public.caja_arqueos a
    LEFT JOIN public.profiles p ON p.id = a.created_by_id
    WHERE a.user_id = p_user_id
    AND a.fecha = p_fecha
    ORDER BY a.hora DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
