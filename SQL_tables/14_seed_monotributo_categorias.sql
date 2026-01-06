-- =============================================
-- Seed: monotributo_categorias
-- Valores oficiales ARCA vigentes desde Agosto 2025
-- =============================================

-- Primero agregar la columna periodo_id si no existe
ALTER TABLE public.monotributo_categorias
ADD COLUMN IF NOT EXISTS periodo_id UUID;

-- Archivar datos anteriores vigentes
UPDATE public.monotributo_categorias
SET vigente_hasta = '2025-07-31'
WHERE vigente_hasta IS NULL;

-- Limpiar categorias con vigente_hasta NULL para evitar conflictos
DELETE FROM public.monotributo_categorias WHERE vigente_hasta IS NULL;

-- Insertar valores oficiales ARCA agosto 2025
INSERT INTO public.monotributo_categorias (
    categoria,
    tope_facturacion_anual,
    superficie_maxima,
    energia_maxima,
    alquiler_maximo,
    precio_unitario_maximo,
    impuesto_integrado_servicios,
    impuesto_integrado_productos,
    aporte_sipa,
    aporte_obra_social,
    cuota_total_servicios,
    cuota_total_productos,
    vigente_desde,
    vigente_hasta,
    periodo_id
) VALUES
-- Categoria A
('A', 8992597.87, 30, 3330, 2091301.83, 536767.47, 4182.60, 4182.60, 13663.17, 19239.97, 37085.74, 37085.74, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria B
('B', 13175201.52, 45, 5000, 2091301.83, 536767.47, 7946.95, 7946.95, 15029.49, 19239.97, 42216.41, 42216.41, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria C
('C', 18473166.15, 60, 6700, 2858112.50, 536767.47, 13663.17, 12547.81, 16532.44, 19239.97, 49435.58, 48320.22, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria D
('D', 22934610.05, 85, 10000, 2858112.50, 536767.47, 22307.22, 20773.60, 18185.68, 22864.90, 63357.80, 61824.18, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria E
('E', 26977793.60, 110, 13000, 3624923.17, 536767.47, 41826.04, 33181.99, 20004.25, 27884.02, 89714.31, 81070.26, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria F
('F', 33809379.57, 150, 16500, 3624923.17, 536767.47, 58835.29, 43220.24, 22004.67, 32066.63, 112906.59, 97291.54, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria G
('G', 40431835.35, 200, 20000, 4322023.77, 536767.47, 107074.65, 53537.32, 30806.54, 34576.19, 172457.38, 118920.05, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria H
('H', 61344853.64, 200, 20000, 6273905.49, 536767.47, 306724.27, 153362.13, 43129.16, 41547.19, 391400.62, 238038.48, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria I (solo productos)
('I', 68664410.05, 200, 20000, 6273905.49, 536767.47, 609963.03, 243985.21, 60380.82, 51306.61, 721650.46, 355672.64, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria J (solo productos)
('J', 78632948.76, 200, 20000, 6273905.49, 536767.47, 731955.63, 292782.26, 84533.15, 57580.51, 874069.29, 434895.92, '2025-08-01', NULL, gen_random_uuid()),
-- Categoria K (solo productos)
('K', 94805682.90, 200, 20000, 6273905.49, 536767.47, 1024737.89, 341579.30, 118346.41, 65806.30, 1208890.60, 525732.01, '2025-08-01', NULL, gen_random_uuid());

-- =============================================
-- RLS Policies para monotributo_categorias
-- =============================================

-- Habilitar RLS
ALTER TABLE public.monotributo_categorias ENABLE ROW LEVEL SECURITY;

-- Permitir lectura a usuarios autenticados
DROP POLICY IF EXISTS "Users can view monotributo_categorias" ON public.monotributo_categorias;
CREATE POLICY "Users can view monotributo_categorias" ON public.monotributo_categorias
    FOR SELECT USING (auth.role() = 'authenticated');

-- Solo roles especificos pueden modificar
DROP POLICY IF EXISTS "Admins can update monotributo_categorias" ON public.monotributo_categorias;
CREATE POLICY "Admins can update monotributo_categorias" ON public.monotributo_categorias
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'comunicadora', 'desarrollo')
        )
    );

DROP POLICY IF EXISTS "Admins can insert monotributo_categorias" ON public.monotributo_categorias;
CREATE POLICY "Admins can insert monotributo_categorias" ON public.monotributo_categorias
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'contadora_principal', 'comunicadora', 'desarrollo')
        )
    );

-- Verificar datos insertados
SELECT categoria, tope_facturacion_anual, cuota_total_servicios, cuota_total_productos
FROM public.monotributo_categorias
WHERE vigente_hasta IS NULL
ORDER BY categoria;
