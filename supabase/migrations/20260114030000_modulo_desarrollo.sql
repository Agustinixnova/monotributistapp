-- =============================================
-- MÓDULO DESARROLLO - Sistema interno para ideas y reportes
-- =============================================

-- 1. Agregar columna socios_rol a profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS socios_rol VARCHAR(20) CHECK (socios_rol IN ('dev', 'contadora', 'comunicadora'));

-- 2. Tabla dev_ideas
CREATE TABLE IF NOT EXISTS dev_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) UNIQUE NOT NULL,
  titulo VARCHAR(200) NOT NULL,

  etapa VARCHAR(20) DEFAULT 'idea' CHECK (etapa IN ('idea', 'desarrollo', 'revisar', 'publicado')),
  prioridad VARCHAR(20) DEFAULT 'normal' CHECK (prioridad IN ('urgente', 'normal', 'puede_esperar')),

  que_queremos_hacer TEXT NOT NULL,
  para_quien VARCHAR(100),
  por_que_importa TEXT,

  fiscal_reglas TEXT,
  fiscal_validar TEXT,
  fiscal_casos_especiales TEXT,
  fiscal_listo BOOLEAN DEFAULT false,
  fiscal_completado_por UUID REFERENCES profiles(id),
  fiscal_completado_fecha TIMESTAMPTZ,

  ux_mensaje_principal TEXT,
  ux_tono VARCHAR(50),
  ux_si_falta_info TEXT,
  ux_listo BOOLEAN DEFAULT false,
  ux_completado_por UUID REFERENCES profiles(id),
  ux_completado_fecha TIMESTAMPTZ,

  check_funciona BOOLEAN DEFAULT false,
  check_calculos BOOLEAN DEFAULT false,
  check_textos BOOLEAN DEFAULT false,
  check_mobile BOOLEAN DEFAULT false,

  notas_ejemplos TEXT,
  notas_tecnicas TEXT,

  creado_por UUID REFERENCES profiles(id),
  creado_fecha TIMESTAMPTZ DEFAULT NOW(),
  actualizado_fecha TIMESTAMPTZ DEFAULT NOW(),
  publicado_fecha TIMESTAMPTZ
);

-- 3. Tabla dev_ideas_comentarios
CREATE TABLE IF NOT EXISTS dev_ideas_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES dev_ideas(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES profiles(id),
  contenido TEXT NOT NULL,
  fecha TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla dev_reportes
CREATE TABLE IF NOT EXISTS dev_reportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL,

  modulo_id UUID REFERENCES modules(id),
  submodulo VARCHAR(100),

  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('falla_grave', 'error', 'sugerencia')),
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'abierto', 'en_curso', 'para_probar', 'resuelto')),

  descripcion TEXT NOT NULL,

  reportado_por UUID REFERENCES profiles(id),
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_resolucion TIMESTAMPTZ,
  actualizado_fecha TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla dev_reportes_mensajes
CREATE TABLE IF NOT EXISTS dev_reportes_mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id UUID REFERENCES dev_reportes(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES profiles(id),
  contenido TEXT NOT NULL,
  fecha TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla dev_archivos
CREATE TABLE IF NOT EXISTS dev_archivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  idea_id UUID REFERENCES dev_ideas(id) ON DELETE CASCADE,
  reporte_id UUID REFERENCES dev_reportes(id) ON DELETE CASCADE,
  mensaje_id UUID REFERENCES dev_reportes_mensajes(id) ON DELETE CASCADE,

  nombre VARCHAR(255) NOT NULL,
  tipo_mime VARCHAR(100),
  tamanio INTEGER,
  ruta_storage TEXT NOT NULL,
  url_publica TEXT,

  subido_por UUID REFERENCES profiles(id),
  fecha TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ideas_etapa ON dev_ideas(etapa);
CREATE INDEX IF NOT EXISTS idx_ideas_prioridad ON dev_ideas(prioridad);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON dev_reportes(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_tipo ON dev_reportes(tipo);
CREATE INDEX IF NOT EXISTS idx_ideas_comentarios_idea ON dev_ideas_comentarios(idea_id);
CREATE INDEX IF NOT EXISTS idx_reportes_mensajes_reporte ON dev_reportes_mensajes(reporte_id);

-- Triggers
CREATE OR REPLACE FUNCTION generar_codigo_idea()
RETURNS TRIGGER AS $$
DECLARE
  ultimo_numero INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 6) AS INTEGER)), 0)
  INTO ultimo_numero
  FROM dev_ideas;

  NEW.codigo := 'IDEA-' || LPAD((ultimo_numero + 1)::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_codigo_idea ON dev_ideas;
CREATE TRIGGER trigger_codigo_idea
  BEFORE INSERT ON dev_ideas
  FOR EACH ROW
  WHEN (NEW.codigo IS NULL)
  EXECUTE FUNCTION generar_codigo_idea();

CREATE OR REPLACE FUNCTION actualizar_fecha_desarrollo()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_fecha = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_fecha_ideas ON dev_ideas;
CREATE TRIGGER trigger_fecha_ideas
  BEFORE UPDATE ON dev_ideas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_fecha_desarrollo();

DROP TRIGGER IF EXISTS trigger_fecha_reportes ON dev_reportes;
CREATE TRIGGER trigger_fecha_reportes
  BEFORE UPDATE ON dev_reportes
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_fecha_desarrollo();

-- RLS
ALTER TABLE dev_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_ideas_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_reportes_mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_archivos ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.es_socio()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND socios_rol IS NOT NULL
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "Socios pueden todo en ideas" ON dev_ideas
  FOR ALL USING (public.es_socio());

CREATE POLICY "Socios pueden todo en comentarios" ON dev_ideas_comentarios
  FOR ALL USING (public.es_socio());

CREATE POLICY "Socios pueden todo en reportes" ON dev_reportes
  FOR ALL USING (public.es_socio());

CREATE POLICY "Socios pueden todo en mensajes" ON dev_reportes_mensajes
  FOR ALL USING (public.es_socio());

CREATE POLICY "Socios pueden todo en archivos" ON dev_archivos
  FOR ALL USING (public.es_socio());
