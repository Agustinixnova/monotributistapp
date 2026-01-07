-- =============================================
-- CAMPOS ADICIONALES PARA MONOTRIBUTISTAS
-- Informacion util para la contadora
-- =============================================

-- 1. Agregar campos a client_fiscal_data
ALTER TABLE public.client_fiscal_data

-- Situacion especial del cliente
ADD COLUMN IF NOT EXISTS trabaja_relacion_dependencia BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tiene_local BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS alquiler_mensual DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS superficie_local INTEGER,
ADD COLUMN IF NOT EXISTS obra_social TEXT,

-- Pago del monotributo
ADD COLUMN IF NOT EXISTS metodo_pago_monotributo TEXT
    CHECK (metodo_pago_monotributo IS NULL OR metodo_pago_monotributo IN ('debito_automatico', 'vep', 'mercadopago', 'efectivo', 'otro')),
ADD COLUMN IF NOT EXISTS estado_pago_monotributo TEXT DEFAULT 'al_dia'
    CHECK (estado_pago_monotributo IS NULL OR estado_pago_monotributo IN ('al_dia', 'debe_1_cuota', 'debe_2_mas', 'desconocido')),
ADD COLUMN IF NOT EXISTS cbu_debito TEXT,

-- Accesos ARCA
ADD COLUMN IF NOT EXISTS nivel_clave_fiscal INTEGER CHECK (nivel_clave_fiscal IS NULL OR nivel_clave_fiscal BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS servicios_delegados BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fecha_delegacion DATE,
ADD COLUMN IF NOT EXISTS factura_electronica_habilitada BOOLEAN DEFAULT FALSE,

-- Historial de categoria simple (para mostrar en ficha)
ADD COLUMN IF NOT EXISTS categoria_anterior TEXT,
ADD COLUMN IF NOT EXISTS fecha_cambio_categoria DATE,
ADD COLUMN IF NOT EXISTS motivo_cambio_categoria TEXT;

-- 2. Actualizar tabla de historial de categorias con motivos adicionales
-- (la tabla ya existe por migracion anterior, actualizamos el check)
DO $$
BEGIN
    -- Eliminar constraint existente si existe
    ALTER TABLE public.client_historial_categorias
    DROP CONSTRAINT IF EXISTS client_historial_categorias_motivo_check;

    -- Agregar nuevo constraint con mas opciones
    ALTER TABLE public.client_historial_categorias
    ADD CONSTRAINT client_historial_categorias_motivo_check
    CHECK (motivo IS NULL OR motivo IN (
        'alta_inicial',
        'recategorizacion_obligatoria',
        'recategorizacion_voluntaria',
        'exclusion',
        'renuncia',
        'migracion_sistema',
        'alta',
        'recategorizacion',
        'migracion'
    ));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Agregar columna tope_vigente si no existe
ALTER TABLE public.client_historial_categorias
ADD COLUMN IF NOT EXISTS tope_vigente DECIMAL(14,2);

-- 4. Funcion para agregar entrada al historial
CREATE OR REPLACE FUNCTION public.agregar_historial_categoria(
    p_client_id UUID,
    p_categoria TEXT,
    p_fecha_desde DATE,
    p_fecha_hasta DATE DEFAULT NULL,
    p_motivo TEXT DEFAULT 'recategorizacion_obligatoria',
    p_notas TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_tope DECIMAL;
    v_id UUID;
BEGIN
    -- Obtener tope vigente de la categoria
    SELECT tope_facturacion_anual INTO v_tope
    FROM public.monotributo_categorias
    WHERE categoria = p_categoria
    AND vigente_hasta IS NULL
    LIMIT 1;

    -- Cerrar categoria anterior si existe
    UPDATE public.client_historial_categorias
    SET fecha_hasta = p_fecha_desde - INTERVAL '1 day'
    WHERE client_id = p_client_id
    AND fecha_hasta IS NULL;

    -- Insertar nueva entrada
    INSERT INTO public.client_historial_categorias (
        client_id, categoria, fecha_desde, fecha_hasta,
        motivo, tope_vigente, notas, created_by
    )
    VALUES (
        p_client_id, p_categoria, p_fecha_desde, p_fecha_hasta,
        p_motivo, v_tope, p_notas, p_user_id
    )
    RETURNING id INTO v_id;

    -- Actualizar categoria actual en client_fiscal_data si es la actual
    IF p_fecha_hasta IS NULL THEN
        UPDATE public.client_fiscal_data
        SET categoria_monotributo = p_categoria
        WHERE id = p_client_id;
    END IF;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Comentarios
COMMENT ON COLUMN public.client_fiscal_data.trabaja_relacion_dependencia IS 'Si tambien es empleado en relacion de dependencia';
COMMENT ON COLUMN public.client_fiscal_data.metodo_pago_monotributo IS 'Como paga la cuota mensual';
COMMENT ON COLUMN public.client_fiscal_data.servicios_delegados IS 'Si delego servicios de ARCA a la contadora';
COMMENT ON COLUMN public.client_fiscal_data.nivel_clave_fiscal IS 'Nivel de clave fiscal en ARCA (2-5)';
