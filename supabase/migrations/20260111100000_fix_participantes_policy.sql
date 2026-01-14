-- ========================================
-- FIX: Eliminar política problemática y usar una más simple
-- ========================================

-- Eliminar la política que puede estar causando problemas
DROP POLICY IF EXISTS "participantes_select_misma_conversacion" ON public.buzon_participantes;

-- La política original "participantes_select" ya permite ver las propias participaciones
-- Vamos a crear una función para obtener el estado de lectura de otros participantes
-- que se ejecute con SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.get_estado_lectura_conversacion(p_conversacion_id UUID, p_user_id UUID)
RETURNS TABLE (
    todos_leyeron BOOLEAN,
    cantidad_leyeron INTEGER,
    cantidad_total INTEGER
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(bool_and(bp.leido), false) as todos_leyeron,
        COALESCE(SUM(CASE WHEN bp.leido THEN 1 ELSE 0 END)::INTEGER, 0) as cantidad_leyeron,
        COALESCE(COUNT(*)::INTEGER, 0) as cantidad_total
    FROM buzon_participantes bp
    WHERE bp.conversacion_id = p_conversacion_id
    AND bp.user_id != p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_estado_lectura_conversacion IS 'Obtiene el estado de lectura de otros participantes en una conversación';
