-- =====================================================
-- MIGRACION: Agregar campos instagram y origen a agenda_clientes
-- Fecha: 2026-01-24
-- Descripcion: Agrega campo para Instagram y selector de origen (como conocio al negocio)
-- =====================================================

-- Agregar columna instagram
ALTER TABLE public.agenda_clientes
ADD COLUMN IF NOT EXISTS instagram VARCHAR(50);

-- Agregar columna origen (como nos conocio)
ALTER TABLE public.agenda_clientes
ADD COLUMN IF NOT EXISTS origen VARCHAR(30) CHECK (origen IN (
    'recomendacion',
    'instagram',
    'facebook',
    'tiktok',
    'google',
    'otros'
));

-- Indice para busquedas por instagram
CREATE INDEX IF NOT EXISTS idx_agenda_clientes_instagram
ON public.agenda_clientes(duenio_id, instagram)
WHERE instagram IS NOT NULL;

-- Indice para filtrar por origen
CREATE INDEX IF NOT EXISTS idx_agenda_clientes_origen
ON public.agenda_clientes(duenio_id, origen)
WHERE origen IS NOT NULL;

COMMENT ON COLUMN public.agenda_clientes.instagram IS 'Usuario de Instagram del cliente (sin @)';
COMMENT ON COLUMN public.agenda_clientes.origen IS 'Como conocio el cliente al negocio';
