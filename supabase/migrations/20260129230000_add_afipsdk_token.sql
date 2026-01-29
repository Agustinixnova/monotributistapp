-- =====================================================
-- MIGRACIÓN: Agregar token de afipsdk.com
-- Fecha: 2026-01-29
-- =====================================================
--
-- Agrega el campo para almacenar el API token de afipsdk.com
-- necesario para usar la librería @afipsdk/afip.js
--
-- =====================================================

-- Agregar columna afipsdk_token a la configuración AFIP
ALTER TABLE public.agenda_config_afip
ADD COLUMN IF NOT EXISTS afipsdk_token TEXT;

-- Comentario
COMMENT ON COLUMN public.agenda_config_afip.afipsdk_token IS
'Token de acceso de afipsdk.com para autenticación con el servicio proxy';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
