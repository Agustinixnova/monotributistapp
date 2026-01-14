-- =============================================
-- MIGRACIÓN: Campos fiscales adicionales para Monotributo
-- =============================================

-- 1. Agregar campos fiscales importantes
ALTER TABLE public.client_fiscal_data
ADD COLUMN IF NOT EXISTS fecha_alta_monotributo DATE,
ADD COLUMN IF NOT EXISTS fecha_ultima_recategorizacion DATE,
ADD COLUMN IF NOT EXISTS codigo_actividad_afip VARCHAR(10),
ADD COLUMN IF NOT EXISTS descripcion_actividad_afip TEXT,
ADD COLUMN IF NOT EXISTS punto_venta_afip INTEGER,
ADD COLUMN IF NOT EXISTS numero_iibb VARCHAR(30),
ADD COLUMN IF NOT EXISTS regimen_iibb VARCHAR(50),
ADD COLUMN IF NOT EXISTS gestion_facturacion VARCHAR(20) DEFAULT 'contadora';

-- 2. Comentarios descriptivos
COMMENT ON COLUMN public.client_fiscal_data.fecha_alta_monotributo IS 'Fecha de inscripcion en el Regimen Simplificado';
COMMENT ON COLUMN public.client_fiscal_data.fecha_ultima_recategorizacion IS 'Fecha de la ultima recategorizacion realizada';
COMMENT ON COLUMN public.client_fiscal_data.codigo_actividad_afip IS 'Codigo de actividad principal declarada en AFIP';
COMMENT ON COLUMN public.client_fiscal_data.descripcion_actividad_afip IS 'Descripcion de la actividad principal';
COMMENT ON COLUMN public.client_fiscal_data.punto_venta_afip IS 'Numero de punto de venta habilitado para facturacion electronica';
COMMENT ON COLUMN public.client_fiscal_data.numero_iibb IS 'Numero de inscripcion en Ingresos Brutos';
COMMENT ON COLUMN public.client_fiscal_data.regimen_iibb IS 'Regimen de IIBB: local, convenio_multilateral, simplificado, exento';
COMMENT ON COLUMN public.client_fiscal_data.gestion_facturacion IS 'Tipo de gestion de facturacion: contadora (por defecto) o autonomo (cliente carga sus propias facturas)';

-- 3. Check constraints
ALTER TABLE public.client_fiscal_data
ADD CONSTRAINT check_regimen_iibb
CHECK (regimen_iibb IS NULL OR regimen_iibb IN ('local', 'convenio_multilateral', 'simplificado', 'exento', 'no_inscripto'));

ALTER TABLE public.client_fiscal_data
ADD CONSTRAINT check_gestion_facturacion
CHECK (gestion_facturacion IN ('contadora', 'autonomo'));
