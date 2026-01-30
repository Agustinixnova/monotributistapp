-- =====================================================
-- MIGRACIÓN: Trazabilidad y Mejora de Índices - Caja Diaria
-- Fecha: 2026-01-29
-- =====================================================
--
-- CONVENCIÓN DE NOMENCLATURA:
-- user_id = tenant_id (identificador del negocio/dueño)
--
-- Este campo actúa como tenant_id para multi-tenancy.
-- Se mantiene "user_id" por consistencia con el código existente.
--
-- Diferencia importante:
-- - user_id / tenant_id: dueño del negocio (a quién pertenecen los datos)
-- - created_by_id: quién cargó el registro en el sistema
-- - updated_by_id: quién modificó el registro por última vez
-- =====================================================

-- =====================================================
-- 1. AGREGAR COLUMNAS DE TRAZABILIDAD (updated_by_id)
-- =====================================================

-- caja_movimientos: agregar updated_by_id
ALTER TABLE public.caja_movimientos
ADD COLUMN IF NOT EXISTS updated_by_id UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.caja_movimientos.user_id IS 'Tenant ID - Dueño del negocio al que pertenece el movimiento';
COMMENT ON COLUMN public.caja_movimientos.created_by_id IS 'Usuario que creó el movimiento (puede ser dueño o empleado)';
COMMENT ON COLUMN public.caja_movimientos.updated_by_id IS 'Usuario que modificó el movimiento por última vez';

-- caja_arqueos: agregar updated_by_id
ALTER TABLE public.caja_arqueos
ADD COLUMN IF NOT EXISTS updated_by_id UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.caja_arqueos.user_id IS 'Tenant ID - Dueño del negocio al que pertenece el arqueo';
COMMENT ON COLUMN public.caja_arqueos.created_by_id IS 'Usuario que creó el arqueo (puede ser dueño o empleado)';
COMMENT ON COLUMN public.caja_arqueos.updated_by_id IS 'Usuario que modificó el arqueo por última vez';

-- caja_cierres: agregar updated_by_id
ALTER TABLE public.caja_cierres
ADD COLUMN IF NOT EXISTS updated_by_id UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.caja_cierres.user_id IS 'Tenant ID - Dueño del negocio al que pertenece el cierre';
COMMENT ON COLUMN public.caja_cierres.created_by_id IS 'Usuario que creó el cierre (puede ser dueño o empleado)';
COMMENT ON COLUMN public.caja_cierres.updated_by_id IS 'Usuario que modificó el cierre por última vez';

-- caja_fiados: agregar updated_at y updated_by_id
ALTER TABLE public.caja_fiados
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.caja_fiados
ADD COLUMN IF NOT EXISTS updated_by_id UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.caja_fiados.user_id IS 'Tenant ID - Dueño del negocio al que pertenece el fiado';
COMMENT ON COLUMN public.caja_fiados.created_by_id IS 'Usuario que registró el fiado (puede ser dueño o empleado)';
COMMENT ON COLUMN public.caja_fiados.updated_by_id IS 'Usuario que modificó el fiado por última vez';

-- caja_pagos_fiado: agregar updated_at y updated_by_id
ALTER TABLE public.caja_pagos_fiado
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.caja_pagos_fiado
ADD COLUMN IF NOT EXISTS updated_by_id UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.caja_pagos_fiado.user_id IS 'Tenant ID - Dueño del negocio al que pertenece el pago';
COMMENT ON COLUMN public.caja_pagos_fiado.created_by_id IS 'Usuario que registró el pago (puede ser dueño o empleado)';
COMMENT ON COLUMN public.caja_pagos_fiado.updated_by_id IS 'Usuario que modificó el pago por última vez';

-- caja_clientes_fiado: agregar created_by_id y updated_by_id
ALTER TABLE public.caja_clientes_fiado
ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES auth.users(id);

ALTER TABLE public.caja_clientes_fiado
ADD COLUMN IF NOT EXISTS updated_by_id UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.caja_clientes_fiado.user_id IS 'Tenant ID - Dueño del negocio al que pertenece el cliente';
COMMENT ON COLUMN public.caja_clientes_fiado.created_by_id IS 'Usuario que creó el cliente (puede ser dueño o empleado)';
COMMENT ON COLUMN public.caja_clientes_fiado.updated_by_id IS 'Usuario que modificó el cliente por última vez';

-- =====================================================
-- 2. TRIGGERS PARA updated_by_id AUTOMÁTICO
-- =====================================================

-- Función genérica para setear updated_by_id (específica para caja)
CREATE OR REPLACE FUNCTION public.caja_set_updated_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_by_id = auth.uid();
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en caja_movimientos
DROP TRIGGER IF EXISTS tr_caja_movimientos_updated_by ON public.caja_movimientos;
CREATE TRIGGER tr_caja_movimientos_updated_by
    BEFORE UPDATE ON public.caja_movimientos
    FOR EACH ROW EXECUTE FUNCTION public.caja_set_updated_by();

-- Trigger en caja_arqueos
DROP TRIGGER IF EXISTS tr_caja_arqueos_updated_by ON public.caja_arqueos;
CREATE TRIGGER tr_caja_arqueos_updated_by
    BEFORE UPDATE ON public.caja_arqueos
    FOR EACH ROW EXECUTE FUNCTION public.caja_set_updated_by();

-- Trigger en caja_cierres
DROP TRIGGER IF EXISTS tr_caja_cierres_updated_by ON public.caja_cierres;
CREATE TRIGGER tr_caja_cierres_updated_by
    BEFORE UPDATE ON public.caja_cierres
    FOR EACH ROW EXECUTE FUNCTION public.caja_set_updated_by();

-- Trigger en caja_fiados
DROP TRIGGER IF EXISTS tr_caja_fiados_updated_by ON public.caja_fiados;
CREATE TRIGGER tr_caja_fiados_updated_by
    BEFORE UPDATE ON public.caja_fiados
    FOR EACH ROW EXECUTE FUNCTION public.caja_set_updated_by();

-- Trigger en caja_pagos_fiado
DROP TRIGGER IF EXISTS tr_caja_pagos_fiado_updated_by ON public.caja_pagos_fiado;
CREATE TRIGGER tr_caja_pagos_fiado_updated_by
    BEFORE UPDATE ON public.caja_pagos_fiado
    FOR EACH ROW EXECUTE FUNCTION public.caja_set_updated_by();

-- Trigger en caja_clientes_fiado
DROP TRIGGER IF EXISTS tr_caja_clientes_fiado_updated_by ON public.caja_clientes_fiado;
CREATE TRIGGER tr_caja_clientes_fiado_updated_by
    BEFORE UPDATE ON public.caja_clientes_fiado
    FOR EACH ROW EXECUTE FUNCTION public.caja_set_updated_by();

-- =====================================================
-- 3. MEJORA DE ÍNDICES
-- =====================================================

-- caja_movimientos: índice compuesto para consultas por fecha y tipo (muy común)
DROP INDEX IF EXISTS idx_caja_movimientos_user_fecha_tipo;
CREATE INDEX idx_caja_movimientos_user_fecha_tipo
ON public.caja_movimientos(user_id, fecha DESC, tipo);

-- caja_movimientos: índice para búsquedas por categoría
DROP INDEX IF EXISTS idx_caja_movimientos_user_categoria;
CREATE INDEX idx_caja_movimientos_user_categoria
ON public.caja_movimientos(user_id, categoria_id)
WHERE categoria_id IS NOT NULL;

-- caja_movimientos: índice para movimientos anulados (filtro común)
DROP INDEX IF EXISTS idx_caja_movimientos_user_anulado;
CREATE INDEX idx_caja_movimientos_user_anulado
ON public.caja_movimientos(user_id, anulado)
WHERE anulado = true;

-- caja_cierres: índice para búsqueda por fecha (único por user+fecha)
DROP INDEX IF EXISTS idx_caja_cierres_user_fecha;
CREATE INDEX idx_caja_cierres_user_fecha
ON public.caja_cierres(user_id, fecha DESC);

-- caja_fiados: índice para deudas pendientes (saldado = false)
DROP INDEX IF EXISTS idx_caja_fiados_user_pendientes;
CREATE INDEX idx_caja_fiados_user_pendientes
ON public.caja_fiados(user_id, cliente_id, fecha DESC)
WHERE saldado = false;

-- caja_clientes_fiado: índice para clientes activos con saldo
DROP INDEX IF EXISTS idx_caja_clientes_user_activos;
CREATE INDEX idx_caja_clientes_user_activos
ON public.caja_clientes_fiado(user_id, activo)
WHERE activo = true;

-- =====================================================
-- 4. ACTUALIZAR REGISTROS EXISTENTES (opcional)
-- =====================================================
-- Setear created_by_id = user_id para registros existentes que no tienen created_by_id
-- Esto asume que los registros viejos fueron creados por el dueño

UPDATE public.caja_clientes_fiado
SET created_by_id = user_id
WHERE created_by_id IS NULL;

-- =====================================================
-- 5. DOCUMENTACIÓN EN TABLA DE METADATOS
-- =====================================================

COMMENT ON TABLE public.caja_movimientos IS
'Movimientos de caja (entradas/salidas). user_id actúa como tenant_id para multi-tenancy.';

COMMENT ON TABLE public.caja_arqueos IS
'Arqueos de caja (conteo de efectivo). user_id actúa como tenant_id para multi-tenancy.';

COMMENT ON TABLE public.caja_cierres IS
'Cierres diarios de caja. user_id actúa como tenant_id para multi-tenancy.';

COMMENT ON TABLE public.caja_fiados IS
'Ventas fiadas (deudas de clientes). user_id actúa como tenant_id para multi-tenancy.';

COMMENT ON TABLE public.caja_pagos_fiado IS
'Pagos/cobranzas de fiados. user_id actúa como tenant_id para multi-tenancy.';

COMMENT ON TABLE public.caja_clientes_fiado IS
'Clientes habilitados para comprar fiado. user_id actúa como tenant_id para multi-tenancy.';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
