-- =============================================
-- Modulo: Educacion Impositiva Simple
-- Descripcion: Base de conocimiento para clientes
-- Fecha: 07-01-2026
-- Timezone: UTC-3 (Argentina)
-- =============================================

-- =============================================
-- 1. TABLA DE CATEGORIAS
-- =============================================
CREATE TABLE IF NOT EXISTS public.educacion_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(50) DEFAULT 'BookOpen',
    color VARCHAR(20) DEFAULT 'violet',
    orden INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')
);

-- Indice para ordenamiento
CREATE INDEX IF NOT EXISTS idx_educacion_categorias_orden ON public.educacion_categorias(orden);

-- =============================================
-- 2. TABLA DE ARTICULOS
-- =============================================
CREATE TABLE IF NOT EXISTS public.educacion_articulos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Contenido
    titulo VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    resumen TEXT,
    contenido JSONB NOT NULL,

    -- Organizacion
    categoria_id UUID REFERENCES public.educacion_categorias(id) ON DELETE SET NULL,
    orden INT DEFAULT 0,

    -- Estado
    estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicado')),
    destacado BOOLEAN DEFAULT FALSE,

    -- Metadata
    creado_por UUID NOT NULL REFERENCES public.profiles(id),
    actualizado_por UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires'),
    published_at TIMESTAMPTZ
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_educacion_articulos_categoria ON public.educacion_articulos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_educacion_articulos_estado ON public.educacion_articulos(estado);
CREATE INDEX IF NOT EXISTS idx_educacion_articulos_orden ON public.educacion_articulos(orden);
CREATE INDEX IF NOT EXISTS idx_educacion_articulos_destacado ON public.educacion_articulos(destacado);
CREATE INDEX IF NOT EXISTS idx_educacion_articulos_slug ON public.educacion_articulos(slug);

-- Busqueda full-text
CREATE INDEX IF NOT EXISTS idx_educacion_articulos_busqueda ON public.educacion_articulos
    USING GIN (to_tsvector('spanish', titulo || ' ' || COALESCE(resumen, '')));

-- =============================================
-- 3. TABLA DE ADJUNTOS
-- =============================================
CREATE TABLE IF NOT EXISTS public.educacion_adjuntos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    articulo_id UUID REFERENCES public.educacion_articulos(id) ON DELETE CASCADE,

    -- Info del archivo
    nombre VARCHAR(255) NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    path TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100),
    tamanio INT,

    -- Metadata
    subido_por UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')
);

CREATE INDEX IF NOT EXISTS idx_educacion_adjuntos_articulo ON public.educacion_adjuntos(articulo_id);

-- =============================================
-- 4. FUNCION PARA GENERAR SLUG
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_educacion_slug(titulo TEXT)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
    counter INT := 0;
    final_slug TEXT;
BEGIN
    -- Convertir a minusculas y reemplazar caracteres especiales
    slug := lower(titulo);
    slug := regexp_replace(slug, '[áàäâ]', 'a', 'g');
    slug := regexp_replace(slug, '[éèëê]', 'e', 'g');
    slug := regexp_replace(slug, '[íìïî]', 'i', 'g');
    slug := regexp_replace(slug, '[óòöô]', 'o', 'g');
    slug := regexp_replace(slug, '[úùüû]', 'u', 'g');
    slug := regexp_replace(slug, '[ñ]', 'n', 'g');
    slug := regexp_replace(slug, '[¿?¡!]', '', 'g');
    slug := regexp_replace(slug, '[^a-z0-9\s-]', '', 'g');
    slug := regexp_replace(slug, '\s+', '-', 'g');
    slug := regexp_replace(slug, '-+', '-', 'g');
    slug := trim(both '-' from slug);

    final_slug := slug;

    -- Verificar unicidad
    WHILE EXISTS (SELECT 1 FROM public.educacion_articulos WHERE educacion_articulos.slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := slug || '-' || counter;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. TRIGGER PARA AUTO-GENERAR SLUG
-- =============================================
CREATE OR REPLACE FUNCTION public.educacion_articulo_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Generar slug si no se proporciona
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := public.generate_educacion_slug(NEW.titulo);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_educacion_articulo_slug ON public.educacion_articulos;
CREATE TRIGGER trg_educacion_articulo_slug
    BEFORE INSERT ON public.educacion_articulos
    FOR EACH ROW
    EXECUTE FUNCTION public.educacion_articulo_before_insert();

-- =============================================
-- 6. TRIGGER PARA ACTUALIZAR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_educacion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_educacion_articulos_updated ON public.educacion_articulos;
CREATE TRIGGER trg_educacion_articulos_updated
    BEFORE UPDATE ON public.educacion_articulos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_educacion_updated_at();

DROP TRIGGER IF EXISTS trg_educacion_categorias_updated ON public.educacion_categorias;
CREATE TRIGGER trg_educacion_categorias_updated
    BEFORE UPDATE ON public.educacion_categorias
    FOR EACH ROW
    EXECUTE FUNCTION public.update_educacion_updated_at();

-- =============================================
-- 7. FUNCION HELPER: Puede editar educacion?
-- =============================================
CREATE OR REPLACE FUNCTION public.puede_editar_educacion()
RETURNS BOOLEAN AS $$
    SELECT public.get_user_role() IN ('admin', 'contadora_principal', 'comunicadora', 'desarrollo')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- 8. RLS POLICIES - CATEGORIAS
-- =============================================
ALTER TABLE public.educacion_categorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "educacion_categorias_select" ON public.educacion_categorias;
CREATE POLICY "educacion_categorias_select" ON public.educacion_categorias
    FOR SELECT TO authenticated
    USING (is_active = true OR public.puede_editar_educacion());

DROP POLICY IF EXISTS "educacion_categorias_insert" ON public.educacion_categorias;
CREATE POLICY "educacion_categorias_insert" ON public.educacion_categorias
    FOR INSERT TO authenticated
    WITH CHECK (public.puede_editar_educacion());

DROP POLICY IF EXISTS "educacion_categorias_update" ON public.educacion_categorias;
CREATE POLICY "educacion_categorias_update" ON public.educacion_categorias
    FOR UPDATE TO authenticated
    USING (public.puede_editar_educacion())
    WITH CHECK (public.puede_editar_educacion());

DROP POLICY IF EXISTS "educacion_categorias_delete" ON public.educacion_categorias;
CREATE POLICY "educacion_categorias_delete" ON public.educacion_categorias
    FOR DELETE TO authenticated
    USING (public.puede_editar_educacion());

-- =============================================
-- 9. RLS POLICIES - ARTICULOS
-- =============================================
ALTER TABLE public.educacion_articulos ENABLE ROW LEVEL SECURITY;

-- Lectura: autenticados ven publicados, editores ven todo
DROP POLICY IF EXISTS "educacion_articulos_select" ON public.educacion_articulos;
CREATE POLICY "educacion_articulos_select" ON public.educacion_articulos
    FOR SELECT TO authenticated
    USING (
        estado = 'publicado'
        OR public.puede_editar_educacion()
    );

DROP POLICY IF EXISTS "educacion_articulos_insert" ON public.educacion_articulos;
CREATE POLICY "educacion_articulos_insert" ON public.educacion_articulos
    FOR INSERT TO authenticated
    WITH CHECK (public.puede_editar_educacion());

DROP POLICY IF EXISTS "educacion_articulos_update" ON public.educacion_articulos;
CREATE POLICY "educacion_articulos_update" ON public.educacion_articulos
    FOR UPDATE TO authenticated
    USING (public.puede_editar_educacion())
    WITH CHECK (public.puede_editar_educacion());

DROP POLICY IF EXISTS "educacion_articulos_delete" ON public.educacion_articulos;
CREATE POLICY "educacion_articulos_delete" ON public.educacion_articulos
    FOR DELETE TO authenticated
    USING (public.puede_editar_educacion());

-- =============================================
-- 10. RLS POLICIES - ADJUNTOS
-- =============================================
ALTER TABLE public.educacion_adjuntos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "educacion_adjuntos_select" ON public.educacion_adjuntos;
CREATE POLICY "educacion_adjuntos_select" ON public.educacion_adjuntos
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "educacion_adjuntos_insert" ON public.educacion_adjuntos;
CREATE POLICY "educacion_adjuntos_insert" ON public.educacion_adjuntos
    FOR INSERT TO authenticated
    WITH CHECK (public.puede_editar_educacion());

DROP POLICY IF EXISTS "educacion_adjuntos_update" ON public.educacion_adjuntos;
CREATE POLICY "educacion_adjuntos_update" ON public.educacion_adjuntos
    FOR UPDATE TO authenticated
    USING (public.puede_editar_educacion());

DROP POLICY IF EXISTS "educacion_adjuntos_delete" ON public.educacion_adjuntos;
CREATE POLICY "educacion_adjuntos_delete" ON public.educacion_adjuntos
    FOR DELETE TO authenticated
    USING (public.puede_editar_educacion());

-- =============================================
-- 11. STORAGE BUCKET (ejecutar manualmente si no existe)
-- =============================================
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--     'educacion-impositiva',
--     'educacion-impositiva',
--     true,
--     10485760,
--     ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
-- ) ON CONFLICT (id) DO NOTHING;

-- Politicas de Storage
DROP POLICY IF EXISTS "educacion_storage_select" ON storage.objects;
CREATE POLICY "educacion_storage_select" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'educacion-impositiva');

DROP POLICY IF EXISTS "educacion_storage_insert" ON storage.objects;
CREATE POLICY "educacion_storage_insert" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'educacion-impositiva'
        AND public.puede_editar_educacion()
    );

DROP POLICY IF EXISTS "educacion_storage_delete" ON storage.objects;
CREATE POLICY "educacion_storage_delete" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'educacion-impositiva'
        AND public.puede_editar_educacion()
    );

-- =============================================
-- 12. MODULO EN SIDEBAR
-- =============================================
INSERT INTO public.modules (name, slug, description, icon, route, "order", is_active)
VALUES (
    'Educacion Impositiva',
    'educacion-impositiva',
    'Informacion y guias sobre temas fiscales',
    'GraduationCap',
    '/educacion',
    50,
    true
) ON CONFLICT (slug) DO NOTHING;

-- Asignar a roles que pueden ver
INSERT INTO public.role_default_modules (role_id, module_id)
SELECT r.id, m.id
FROM public.roles r, public.modules m
WHERE m.slug = 'educacion-impositiva'
AND r.name IN ('admin', 'contadora_principal', 'contador_secundario', 'comunicadora', 'desarrollo', 'monotributista', 'responsable_inscripto')
ON CONFLICT DO NOTHING;

-- =============================================
-- 13. DATOS INICIALES - Categorias
-- =============================================
INSERT INTO public.educacion_categorias (nombre, descripcion, icono, color, orden) VALUES
    ('Conceptos Basicos', 'Fundamentos del regimen de Monotributo', 'BookOpen', 'blue', 1),
    ('Facturacion', 'Todo sobre facturar correctamente', 'FileText', 'green', 2),
    ('Limites y Categorias', 'Topes, recategorizacion y exclusiones', 'AlertTriangle', 'amber', 3),
    ('Situaciones Especiales', 'Casos particulares y excepciones', 'HelpCircle', 'purple', 4)
ON CONFLICT DO NOTHING;
