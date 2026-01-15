-- ============================================
-- MÓDULO: Jurisdicciones IIBB
-- Fecha: 2026-01-15
-- Descripción: Tabla para almacenar las jurisdicciones
-- de IIBB por cliente (Local y Convenio Multilateral)
-- ============================================

-- Tabla de jurisdicciones IIBB por cliente
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

  -- Número de inscripción en esa jurisdicción (puede ser el mismo CM o diferente)
  numero_inscripcion TEXT,

  -- Coeficiente unificado en porcentaje (solo para Convenio Multilateral, entre 0 y 100)
  -- Para Local siempre es 100.0 (100%)
  coeficiente DECIMAL(5,2) DEFAULT 100.00 CHECK (coeficiente >= 0 AND coeficiente <= 100),

  -- Alícuota en porcentaje (ej: 3.5 para 3.5%)
  alicuota DECIMAL(5,2) CHECK (alicuota >= 0 AND alicuota <= 100),

  -- Si es la jurisdicción sede (solo para CM)
  es_sede BOOLEAN DEFAULT false,

  -- Notas internas
  notas TEXT,

  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),

  -- Un cliente no puede tener la misma provincia dos veces
  UNIQUE(client_id, provincia)
);

-- Índices
CREATE INDEX idx_iibb_jurisd_client ON public.client_iibb_jurisdicciones(client_id);
CREATE INDEX idx_iibb_jurisd_provincia ON public.client_iibb_jurisdicciones(provincia);

-- Índice compuesto para búsquedas de CM por sede (mejora performance)
CREATE UNIQUE INDEX idx_iibb_una_sede_por_cliente
ON public.client_iibb_jurisdicciones(client_id)
WHERE es_sede = true;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_iibb_jurisdicciones_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_iibb_jurisdicciones_updated
  BEFORE UPDATE ON public.client_iibb_jurisdicciones
  FOR EACH ROW
  EXECUTE FUNCTION update_iibb_jurisdicciones_timestamp();

-- Trigger para validar que coeficientes suman 100% en Convenio Multilateral
CREATE OR REPLACE FUNCTION validar_coeficientes_cm()
RETURNS TRIGGER AS $$
DECLARE
  v_suma DECIMAL;
  v_regimen TEXT;
BEGIN
  -- Obtener régimen del cliente
  SELECT regimen_iibb INTO v_regimen
  FROM public.client_fiscal_data
  WHERE id = NEW.client_id;

  -- Solo validar para CM
  IF v_regimen = 'convenio_multilateral' THEN
    -- Calcular suma de coeficientes (excluyendo el registro actual si es UPDATE)
    SELECT COALESCE(SUM(coeficiente), 0) INTO v_suma
    FROM public.client_iibb_jurisdicciones
    WHERE client_id = NEW.client_id
      AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid);

    v_suma := v_suma + NEW.coeficiente;

    -- Permitir suma entre 99.99 y 100.01 (tolerancia de 0.01%)
    IF v_suma < 99.99 OR v_suma > 100.01 THEN
      RAISE EXCEPTION 'Los coeficientes de Convenio Multilateral deben sumar 100%%. Suma actual: %', v_suma;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_coeficientes
  BEFORE INSERT OR UPDATE ON public.client_iibb_jurisdicciones
  FOR EACH ROW
  EXECUTE FUNCTION validar_coeficientes_cm();

-- RLS Policies (usando funciones centralizadas)
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

-- ============================================
-- MIGRACIÓN DE DATOS EXISTENTES
-- ============================================
-- Migrar datos de numero_iibb a jurisdicciones para régimen 'local'
INSERT INTO public.client_iibb_jurisdicciones (
  client_id,
  provincia,
  numero_inscripcion,
  coeficiente,
  alicuota,
  created_by
)
SELECT
  cfd.id as client_id,
  cfd.provincia, -- Usar la provincia del domicilio fiscal
  cfd.numero_iibb,
  100.00, -- Local siempre es 100%
  NULL, -- Alícuota se carga manualmente después
  (SELECT id FROM public.profiles WHERE role_id = (SELECT id FROM public.roles WHERE name = 'admin') LIMIT 1) as created_by
FROM public.client_fiscal_data cfd
WHERE cfd.regimen_iibb = 'local'
  AND cfd.numero_iibb IS NOT NULL
  AND cfd.provincia IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.client_iibb_jurisdicciones
    WHERE client_id = cfd.id
  );

-- Nota: Los datos de Convenio Multilateral no se pueden migrar automáticamente
-- porque requieren múltiples provincias con coeficientes que no tenemos en la base actual
