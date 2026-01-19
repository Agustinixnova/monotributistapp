-- =====================================================
-- MIGRACIÓN: Alias de pago y QR para caja diaria
-- Fecha: 2026-01-19
-- Descripción:
--   - Tabla para múltiples alias de pago
--   - Campo para URL de imagen QR en configuración
--   - Storage bucket para imágenes de QR
-- =====================================================

-- =====================================================
-- 1. TABLA DE ALIAS DE PAGO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.caja_alias_pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(50) NOT NULL, -- Ej: "Mercado Pago", "Banco Galicia"
    alias VARCHAR(100) NOT NULL, -- Ej: "mi.negocio.mp"
    banco VARCHAR(50), -- Opcional: nombre del banco
    cbu VARCHAR(22), -- Opcional: CBU/CVU
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caja_alias_user ON public.caja_alias_pago(user_id);

-- RLS
ALTER TABLE public.caja_alias_pago ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "caja_alias_select" ON public.caja_alias_pago;
CREATE POLICY "caja_alias_select" ON public.caja_alias_pago
    FOR SELECT TO authenticated
    USING (public.puede_acceder_caja(user_id));

DROP POLICY IF EXISTS "caja_alias_insert" ON public.caja_alias_pago;
CREATE POLICY "caja_alias_insert" ON public.caja_alias_pago
    FOR INSERT TO authenticated
    WITH CHECK (public.puede_acceder_caja(user_id));

DROP POLICY IF EXISTS "caja_alias_update" ON public.caja_alias_pago;
CREATE POLICY "caja_alias_update" ON public.caja_alias_pago
    FOR UPDATE TO authenticated
    USING (public.puede_acceder_caja(user_id));

DROP POLICY IF EXISTS "caja_alias_delete" ON public.caja_alias_pago;
CREATE POLICY "caja_alias_delete" ON public.caja_alias_pago
    FOR DELETE TO authenticated
    USING (public.puede_acceder_caja(user_id));

-- =====================================================
-- 2. AGREGAR CAMPO QR_URL A CONFIGURACIÓN
-- =====================================================

ALTER TABLE public.caja_configuracion
ADD COLUMN IF NOT EXISTS qr_url TEXT;

COMMENT ON COLUMN public.caja_configuracion.qr_url IS 'URL de la imagen del QR de pago almacenada en Storage';

-- =====================================================
-- 3. CREAR BUCKET DE STORAGE PARA QR
-- =====================================================

-- Nota: El bucket se debe crear manualmente en el dashboard o via API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('caja-qr', 'caja-qr', true)
-- ON CONFLICT (id) DO NOTHING;

-- Las políticas de storage se configuran en el dashboard:
-- - Permitir upload a usuarios autenticados en su carpeta (user_id/)
-- - Permitir lectura pública de las imágenes
