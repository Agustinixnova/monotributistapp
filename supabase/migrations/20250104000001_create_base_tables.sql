-- =============================================
-- Migración: Tablas base del sistema MonoGestión
-- Fecha: 2025-01-04
-- =============================================

-- 1. ROLES
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);

COMMENT ON TABLE public.roles IS 'Roles del sistema para control de acceso';

-- 2. MODULES
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    route TEXT NOT NULL,
    parent_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    "order" INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modules_slug ON public.modules(slug);
CREATE INDEX IF NOT EXISTS idx_modules_parent_id ON public.modules(parent_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON public.modules("order");

COMMENT ON TABLE public.modules IS 'Módulos/menú del sistema';

-- 3. ROLE_DEFAULT_MODULES
CREATE TABLE IF NOT EXISTS public.role_default_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_role_default_modules_role_id ON public.role_default_modules(role_id);
CREATE INDEX IF NOT EXISTS idx_role_default_modules_module_id ON public.role_default_modules(module_id);

COMMENT ON TABLE public.role_default_modules IS 'Módulos por defecto asignados a cada rol';

-- 4. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    telefono TEXT,
    whatsapp TEXT,
    dni TEXT,
    role_id UUID NOT NULL REFERENCES public.roles(id),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    notas_internas TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_to ON public.profiles(assigned_to);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_dni ON public.profiles(dni);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.profiles IS 'Perfiles de usuario extendiendo auth.users';

-- 5. USER_MODULE_ACCESS
CREATE TABLE IF NOT EXISTS public.user_module_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_user_module_access_user_id ON public.user_module_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_access_module_id ON public.user_module_access(module_id);

COMMENT ON TABLE public.user_module_access IS 'Accesos adicionales a módulos por usuario';

-- 6. CLIENT_FISCAL_DATA
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

CREATE INDEX IF NOT EXISTS idx_client_fiscal_data_user_id ON public.client_fiscal_data(user_id);
CREATE INDEX IF NOT EXISTS idx_client_fiscal_data_cuit ON public.client_fiscal_data(cuit);
CREATE INDEX IF NOT EXISTS idx_client_fiscal_data_tipo_contribuyente ON public.client_fiscal_data(tipo_contribuyente);
CREATE INDEX IF NOT EXISTS idx_client_fiscal_data_categoria ON public.client_fiscal_data(categoria_monotributo);

DROP TRIGGER IF EXISTS trigger_client_fiscal_data_updated_at ON public.client_fiscal_data;
CREATE TRIGGER trigger_client_fiscal_data_updated_at
    BEFORE UPDATE ON public.client_fiscal_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.client_fiscal_data IS 'Datos fiscales de clientes monotributistas y RI';

-- 7. MONOTRIBUTO_CATEGORIAS
CREATE TABLE IF NOT EXISTS public.monotributo_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria TEXT UNIQUE NOT NULL CHECK (categoria IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K')),
    tope_facturacion_anual DECIMAL,
    tope_facturacion_servicios DECIMAL,
    cuota_total_servicios DECIMAL,
    cuota_total_productos DECIMAL,
    impuesto_integrado_servicios DECIMAL,
    impuesto_integrado_productos DECIMAL,
    aporte_sipa DECIMAL,
    aporte_obra_social DECIMAL,
    superficie_maxima DECIMAL,
    energia_maxima DECIMAL,
    alquiler_maximo DECIMAL,
    precio_unitario_maximo DECIMAL,
    vigente_desde DATE NOT NULL,
    vigente_hasta DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monotributo_categorias_categoria ON public.monotributo_categorias(categoria);
CREATE INDEX IF NOT EXISTS idx_monotributo_categorias_vigencia ON public.monotributo_categorias(vigente_desde, vigente_hasta);

COMMENT ON TABLE public.monotributo_categorias IS 'Categorías del monotributo argentino con valores y topes';
