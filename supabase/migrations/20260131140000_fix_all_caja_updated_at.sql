-- Agregar columna updated_at a todas las tablas de caja que usan el trigger caja_set_updated_by

-- caja_movimientos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'caja_movimientos' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.caja_movimientos ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- caja_movimientos_pagos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'caja_movimientos_pagos' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.caja_movimientos_pagos ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- caja_arqueos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'caja_arqueos' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.caja_arqueos ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- caja_categorias
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'caja_categorias' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.caja_categorias ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- caja_metodos_pago
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'caja_metodos_pago' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.caja_metodos_pago ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- caja_configuracion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'caja_configuracion' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.caja_configuracion ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;
