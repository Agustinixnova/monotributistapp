-- =============================================
-- Migración: Facturación con múltiples cargas por mes
-- Fecha: 2025-01-06
-- Descripción: Permite múltiples registros de facturación por mes
--              en lugar de un único registro
-- =============================================

-- =============================================
-- PASO 1: Quitar restricción UNIQUE
-- =============================================

ALTER TABLE public.client_facturacion_mensual
DROP CONSTRAINT IF EXISTS client_facturacion_mensual_client_id_anio_mes_key;

-- =============================================
-- PASO 2: Agregar columna fecha_carga
-- =============================================

ALTER TABLE public.client_facturacion_mensual
ADD COLUMN IF NOT EXISTS fecha_carga DATE;

-- Establecer fecha_carga = created_at para registros existentes
UPDATE public.client_facturacion_mensual
SET fecha_carga = created_at::date
WHERE fecha_carga IS NULL;

-- =============================================
-- PASO 3: Renombrar monto_declarado a monto (más claro)
-- =============================================

-- Primero verificar si existe monto_declarado
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'client_facturacion_mensual'
        AND column_name = 'monto_declarado'
    ) THEN
        ALTER TABLE public.client_facturacion_mensual
        RENAME COLUMN monto_declarado TO monto;
    END IF;
END $$;

-- Quitar restricción de monto >= 0 para permitir notas de crédito (valores negativos)
ALTER TABLE public.client_facturacion_mensual
DROP CONSTRAINT IF EXISTS client_facturacion_mensual_monto_declarado_check;

ALTER TABLE public.client_facturacion_mensual
DROP CONSTRAINT IF EXISTS client_facturacion_mensual_monto_check;

-- No agregar constraint, permitir negativos para notas de crédito

-- =============================================
-- PASO 4: Agregar columna nota (descripción de la carga)
-- =============================================

ALTER TABLE public.client_facturacion_mensual
ADD COLUMN IF NOT EXISTS nota TEXT;

-- =============================================
-- PASO 5: Renombrar cantidad_facturas a cantidad_comprobantes
-- =============================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'client_facturacion_mensual'
        AND column_name = 'cantidad_facturas'
    ) THEN
        ALTER TABLE public.client_facturacion_mensual
        RENAME COLUMN cantidad_facturas TO cantidad_comprobantes;
    END IF;
END $$;

-- =============================================
-- PASO 6: Quitar columna monto_ajustado (ya no aplica)
-- =============================================

ALTER TABLE public.client_facturacion_mensual
DROP COLUMN IF EXISTS monto_ajustado;

-- =============================================
-- PASO 7: Simplificar estados
-- Las correcciones ahora son nuevas cargas, no estados
-- =============================================

-- Mantenemos estado_revision para el workflow pero simplificado
-- estado ya no es necesario (borrador/cerrado) - cada carga es definitiva

ALTER TABLE public.client_facturacion_mensual
DROP COLUMN IF EXISTS estado CASCADE;

ALTER TABLE public.client_facturacion_mensual
DROP COLUMN IF EXISTS cerrado_por;

ALTER TABLE public.client_facturacion_mensual
DROP COLUMN IF EXISTS cerrado_at;

-- =============================================
-- PASO 8: Crear índice para búsquedas por mes
-- =============================================

CREATE INDEX IF NOT EXISTS idx_facturacion_mensual_client_periodo
ON public.client_facturacion_mensual(client_id, anio, mes);

CREATE INDEX IF NOT EXISTS idx_facturacion_mensual_fecha_carga
ON public.client_facturacion_mensual(fecha_carga);

-- =============================================
-- PASO 9: Actualizar comentarios
-- =============================================

COMMENT ON TABLE public.client_facturacion_mensual IS 'Registro de cargas de facturación. Múltiples cargas por mes permitidas. El total del mes se calcula sumando todas las cargas.';
COMMENT ON COLUMN public.client_facturacion_mensual.monto IS 'Monto de esta carga. Puede ser negativo para notas de crédito.';
COMMENT ON COLUMN public.client_facturacion_mensual.fecha_carga IS 'Fecha de los comprobantes de esta carga';
COMMENT ON COLUMN public.client_facturacion_mensual.nota IS 'Descripción opcional de la carga';
COMMENT ON COLUMN public.client_facturacion_mensual.cantidad_comprobantes IS 'Cantidad de comprobantes incluidos en esta carga';

-- =============================================
-- PASO 10: Crear vista para totales por mes (útil para consultas)
-- =============================================

CREATE OR REPLACE VIEW public.v_facturacion_mensual_totales AS
SELECT
    client_id,
    anio,
    mes,
    SUM(monto) as total_mes,
    COUNT(*) as cantidad_cargas,
    SUM(cantidad_comprobantes) as total_comprobantes,
    MIN(created_at) as primera_carga,
    MAX(created_at) as ultima_carga
FROM public.client_facturacion_mensual
GROUP BY client_id, anio, mes;

COMMENT ON VIEW public.v_facturacion_mensual_totales IS 'Vista con totales de facturación por mes (suma de todas las cargas)';

-- =============================================
-- PASO 11: Actualizar políticas RLS para DELETE
-- Ahora también clientes autónomos pueden borrar sus propias cargas
-- =============================================

DROP POLICY IF EXISTS "facturacion_mensual_delete_admin" ON public.client_facturacion_mensual;

CREATE POLICY "facturacion_mensual_delete_admin" ON public.client_facturacion_mensual
    FOR DELETE USING (public.is_full_access());

-- Cliente puede borrar sus propias cargas (si es autónomo)
CREATE POLICY "facturacion_mensual_delete_cliente" ON public.client_facturacion_mensual
    FOR DELETE USING (
        public.get_user_role() IN ('monotributista', 'responsable_inscripto')
        AND cargado_por = auth.uid()
        AND client_id IN (
            SELECT id FROM public.client_fiscal_data
            WHERE user_id = auth.uid() AND gestion_facturacion = 'autonomo'
        )
    );

-- =============================================
-- VERIFICACIÓN
-- =============================================
-- Después de esta migración:
-- - Se pueden crear múltiples cargas por mes
-- - El total del mes se calcula sumando todas las cargas
-- - Se soportan notas de crédito (montos negativos)
-- - Cada carga tiene su fecha_carga para trazabilidad
