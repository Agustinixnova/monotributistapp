-- Migration: Add es_indeterminado column to agenda_turnos
-- Description: Allows marking recurring appointment series as "indefinite" (no end date)
-- When es_indeterminado = true, the series auto-extends when few appointments remain

-- Add the new column
ALTER TABLE public.agenda_turnos
ADD COLUMN IF NOT EXISTS es_indeterminado BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.agenda_turnos.es_indeterminado IS
'Indicates if this recurring appointment series has no end date. When true, the system auto-extends the series when few pending appointments remain.';

-- Create index for efficient querying of indeterminate series
CREATE INDEX IF NOT EXISTS idx_agenda_turnos_indeterminado
ON public.agenda_turnos (es_indeterminado, es_recurrente, turno_padre_id)
WHERE es_indeterminado = true;
