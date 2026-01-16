-- ============================================
-- MÓDULO: Fix Régimen IIBB
-- Fecha: 2026-01-15
-- Descripción: Corrige los valores permitidos en regimen_iibb
-- para incluir 'local' y 'no_inscripto', y migrar 'general' → 'local'
-- ============================================

-- PASO 1: Eliminar constraint actual
ALTER TABLE public.client_fiscal_data
DROP CONSTRAINT IF EXISTS client_fiscal_data_regimen_iibb_check;

-- PASO 2: Migrar datos existentes 'general' → 'local'
UPDATE public.client_fiscal_data
SET regimen_iibb = 'local'
WHERE regimen_iibb = 'general';

-- PASO 3: Agregar nuevo constraint con todos los valores correctos
ALTER TABLE public.client_fiscal_data
ADD CONSTRAINT client_fiscal_data_regimen_iibb_check
CHECK (regimen_iibb IN ('simplificado', 'local', 'convenio_multilateral', 'exento', 'no_inscripto'));

-- PASO 4: Actualizar comentario de la columna
COMMENT ON COLUMN public.client_fiscal_data.regimen_iibb IS
'Régimen de Ingresos Brutos: simplificado (incluido en monotributo), local (provincial), convenio_multilateral (múltiples provincias), exento (no paga), no_inscripto (irregular)';

-- Verificación
-- SELECT DISTINCT regimen_iibb FROM client_fiscal_data;
