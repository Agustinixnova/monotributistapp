-- =============================================
-- Tabla: client_fiscal_data
-- Descripción: Datos fiscales de clientes (monotributistas y RI)
-- =============================================

CREATE TABLE IF NOT EXISTS public.client_fiscal_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    cuit TEXT UNIQUE NOT NULL,
    razon_social TEXT,
    tipo_contribuyente TEXT NOT NULL CHECK (tipo_contribuyente IN ('monotributista', 'responsable_inscripto')),
    categoria_monotributo TEXT CHECK (categoria_monotributo IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K')),
    tipo_actividad TEXT CHECK (tipo_actividad IN ('servicios', 'productos', 'ambos')),
    actividades JSONB DEFAULT '[]'::jsonb,
    fecha_inscripcion_monotributo DATE,
    fecha_inscripcion_arca DATE,
    domicilio_fiscal TEXT,
    codigo_postal TEXT,
    localidad TEXT,
    provincia TEXT,
    obra_social TEXT,
    regimen_iibb TEXT CHECK (regimen_iibb IN ('simplificado', 'general', 'convenio_multilateral', 'exento')),
    numero_iibb TEXT,
    tiene_empleados BOOLEAN DEFAULT FALSE,
    cantidad_empleados INT DEFAULT 0,
    facturador_electronico TEXT CHECK (facturador_electronico IN ('arca', 'facturante', 'otro')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_fiscal_data_user_id ON public.client_fiscal_data(user_id);
CREATE INDEX IF NOT EXISTS idx_client_fiscal_data_cuit ON public.client_fiscal_data(cuit);
CREATE INDEX IF NOT EXISTS idx_client_fiscal_data_tipo_contribuyente ON public.client_fiscal_data(tipo_contribuyente);
CREATE INDEX IF NOT EXISTS idx_client_fiscal_data_categoria ON public.client_fiscal_data(categoria_monotributo);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_client_fiscal_data_updated_at ON public.client_fiscal_data;
CREATE TRIGGER trigger_client_fiscal_data_updated_at
    BEFORE UPDATE ON public.client_fiscal_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE public.client_fiscal_data IS 'Datos fiscales de clientes monotributistas y responsables inscriptos';
COMMENT ON COLUMN public.client_fiscal_data.tipo_contribuyente IS 'monotributista o responsable_inscripto';
COMMENT ON COLUMN public.client_fiscal_data.categoria_monotributo IS 'Categoría del monotributo de A a K';
COMMENT ON COLUMN public.client_fiscal_data.actividades IS 'Array JSON de actividades económicas';
COMMENT ON COLUMN public.client_fiscal_data.regimen_iibb IS 'Régimen de Ingresos Brutos';
