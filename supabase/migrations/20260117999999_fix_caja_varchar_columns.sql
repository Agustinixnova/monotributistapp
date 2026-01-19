-- =====================================================
-- FIX: Aumentar tamaño de columnas VARCHAR en tablas de caja
-- Fecha: 2026-01-19
-- =====================================================

-- Esta migración debe ejecutarse ANTES de 20260118000000_caja_diaria.sql

-- Aumentar tamaño de nombre en caja_metodos_pago
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'caja_metodos_pago'
        AND column_name = 'nombre'
    ) THEN
        ALTER TABLE public.caja_metodos_pago
        ALTER COLUMN nombre TYPE VARCHAR(50);

        RAISE NOTICE 'Column caja_metodos_pago.nombre updated to VARCHAR(50)';
    END IF;
END $$;

-- Aumentar tamaño de nombre en caja_categorias
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'caja_categorias'
        AND column_name = 'nombre'
    ) THEN
        ALTER TABLE public.caja_categorias
        ALTER COLUMN nombre TYPE VARCHAR(50);

        RAISE NOTICE 'Column caja_categorias.nombre updated to VARCHAR(50)';
    END IF;
END $$;
