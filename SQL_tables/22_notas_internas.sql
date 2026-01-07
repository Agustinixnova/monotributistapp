-- =============================================
-- NOTAS INTERNAS POR CLIENTE
-- Solo visibles para roles de contadora
-- =============================================

-- 1. Tabla de notas internas
CREATE TABLE IF NOT EXISTS public.client_notas_internas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,

    -- Tipo de nota
    tipo TEXT NOT NULL DEFAULT 'general' CHECK (tipo IN ('general', 'facturacion', 'urgente', 'recordatorio')),

    -- Contenido
    contenido TEXT NOT NULL,

    -- Opcional: asociar a un mes específico
    anio INTEGER,
    mes INTEGER,

    -- Recordatorio (opcional)
    fecha_recordatorio DATE,
    recordatorio_completado BOOLEAN DEFAULT FALSE,

    -- Auditoría
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Soft delete
    archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_notas_client ON public.client_notas_internas(client_id);
CREATE INDEX IF NOT EXISTS idx_notas_tipo ON public.client_notas_internas(tipo);
CREATE INDEX IF NOT EXISTS idx_notas_recordatorio ON public.client_notas_internas(fecha_recordatorio)
    WHERE fecha_recordatorio IS NOT NULL AND recordatorio_completado = FALSE;
CREATE INDEX IF NOT EXISTS idx_notas_archived ON public.client_notas_internas(archived);

-- 3. RLS - Solo roles de contadora pueden ver/editar
ALTER TABLE public.client_notas_internas ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Solo contadoras
CREATE POLICY "notas_internas_select" ON public.client_notas_internas
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

-- Política INSERT: Solo contadoras
CREATE POLICY "notas_internas_insert" ON public.client_notas_internas
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

-- Política UPDATE: Solo contadoras
CREATE POLICY "notas_internas_update" ON public.client_notas_internas
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

-- Política DELETE: Solo contadoras
CREATE POLICY "notas_internas_delete" ON public.client_notas_internas
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
        )
    );

-- 4. Función para obtener notas de un cliente
CREATE OR REPLACE FUNCTION public.get_notas_cliente(p_client_id UUID)
RETURNS TABLE (
    id UUID,
    tipo TEXT,
    contenido TEXT,
    anio INTEGER,
    mes INTEGER,
    fecha_recordatorio DATE,
    recordatorio_completado BOOLEAN,
    created_by UUID,
    created_by_nombre TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.tipo,
        n.contenido,
        n.anio,
        n.mes,
        n.fecha_recordatorio,
        n.recordatorio_completado,
        n.created_by,
        p.full_name as created_by_nombre,
        n.created_at
    FROM public.client_notas_internas n
    JOIN public.profiles p ON n.created_by = p.id
    WHERE n.client_id = p_client_id
      AND n.archived = FALSE
    ORDER BY
        CASE WHEN n.tipo = 'urgente' THEN 0 ELSE 1 END,
        n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Función para obtener recordatorios pendientes
CREATE OR REPLACE FUNCTION public.get_recordatorios_pendientes()
RETURNS TABLE (
    id UUID,
    client_id UUID,
    cliente_nombre TEXT,
    contenido TEXT,
    fecha_recordatorio DATE,
    dias_restantes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.client_id,
        COALESCE(p.full_name, c.razon_social) as cliente_nombre,
        n.contenido,
        n.fecha_recordatorio,
        (n.fecha_recordatorio - CURRENT_DATE)::INTEGER as dias_restantes
    FROM public.client_notas_internas n
    JOIN public.client_fiscal_data c ON n.client_id = c.id
    LEFT JOIN public.profiles p ON c.user_id = p.id
    WHERE n.fecha_recordatorio IS NOT NULL
      AND n.recordatorio_completado = FALSE
      AND n.archived = FALSE
      AND n.fecha_recordatorio <= CURRENT_DATE + INTERVAL '30 days'
    ORDER BY n.fecha_recordatorio ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Comentarios
COMMENT ON TABLE public.client_notas_internas IS 'Notas internas de la contadora sobre clientes - NO visibles para el cliente';
COMMENT ON COLUMN public.client_notas_internas.tipo IS 'general=nota común, facturacion=sobre facturación, urgente=prioridad alta, recordatorio=con fecha';
