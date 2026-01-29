-- ============================================
-- Migración: Mensajes personalizados de WhatsApp
-- Descripción: Agrega soporte para plantillas de mensajes
--              e instrucciones específicas por servicio
-- Fecha: 2026-01-28
-- ============================================

-- ============================================
-- 1. Agregar campo instrucciones_previas a agenda_servicios
-- ============================================
-- Este campo permite definir instrucciones específicas que el cliente
-- debe seguir antes del turno (ej: "venir sin maquillaje")

ALTER TABLE public.agenda_servicios
ADD COLUMN IF NOT EXISTS instrucciones_previas TEXT;

COMMENT ON COLUMN public.agenda_servicios.instrucciones_previas IS
'Instrucciones específicas para el cliente antes del turno (ej: venir sin maquillaje, no usar cremas, etc.)';

-- ============================================
-- 2. Agregar campos de plantilla a agenda_negocio
-- ============================================
-- Plantilla personalizable para mensajes de recordatorio

ALTER TABLE public.agenda_negocio
ADD COLUMN IF NOT EXISTS plantilla_recordatorio TEXT;

ALTER TABLE public.agenda_negocio
ADD COLUMN IF NOT EXISTS plantilla_confirmacion TEXT;

COMMENT ON COLUMN public.agenda_negocio.plantilla_recordatorio IS
'Plantilla personalizable para mensajes de recordatorio. Variables: {nombre}, {fecha}, {hora}, {servicios}, {instrucciones}, {direccion}, {whatsapp}';

COMMENT ON COLUMN public.agenda_negocio.plantilla_confirmacion IS
'Plantilla personalizable para mensajes de confirmación. Variables: {nombre}, {fecha}, {hora}, {servicios}, {instrucciones}, {direccion}, {whatsapp}, {sena}';

-- ============================================
-- 3. Agregar campo es_domicilio a agenda_turnos
-- ============================================
-- Indica si el turno es a domicilio (no mostrar dirección del negocio)

ALTER TABLE public.agenda_turnos
ADD COLUMN IF NOT EXISTS es_domicilio BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.agenda_turnos.es_domicilio IS
'Si es true, el turno es a domicilio del cliente y no se incluye la dirección del negocio en los mensajes';

-- ============================================
-- 4. Índice para filtrar turnos a domicilio
-- ============================================
CREATE INDEX IF NOT EXISTS idx_agenda_turnos_domicilio
ON public.agenda_turnos(duenio_id, es_domicilio)
WHERE es_domicilio = true;

-- ============================================
-- Valores por defecto para plantillas
-- ============================================
-- Nota: Estos son solo ejemplos, el usuario puede personalizarlos

/*
Plantilla de recordatorio por defecto:

¡Hola {nombre}!

Te recordamos tu turno:
📅 {fecha}
🕐 {hora} hs
💇 {servicios}

{instrucciones}

{direccion}

Si necesitás reprogramar, escribinos al {whatsapp}.
¡Te esperamos!

---

Plantilla de confirmación por defecto:

¡Hola {nombre}!

Tu turno quedó confirmado ✅

📋 {servicios}
📅 {fecha}
🕐 {hora} hs

{instrucciones}

{sena}

{direccion}

¡Te esperamos!
*/
