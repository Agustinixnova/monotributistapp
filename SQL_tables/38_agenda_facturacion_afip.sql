-- =====================================================
-- MIGRACIÓN: Facturación Electrónica AFIP - Módulo Agenda
-- Fecha: 2026-01-29
-- =====================================================
--
-- Permite a usuarios del módulo agenda emitir:
-- - Factura C (código 11)
-- - Nota de Crédito C (código 13)
-- - Nota de Débito C (código 12)
--
-- =====================================================

-- =====================================================
-- 1. TABLA DE CONFIGURACIÓN AFIP POR USUARIO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.agenda_config_afip (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duenio_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Datos fiscales
    cuit VARCHAR(11) NOT NULL,
    razon_social VARCHAR(200) NOT NULL,
    domicilio_fiscal VARCHAR(300),
    condicion_iva VARCHAR(50) DEFAULT 'Monotributista',

    -- Configuración AFIP
    punto_venta INT NOT NULL CHECK (punto_venta > 0 AND punto_venta <= 99999),
    ambiente VARCHAR(20) NOT NULL DEFAULT 'testing' CHECK (ambiente IN ('testing', 'produccion')),

    -- Certificados (almacenados como texto)
    certificado_crt TEXT, -- Contenido del .crt
    clave_privada_key TEXT, -- Contenido del .key (encriptado idealmente)

    -- Token de afipsdk.com (servicio proxy para AFIP)
    afipsdk_token TEXT, -- Token de acceso de afipsdk.com

    -- Estado
    activo BOOLEAN DEFAULT true,
    ultima_verificacion TIMESTAMPTZ,
    ultimo_error TEXT,

    -- Trazabilidad
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),

    -- Un solo registro de config por usuario
    CONSTRAINT unique_config_afip_por_usuario UNIQUE (duenio_id)
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_agenda_config_afip_duenio
ON public.agenda_config_afip(duenio_id);

-- Comentarios
COMMENT ON TABLE public.agenda_config_afip IS
'Configuración de facturación electrónica AFIP por usuario/negocio';

COMMENT ON COLUMN public.agenda_config_afip.ambiente IS
'testing = homologación AFIP, produccion = facturación real';

COMMENT ON COLUMN public.agenda_config_afip.certificado_crt IS
'Contenido del certificado .crt generado en AFIP';

COMMENT ON COLUMN public.agenda_config_afip.clave_privada_key IS
'Contenido de la clave privada .key (IMPORTANTE: encriptar en producción)';

-- =====================================================
-- 2. TABLA DE FACTURAS EMITIDAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.agenda_facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duenio_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Relación con turno (opcional - puede facturarse sin turno)
    turno_id UUID REFERENCES public.agenda_turnos(id) ON DELETE SET NULL,

    -- Datos del comprobante
    tipo_comprobante INT NOT NULL CHECK (tipo_comprobante IN (11, 12, 13)),
    -- 11 = Factura C, 12 = Nota de Débito C, 13 = Nota de Crédito C
    punto_venta INT NOT NULL,
    numero_comprobante BIGINT NOT NULL,

    -- CAE (Código de Autorización Electrónico)
    cae VARCHAR(14) NOT NULL,
    cae_vencimiento DATE NOT NULL,

    -- Datos del receptor
    receptor_tipo_doc INT NOT NULL DEFAULT 99, -- 99=Consumidor Final, 96=DNI, 80=CUIT
    receptor_nro_doc VARCHAR(11),
    receptor_nombre VARCHAR(200),

    -- Importes
    importe_total DECIMAL(12,2) NOT NULL,
    importe_neto DECIMAL(12,2) NOT NULL,

    -- Concepto
    concepto INT NOT NULL DEFAULT 2, -- 1=Productos, 2=Servicios, 3=Ambos

    -- Fechas
    fecha_comprobante DATE NOT NULL,
    fecha_servicio_desde DATE,
    fecha_servicio_hasta DATE,

    -- Comprobante asociado (para NC y ND)
    comprobante_asociado_tipo INT,
    comprobante_asociado_pto_vta INT,
    comprobante_asociado_nro BIGINT,

    -- Descripción/detalle
    descripcion TEXT,

    -- Estado
    estado VARCHAR(20) DEFAULT 'emitida' CHECK (estado IN ('emitida', 'anulada')),

    -- Respuesta completa de AFIP (JSON)
    afip_response JSONB,

    -- Trazabilidad
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Constraint único para evitar duplicados
    CONSTRAINT unique_comprobante UNIQUE (duenio_id, tipo_comprobante, punto_venta, numero_comprobante)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_agenda_facturas_duenio
ON public.agenda_facturas(duenio_id);

CREATE INDEX IF NOT EXISTS idx_agenda_facturas_turno
ON public.agenda_facturas(turno_id)
WHERE turno_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_facturas_fecha
ON public.agenda_facturas(duenio_id, fecha_comprobante DESC);

CREATE INDEX IF NOT EXISTS idx_agenda_facturas_cae
ON public.agenda_facturas(cae);

-- Comentarios
COMMENT ON TABLE public.agenda_facturas IS
'Registro de facturas electrónicas emitidas a través de AFIP';

COMMENT ON COLUMN public.agenda_facturas.tipo_comprobante IS
'11=Factura C, 12=Nota Débito C, 13=Nota Crédito C';

COMMENT ON COLUMN public.agenda_facturas.receptor_tipo_doc IS
'99=Consumidor Final, 96=DNI, 80=CUIT';

COMMENT ON COLUMN public.agenda_facturas.concepto IS
'1=Productos, 2=Servicios, 3=Productos y Servicios';

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE public.agenda_config_afip ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_facturas ENABLE ROW LEVEL SECURITY;

-- Políticas para agenda_config_afip
CREATE POLICY "usuarios_ven_su_config_afip" ON public.agenda_config_afip
    FOR SELECT USING (duenio_id = auth.uid());

CREATE POLICY "usuarios_insertan_su_config_afip" ON public.agenda_config_afip
    FOR INSERT WITH CHECK (duenio_id = auth.uid());

CREATE POLICY "usuarios_actualizan_su_config_afip" ON public.agenda_config_afip
    FOR UPDATE USING (duenio_id = auth.uid());

CREATE POLICY "usuarios_eliminan_su_config_afip" ON public.agenda_config_afip
    FOR DELETE USING (duenio_id = auth.uid());

-- Políticas para agenda_facturas
CREATE POLICY "usuarios_ven_sus_facturas" ON public.agenda_facturas
    FOR SELECT USING (duenio_id = auth.uid());

CREATE POLICY "usuarios_insertan_sus_facturas" ON public.agenda_facturas
    FOR INSERT WITH CHECK (duenio_id = auth.uid());

-- No se permite UPDATE ni DELETE de facturas (son documentos fiscales)

-- =====================================================
-- 4. TRIGGER PARA updated_at
-- =====================================================

DROP TRIGGER IF EXISTS tr_agenda_config_afip_updated ON public.agenda_config_afip;
CREATE TRIGGER tr_agenda_config_afip_updated
    BEFORE UPDATE ON public.agenda_config_afip
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

-- =====================================================
-- 5. FUNCIÓN HELPER: Obtener último número de comprobante
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_ultimo_numero_factura(
    p_duenio_id UUID,
    p_tipo_comprobante INT,
    p_punto_venta INT
)
RETURNS BIGINT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_ultimo BIGINT;
BEGIN
    SELECT COALESCE(MAX(numero_comprobante), 0)
    INTO v_ultimo
    FROM public.agenda_facturas
    WHERE duenio_id = p_duenio_id
      AND tipo_comprobante = p_tipo_comprobante
      AND punto_venta = p_punto_venta;

    RETURN v_ultimo;
END;
$$;

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
