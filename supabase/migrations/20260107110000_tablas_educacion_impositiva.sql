-- =============================================
-- Modulo: Educacion Impositiva - Tablas
-- =============================================

-- 1. TABLA DE CATEGORIAS
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

CREATE INDEX IF NOT EXISTS idx_educacion_categorias_orden ON public.educacion_categorias(orden);

-- 2. TABLA DE ARTICULOS
CREATE TABLE IF NOT EXISTS public.educacion_articulos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    resumen TEXT,
    contenido JSONB NOT NULL,
    categoria_id UUID REFERENCES public.educacion_categorias(id) ON DELETE SET NULL,
    orden INT DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicado')),
    destacado BOOLEAN DEFAULT FALSE,
    creado_por UUID NOT NULL REFERENCES public.profiles(id),
    actualizado_por UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires'),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_educacion_articulos_categoria ON public.educacion_articulos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_educacion_articulos_estado ON public.educacion_articulos(estado);
CREATE INDEX IF NOT EXISTS idx_educacion_articulos_orden ON public.educacion_articulos(orden);
CREATE INDEX IF NOT EXISTS idx_educacion_articulos_destacado ON public.educacion_articulos(destacado);
CREATE INDEX IF NOT EXISTS idx_educacion_articulos_slug ON public.educacion_articulos(slug);

-- 3. TABLA DE ADJUNTOS
CREATE TABLE IF NOT EXISTS public.educacion_adjuntos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    articulo_id UUID REFERENCES public.educacion_articulos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    path TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100),
    tamanio INT,
    subido_por UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')
);

CREATE INDEX IF NOT EXISTS idx_educacion_adjuntos_articulo ON public.educacion_adjuntos(articulo_id);

-- 4. FUNCION PARA GENERAR SLUG
CREATE OR REPLACE FUNCTION public.generate_educacion_slug(titulo TEXT)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
    counter INT := 0;
    final_slug TEXT;
BEGIN
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

    WHILE EXISTS (SELECT 1 FROM public.educacion_articulos WHERE educacion_articulos.slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := slug || '-' || counter;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- 5. TRIGGER PARA AUTO-GENERAR SLUG
CREATE OR REPLACE FUNCTION public.educacion_articulo_before_insert()
RETURNS TRIGGER AS $$
BEGIN
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

-- 6. TRIGGER PARA ACTUALIZAR updated_at
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

-- 7. FUNCION HELPER: Puede editar educacion?
CREATE OR REPLACE FUNCTION public.puede_editar_educacion()
RETURNS BOOLEAN AS $$
    SELECT public.get_user_role() IN ('admin', 'contadora_principal', 'comunicadora', 'desarrollo')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 8. RLS POLICIES - CATEGORIAS
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

-- 9. RLS POLICIES - ARTICULOS
ALTER TABLE public.educacion_articulos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "educacion_articulos_select" ON public.educacion_articulos;
CREATE POLICY "educacion_articulos_select" ON public.educacion_articulos
    FOR SELECT TO authenticated
    USING (estado = 'publicado' OR public.puede_editar_educacion());

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

-- 10. RLS POLICIES - ADJUNTOS
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

-- 11. DATOS INICIALES - Categorias
INSERT INTO public.educacion_categorias (nombre, descripcion, icono, color, orden) VALUES
    ('Conceptos Basicos', 'Fundamentos del regimen de Monotributo', 'BookOpen', 'blue', 1),
    ('Facturacion', 'Todo sobre facturar correctamente', 'FileText', 'green', 2),
    ('Limites y Categorias', 'Topes, recategorizacion y exclusiones', 'AlertTriangle', 'amber', 3),
    ('Situaciones Especiales', 'Casos particulares y excepciones', 'HelpCircle', 'purple', 4)
ON CONFLICT DO NOTHING;
