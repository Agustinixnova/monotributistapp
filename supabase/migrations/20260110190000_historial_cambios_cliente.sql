-- =============================================
-- Tabla: historial_cambios_cliente
-- Descripcion: Registro de todos los cambios realizados a datos de clientes
-- =============================================

-- Eliminar tabla anterior de historial de categoria (se unifica aquí)
-- DROP TABLE IF EXISTS public.historial_cambio_categoria;

CREATE TABLE IF NOT EXISTS public.historial_cambios_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Cliente afectado (puede ser user_id o client_fiscal_data_id)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_fiscal_data_id UUID REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,

    -- Tipo de cambio
    tipo_cambio TEXT NOT NULL,
    -- Tipos: 'categoria', 'email', 'telefono', 'password', 'nombre', 'cuit',
    -- 'tipo_actividad', 'regimen_iibb', 'estado', 'contador_asignado', 'otros'

    -- Campo específico modificado
    campo TEXT NOT NULL,

    -- Valores
    valor_anterior TEXT,
    valor_nuevo TEXT,

    -- Contexto adicional (JSON para datos extra)
    metadata JSONB DEFAULT '{}',

    -- Quien y cuando (timestamps en UTC, se muestran en UTC-3)
    realizado_por UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: debe tener al menos uno de los dos IDs
    CONSTRAINT chk_tiene_referencia CHECK (user_id IS NOT NULL OR client_fiscal_data_id IS NOT NULL)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_historial_cambios_user ON public.historial_cambios_cliente(user_id);
CREATE INDEX IF NOT EXISTS idx_historial_cambios_fiscal ON public.historial_cambios_cliente(client_fiscal_data_id);
CREATE INDEX IF NOT EXISTS idx_historial_cambios_fecha ON public.historial_cambios_cliente(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historial_cambios_tipo ON public.historial_cambios_cliente(tipo_cambio);
CREATE INDEX IF NOT EXISTS idx_historial_cambios_realizador ON public.historial_cambios_cliente(realizado_por);

-- RLS
ALTER TABLE public.historial_cambios_cliente ENABLE ROW LEVEL SECURITY;

-- SELECT: Contadores pueden ver historial
DROP POLICY IF EXISTS "historial_cambios_select" ON public.historial_cambios_cliente;
CREATE POLICY "historial_cambios_select" ON public.historial_cambios_cliente
    FOR SELECT USING (public.is_contador());

-- INSERT: Contadores pueden registrar cambios
DROP POLICY IF EXISTS "historial_cambios_insert" ON public.historial_cambios_cliente;
CREATE POLICY "historial_cambios_insert" ON public.historial_cambios_cliente
    FOR INSERT WITH CHECK (public.is_contador());

COMMENT ON TABLE public.historial_cambios_cliente IS 'Historial de todos los cambios realizados a datos de clientes';
COMMENT ON COLUMN public.historial_cambios_cliente.tipo_cambio IS 'Tipo de cambio: categoria, email, telefono, password, nombre, cuit, tipo_actividad, regimen_iibb, estado, contador_asignado, otros';
COMMENT ON COLUMN public.historial_cambios_cliente.metadata IS 'Datos adicionales del cambio en formato JSON';

-- Migrar datos existentes de historial_cambio_categoria si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'historial_cambio_categoria') THEN
        INSERT INTO public.historial_cambios_cliente (
            client_fiscal_data_id,
            tipo_cambio,
            campo,
            valor_anterior,
            valor_nuevo,
            metadata,
            realizado_por,
            created_at
        )
        SELECT
            client_id,
            'categoria',
            'categoria_monotributo',
            categoria_anterior,
            categoria_nueva,
            jsonb_build_object(
                'facturacion_al_momento', facturacion_al_momento,
                'porcentaje_tope_anterior', porcentaje_tope_anterior,
                'porcentaje_tope_nuevo', porcentaje_tope_nuevo
            ),
            realizado_por,
            created_at
        FROM public.historial_cambio_categoria;
    END IF;
END $$;
