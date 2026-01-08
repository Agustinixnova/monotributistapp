-- =============================================
-- CAMPOS ADICIONALES MONOTRIBUTISTA
-- Obra social ampliada, relacion dependencia, multiples locales
-- =============================================

-- 1. Campos adicionales en client_fiscal_data
ALTER TABLE public.client_fiscal_data

-- Obra social ampliada
ADD COLUMN IF NOT EXISTS obra_social_tipo_cobertura TEXT DEFAULT 'titular'
    CHECK (obra_social_tipo_cobertura IS NULL OR obra_social_tipo_cobertura IN ('titular', 'grupo_familiar')),
ADD COLUMN IF NOT EXISTS obra_social_adicional BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS obra_social_adicional_nombre TEXT,

-- Relacion de dependencia ampliada
ADD COLUMN IF NOT EXISTS empleador_cuit TEXT,
ADD COLUMN IF NOT EXISTS empleador_razon_social TEXT,
ADD COLUMN IF NOT EXISTS sueldo_bruto DECIMAL(12,2);

-- 2. Tabla para grupo familiar de obra social
CREATE TABLE IF NOT EXISTS public.client_grupo_familiar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    dni TEXT,
    parentesco TEXT NOT NULL CHECK (parentesco IN ('conyuge', 'hijo', 'hija', 'concubino', 'concubina', 'otro')),
    fecha_nacimiento DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grupo_familiar_client ON public.client_grupo_familiar(client_id);

-- RLS para grupo familiar
ALTER TABLE public.client_grupo_familiar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grupo_familiar_select" ON public.client_grupo_familiar
    FOR SELECT USING (public.is_contador());

CREATE POLICY "grupo_familiar_insert" ON public.client_grupo_familiar
    FOR INSERT WITH CHECK (public.is_contador());

CREATE POLICY "grupo_familiar_update" ON public.client_grupo_familiar
    FOR UPDATE USING (public.is_contador());

CREATE POLICY "grupo_familiar_delete" ON public.client_grupo_familiar
    FOR DELETE USING (public.is_contador());

-- 3. Tabla para multiples locales
CREATE TABLE IF NOT EXISTS public.client_locales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,
    descripcion TEXT, -- Ej: "Local principal", "Sucursal Centro"
    direccion TEXT,
    alquiler_mensual DECIMAL(12,2),
    superficie_m2 INTEGER,
    es_propio BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locales_client ON public.client_locales(client_id);

-- RLS para locales
ALTER TABLE public.client_locales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locales_select" ON public.client_locales
    FOR SELECT USING (public.is_contador());

CREATE POLICY "locales_insert" ON public.client_locales
    FOR INSERT WITH CHECK (public.is_contador());

CREATE POLICY "locales_update" ON public.client_locales
    FOR UPDATE USING (public.is_contador());

CREATE POLICY "locales_delete" ON public.client_locales
    FOR DELETE USING (public.is_contador());

-- 4. Funcion para obtener totales de locales
CREATE OR REPLACE FUNCTION public.get_totales_locales(p_client_id UUID)
RETURNS TABLE (
    cantidad_locales INTEGER,
    alquiler_total DECIMAL,
    superficie_total INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as cantidad_locales,
        COALESCE(SUM(alquiler_mensual), 0) as alquiler_total,
        COALESCE(SUM(superficie_m2), 0)::INTEGER as superficie_total
    FROM public.client_locales
    WHERE client_id = p_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Comentarios
COMMENT ON TABLE public.client_grupo_familiar IS 'Integrantes del grupo familiar para obra social';
COMMENT ON TABLE public.client_locales IS 'Locales comerciales del monotributista';
COMMENT ON COLUMN public.client_fiscal_data.obra_social_tipo_cobertura IS 'titular=solo el monotributista, grupo_familiar=incluye familiares';
COMMENT ON COLUMN public.client_fiscal_data.obra_social_adicional IS 'Si paga plan superador aparte';
