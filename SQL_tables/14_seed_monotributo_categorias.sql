-- =============================================
-- Seed: monotributo_categorias
-- Valores vigentes desde Agosto 2025 (aproximados)
-- =============================================

-- Primero agregar la columna periodo_id si no existe
ALTER TABLE public.monotributo_categorias
ADD COLUMN IF NOT EXISTS periodo_id UUID;

-- Limpiar datos existentes (opcional, descomentar si es necesario)
-- DELETE FROM public.monotributo_categorias;

-- Insertar las 11 categorias vigentes
INSERT INTO public.monotributo_categorias (
    categoria,
    tope_facturacion_anual,
    tope_facturacion_servicios,
    cuota_total_servicios,
    cuota_total_productos,
    impuesto_integrado_servicios,
    impuesto_integrado_productos,
    aporte_sipa,
    aporte_obra_social,
    superficie_maxima,
    energia_maxima,
    alquiler_maximo,
    precio_unitario_maximo,
    vigente_desde,
    vigente_hasta,
    periodo_id
) VALUES
-- Categoria A
('A', 8992598, 8992598, 37086, 37086, 4183, 4183, 13663, 19240, 30, 3330, 1128192, NULL, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria B
('B', 13462094, 13462094, 41219, 40680, 8065, 7526, 13663, 19491, 45, 5000, 1128192, NULL, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria C
('C', 18872696, 18872696, 47134, 46024, 14283, 13173, 13663, 19188, 60, 6700, 1128192, NULL, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria D
('D', 23408674, 23408674, 60894, 59140, 24788, 23034, 13663, 22443, 70, 10000, 1128192, NULL, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria E
('E', 27544256, 25928338, 84054, 73941, 37665, 27552, 13663, 32726, 85, 13000, 1692289, NULL, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria F
('F', 34392682, 32363772, 102434, 88168, 49866, 35600, 13663, 38905, 110, 16500, 1692289, NULL, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria G
('G', 41245980, 38836568, 124078, 104761, 65195, 45878, 13663, 45220, 150, 20000, 2115363, NULL, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria H
('H', 51240384, 47310700, 340422, 253792, 211849, 125219, 77661, 50912, 200, 20000, 2679792, NULL, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria I
('I', 57658140, NULL, 415827, NULL, 257413, NULL, 86239, 72175, 200, 20000, 3385577, NULL, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria J
('J', 66460912, NULL, 455628, NULL, 281214, NULL, 94689, 79725, 200, 20000, 4230722, NULL, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria K
('K', 94805683, NULL, 523642, NULL, 325328, NULL, 104068, 94246, 200, 20000, 4230722, 180589, '2025-08-01', NULL, gen_random_uuid())
ON CONFLICT (categoria) DO UPDATE SET
    tope_facturacion_anual = EXCLUDED.tope_facturacion_anual,
    tope_facturacion_servicios = EXCLUDED.tope_facturacion_servicios,
    cuota_total_servicios = EXCLUDED.cuota_total_servicios,
    cuota_total_productos = EXCLUDED.cuota_total_productos,
    impuesto_integrado_servicios = EXCLUDED.impuesto_integrado_servicios,
    impuesto_integrado_productos = EXCLUDED.impuesto_integrado_productos,
    aporte_sipa = EXCLUDED.aporte_sipa,
    aporte_obra_social = EXCLUDED.aporte_obra_social,
    superficie_maxima = EXCLUDED.superficie_maxima,
    energia_maxima = EXCLUDED.energia_maxima,
    alquiler_maximo = EXCLUDED.alquiler_maximo,
    precio_unitario_maximo = EXCLUDED.precio_unitario_maximo,
    vigente_desde = EXCLUDED.vigente_desde,
    vigente_hasta = EXCLUDED.vigente_hasta;

-- =============================================
-- RLS Policies para monotributo_categorias
-- =============================================

-- Habilitar RLS
ALTER TABLE public.monotributo_categorias ENABLE ROW LEVEL SECURITY;

-- Permitir lectura a usuarios autenticados
DROP POLICY IF EXISTS "Users can view monotributo_categorias" ON public.monotributo_categorias;
CREATE POLICY "Users can view monotributo_categorias" ON public.monotributo_categorias
    FOR SELECT USING (auth.role() = 'authenticated');

-- Solo admin y contadora_principal pueden modificar
DROP POLICY IF EXISTS "Admins can update monotributo_categorias" ON public.monotributo_categorias;
CREATE POLICY "Admins can update monotributo_categorias" ON public.monotributo_categorias
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'comunicadora')
        )
    );

DROP POLICY IF EXISTS "Admins can insert monotributo_categorias" ON public.monotributo_categorias;
CREATE POLICY "Admins can insert monotributo_categorias" ON public.monotributo_categorias
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'comunicadora')
        )
    );

-- Verificar datos insertados
SELECT categoria, tope_facturacion_anual, cuota_total_servicios, cuota_total_productos
FROM public.monotributo_categorias
WHERE vigente_hasta IS NULL
ORDER BY categoria;
