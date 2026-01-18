-- =============================================
-- Modulo: Finanzas Personales (Mis Finanzas)
-- Fecha: 2026-01-17
-- Descripcion: Sistema de administracion de finanzas personales
-- Privacidad: 100% personal - el estudio NO puede ver datos
-- =============================================

-- =============================================
-- 1. TABLA: fp_categorias
-- Categorias de gastos (sistema + personalizadas)
-- =============================================
CREATE TABLE IF NOT EXISTS public.fp_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    -- NULL = categoria del sistema, NOT NULL = personalizada
    nombre VARCHAR(50) NOT NULL,
    emoji VARCHAR(10),
    color VARCHAR(20) DEFAULT 'gray',
    es_sistema BOOLEAN DEFAULT false,
    orden INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para busquedas
CREATE INDEX IF NOT EXISTS idx_fp_categorias_user ON fp_categorias(user_id);
CREATE INDEX IF NOT EXISTS idx_fp_categorias_sistema ON fp_categorias(es_sistema);

COMMENT ON TABLE public.fp_categorias IS 'Categorias de gastos para finanzas personales';
COMMENT ON COLUMN public.fp_categorias.user_id IS 'NULL para categorias del sistema';
COMMENT ON COLUMN public.fp_categorias.es_sistema IS 'true = categoria predefinida, false = personalizada';

-- =============================================
-- 2. SEED: Categorias del sistema (11 predefinidas)
-- =============================================
INSERT INTO public.fp_categorias (user_id, nombre, emoji, color, es_sistema, orden) VALUES
(NULL, 'Hogar', '🏠', 'blue', true, 1),
(NULL, 'Comidas', '🍔', 'orange', true, 2),
(NULL, 'Transporte', '🚗', 'cyan', true, 3),
(NULL, 'Salud', '💊', 'red', true, 4),
(NULL, 'Educacion', '📚', 'indigo', true, 5),
(NULL, 'Ocio', '🎉', 'pink', true, 6),
(NULL, 'Compras', '🛍️', 'purple', true, 7),
(NULL, 'Trabajo', '💼', 'slate', true, 8),
(NULL, 'Monotributo', '📋', 'violet', true, 9),
(NULL, 'Alquiler y Servicios', '🏢', 'emerald', true, 10),
(NULL, 'Suscripciones', '📺', 'amber', true, 11)
ON CONFLICT DO NOTHING;

-- =============================================
-- 3. TABLA: fp_gastos_recurrentes
-- Plantillas de gastos que se repiten cada mes
-- =============================================
CREATE TABLE IF NOT EXISTS public.fp_gastos_recurrentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
    categoria_id UUID NOT NULL REFERENCES public.fp_categorias(id),
    descripcion VARCHAR(100) NOT NULL,
    metodo_pago VARCHAR(20) NOT NULL DEFAULT 'debito'
        CHECK (metodo_pago IN ('efectivo', 'debito', 'credito', 'transferencia')),
    dia_del_mes INT CHECK (dia_del_mes BETWEEN 1 AND 31),
    es_compartido BOOLEAN DEFAULT false,
    monto_real DECIMAL(12,2),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fp_recurrentes_user ON fp_gastos_recurrentes(user_id);
CREATE INDEX IF NOT EXISTS idx_fp_recurrentes_activo ON fp_gastos_recurrentes(user_id, activo);

COMMENT ON TABLE public.fp_gastos_recurrentes IS 'Plantillas de gastos recurrentes mensuales';

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_fp_recurrentes_updated ON public.fp_gastos_recurrentes;
CREATE TRIGGER trigger_fp_recurrentes_updated
    BEFORE UPDATE ON public.fp_gastos_recurrentes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 4. TABLA: fp_gastos
-- Gastos registrados por el usuario
-- =============================================
CREATE TABLE IF NOT EXISTS public.fp_gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
    categoria_id UUID NOT NULL REFERENCES public.fp_categorias(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    nota VARCHAR(200),
    metodo_pago VARCHAR(20) NOT NULL DEFAULT 'efectivo'
        CHECK (metodo_pago IN ('efectivo', 'debito', 'credito', 'transferencia')),
    es_compartido BOOLEAN DEFAULT false,
    monto_real DECIMAL(12,2), -- si es compartido, cuanto es tuyo
    recurrente_id UUID REFERENCES public.fp_gastos_recurrentes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para queries comunes
CREATE INDEX IF NOT EXISTS idx_fp_gastos_user ON fp_gastos(user_id);
CREATE INDEX IF NOT EXISTS idx_fp_gastos_user_fecha ON fp_gastos(user_id, fecha);
CREATE INDEX IF NOT EXISTS idx_fp_gastos_user_categoria ON fp_gastos(user_id, categoria_id);
CREATE INDEX IF NOT EXISTS idx_fp_gastos_fecha ON fp_gastos(fecha);

COMMENT ON TABLE public.fp_gastos IS 'Gastos registrados por usuarios';
COMMENT ON COLUMN public.fp_gastos.monto_real IS 'Si es_compartido=true, cuanto corresponde al usuario';

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_fp_gastos_updated ON public.fp_gastos;
CREATE TRIGGER trigger_fp_gastos_updated
    BEFORE UPDATE ON public.fp_gastos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. TABLA: fp_ingresos
-- Ingresos mensuales del usuario
-- =============================================
CREATE TABLE IF NOT EXISTS public.fp_ingresos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mes DATE NOT NULL, -- primer dia del mes (ej: 2026-01-01)
    ingreso_principal DECIMAL(12,2) DEFAULT 0,
    otros_ingresos DECIMAL(12,2) DEFAULT 0,
    ingresos_extra DECIMAL(12,2) DEFAULT 0,
    objetivo_ahorro_porcentaje INT DEFAULT 0 CHECK (objetivo_ahorro_porcentaje BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, mes)
);

CREATE INDEX IF NOT EXISTS idx_fp_ingresos_user ON fp_ingresos(user_id);
CREATE INDEX IF NOT EXISTS idx_fp_ingresos_user_mes ON fp_ingresos(user_id, mes);

COMMENT ON TABLE public.fp_ingresos IS 'Ingresos mensuales para calcular ahorro';

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_fp_ingresos_updated ON public.fp_ingresos;
CREATE TRIGGER trigger_fp_ingresos_updated
    BEFORE UPDATE ON public.fp_ingresos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. TABLA: fp_presupuestos
-- Limites de gasto por categoria
-- =============================================
CREATE TABLE IF NOT EXISTS public.fp_presupuestos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES public.fp_categorias(id),
    monto_limite DECIMAL(12,2) NOT NULL CHECK (monto_limite > 0),
    mes DATE NOT NULL, -- primer dia del mes
    alerta_80 BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, categoria_id, mes)
);

CREATE INDEX IF NOT EXISTS idx_fp_presupuestos_user ON fp_presupuestos(user_id);
CREATE INDEX IF NOT EXISTS idx_fp_presupuestos_user_mes ON fp_presupuestos(user_id, mes);

COMMENT ON TABLE public.fp_presupuestos IS 'Presupuestos mensuales por categoria';

-- =============================================
-- 7. RLS POLICIES - Privacidad Total
-- Cada usuario solo ve sus propios datos
-- =============================================

-- fp_categorias: sistema visible para todos, personalizadas solo dueno
ALTER TABLE public.fp_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fp_categorias_select" ON public.fp_categorias
    FOR SELECT TO authenticated
    USING (es_sistema = true OR user_id = auth.uid());

CREATE POLICY "fp_categorias_insert" ON public.fp_categorias
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() AND es_sistema = false);

CREATE POLICY "fp_categorias_update" ON public.fp_categorias
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() AND es_sistema = false)
    WITH CHECK (user_id = auth.uid() AND es_sistema = false);

CREATE POLICY "fp_categorias_delete" ON public.fp_categorias
    FOR DELETE TO authenticated
    USING (user_id = auth.uid() AND es_sistema = false);

-- fp_gastos: solo el dueno
ALTER TABLE public.fp_gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fp_gastos_all" ON public.fp_gastos
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- fp_gastos_recurrentes: solo el dueno
ALTER TABLE public.fp_gastos_recurrentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fp_recurrentes_all" ON public.fp_gastos_recurrentes
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- fp_ingresos: solo el dueno
ALTER TABLE public.fp_ingresos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fp_ingresos_all" ON public.fp_ingresos
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- fp_presupuestos: solo el dueno
ALTER TABLE public.fp_presupuestos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fp_presupuestos_all" ON public.fp_presupuestos
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================
-- 8. INSERTAR MODULO EN EL SIDEBAR
-- Dentro de Herramientas
-- =============================================

-- Primero asegurar que existe Herramientas
INSERT INTO public.modules (name, slug, description, icon, route, parent_id, "order", is_active)
VALUES ('Herramientas', 'herramientas', 'Herramientas utiles', 'Calculator', '/herramientas', NULL, 8, true)
ON CONFLICT (slug) DO NOTHING;

-- Insertar Mis Finanzas como hijo de Herramientas
INSERT INTO public.modules (name, slug, description, icon, route, parent_id, "order", is_active)
SELECT
    'Mis Finanzas',
    'mis-finanzas',
    'Administrador de finanzas personales',
    'Wallet',
    '/herramientas/mis-finanzas',
    id,
    1,
    true
FROM public.modules
WHERE slug = 'herramientas'
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 9. ASIGNAR MODULO A ROLES
-- Todos excepto operador_gastos
-- =============================================

-- Asignar el modulo padre (Herramientas) a los roles que no lo tienen
INSERT INTO public.role_default_modules (role_id, module_id)
SELECT r.id, m.id
FROM public.roles r
CROSS JOIN public.modules m
WHERE m.slug = 'herramientas'
AND r.name IN ('admin', 'contadora_principal', 'contador_secundario', 'monotributista', 'responsable_inscripto', 'comunicadora', 'desarrollo')
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Asignar el submodulo (Mis Finanzas) a los mismos roles
INSERT INTO public.role_default_modules (role_id, module_id)
SELECT r.id, m.id
FROM public.roles r
CROSS JOIN public.modules m
WHERE m.slug = 'mis-finanzas'
AND r.name IN ('admin', 'contadora_principal', 'contador_secundario', 'monotributista', 'responsable_inscripto', 'comunicadora', 'desarrollo')
ON CONFLICT (role_id, module_id) DO NOTHING;

-- =============================================
-- 10. FUNCIONES HELPER (opcional)
-- =============================================

-- Funcion para obtener el primer dia del mes actual
CREATE OR REPLACE FUNCTION public.fp_primer_dia_mes(fecha DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
    RETURN DATE_TRUNC('month', fecha)::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funcion para obtener gastos del mes agrupados por categoria
CREATE OR REPLACE FUNCTION public.fp_gastos_por_categoria(
    p_user_id UUID,
    p_mes DATE DEFAULT NULL
)
RETURNS TABLE (
    categoria_id UUID,
    categoria_nombre VARCHAR,
    categoria_emoji VARCHAR,
    categoria_color VARCHAR,
    total DECIMAL,
    cantidad BIGINT
) AS $$
DECLARE
    v_mes DATE;
BEGIN
    v_mes := COALESCE(p_mes, DATE_TRUNC('month', CURRENT_DATE)::DATE);

    RETURN QUERY
    SELECT
        c.id as categoria_id,
        c.nombre as categoria_nombre,
        c.emoji as categoria_emoji,
        c.color as categoria_color,
        COALESCE(SUM(COALESCE(g.monto_real, g.monto)), 0) as total,
        COUNT(g.id) as cantidad
    FROM public.fp_categorias c
    LEFT JOIN public.fp_gastos g ON g.categoria_id = c.id
        AND g.user_id = p_user_id
        AND DATE_TRUNC('month', g.fecha)::DATE = v_mes
    WHERE (c.es_sistema = true OR c.user_id = p_user_id)
        AND c.is_active = true
    GROUP BY c.id, c.nombre, c.emoji, c.color, c.orden
    HAVING COUNT(g.id) > 0
    ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.fp_gastos_por_categoria IS 'Obtiene gastos agrupados por categoria para un mes';
