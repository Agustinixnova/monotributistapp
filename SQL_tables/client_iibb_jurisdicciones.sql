-- ============================================
-- Tabla: client_iibb_jurisdicciones
-- Descripción: Jurisdicciones IIBB por cliente (Local y CM)
-- ============================================

CREATE TABLE IF NOT EXISTS public.client_iibb_jurisdicciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.client_fiscal_data(id) ON DELETE CASCADE,

  -- Provincia (usar exactamente estos valores)
  provincia TEXT NOT NULL CHECK (provincia IN (
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Cordoba',
    'Corrientes', 'Entre Rios', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
    'Mendoza', 'Misiones', 'Neuquen', 'Rio Negro', 'Salta', 'San Juan',
    'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
    'Tierra del Fuego', 'Tucuman'
  )),

  -- Número de inscripción en esa jurisdicción
  numero_inscripcion TEXT,

  -- Coeficiente unificado en porcentaje (0-100)
  -- Para Local siempre es 100.0, para CM varía por jurisdicción
  coeficiente DECIMAL(5,2) DEFAULT 100.00 CHECK (coeficiente >= 0 AND coeficiente <= 100),

  -- Alícuota en porcentaje (ej: 3.5 para 3.5%)
  alicuota DECIMAL(5,2) CHECK (alicuota >= 0 AND alicuota <= 100),

  -- Si es la jurisdicción sede (solo para CM)
  es_sede BOOLEAN DEFAULT false,

  -- Año fiscal de vigencia de los coeficientes (se recalculan anualmente)
  anio_vigencia INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),

  -- Notas internas
  notas TEXT,

  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),

  -- Constraints
  UNIQUE(client_id, provincia)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_iibb_jurisd_client ON public.client_iibb_jurisdicciones(client_id);
CREATE INDEX IF NOT EXISTS idx_iibb_jurisd_provincia ON public.client_iibb_jurisdicciones(provincia);
CREATE INDEX IF NOT EXISTS idx_iibb_jurisd_anio ON public.client_iibb_jurisdicciones(anio_vigencia);

-- Índice único para garantizar solo una sede por cliente
CREATE UNIQUE INDEX IF NOT EXISTS idx_iibb_una_sede_por_cliente
ON public.client_iibb_jurisdicciones(client_id)
WHERE es_sede = true;

-- RLS Policies
ALTER TABLE public.client_iibb_jurisdicciones ENABLE ROW LEVEL SECURITY;

-- Contadores pueden ver todo
CREATE POLICY "iibb_jurisd_select_contador" ON public.client_iibb_jurisdicciones
  FOR SELECT TO authenticated
  USING (public.is_contador());

-- Monotributistas pueden ver sus propias jurisdicciones
CREATE POLICY "iibb_jurisd_select_own" ON public.client_iibb_jurisdicciones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_fiscal_data cfd
      WHERE cfd.id = client_iibb_jurisdicciones.client_id
      AND cfd.user_id = auth.uid()
    )
  );

-- Solo usuarios con acceso total pueden insertar/actualizar/eliminar
CREATE POLICY "iibb_jurisd_modify" ON public.client_iibb_jurisdicciones
  FOR ALL TO authenticated
  USING (public.is_full_access())
  WITH CHECK (public.is_full_access());

-- Comentarios
COMMENT ON TABLE public.client_iibb_jurisdicciones IS 'Jurisdicciones de IIBB por cliente para régimen Local y Convenio Multilateral';
COMMENT ON COLUMN public.client_iibb_jurisdicciones.coeficiente IS 'Coeficiente unificado en porcentaje (0-100). Para Local siempre es 100.00';
COMMENT ON COLUMN public.client_iibb_jurisdicciones.alicuota IS 'Alícuota en porcentaje (ej: 3.5 = 3.5%)';
COMMENT ON COLUMN public.client_iibb_jurisdicciones.es_sede IS 'Si es la jurisdicción sede del contribuyente (solo CM). Solo puede haber una sede por cliente.';
COMMENT ON COLUMN public.client_iibb_jurisdicciones.anio_vigencia IS 'Año fiscal de vigencia de los coeficientes (se recalculan anualmente)';
