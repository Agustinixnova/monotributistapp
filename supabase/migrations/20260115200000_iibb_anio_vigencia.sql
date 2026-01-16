-- ============================================
-- Agregar año de vigencia a coeficientes IIBB
-- Fecha: 2026-01-15
-- Descripción: Los coeficientes de CM se calculan anualmente
-- y se mantienen fijos durante todo el año fiscal
-- ============================================

-- Agregar columna para año de vigencia de los coeficientes
ALTER TABLE public.client_iibb_jurisdicciones
ADD COLUMN IF NOT EXISTS anio_vigencia INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

-- Comentario
COMMENT ON COLUMN public.client_iibb_jurisdicciones.anio_vigencia IS 'Año fiscal de vigencia de los coeficientes (se recalculan anualmente)';

-- Índice para búsquedas por año
CREATE INDEX IF NOT EXISTS idx_iibb_jurisd_anio ON public.client_iibb_jurisdicciones(anio_vigencia);

-- Actualizar registros existentes con el año actual
UPDATE public.client_iibb_jurisdicciones
SET anio_vigencia = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE anio_vigencia IS NULL;
