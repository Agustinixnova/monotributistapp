-- =====================================================
-- Migración: Agregar permisos de reportes, estadísticas y total del día
-- Fecha: 2026-01-21
-- =====================================================

-- Agregar nuevos permisos a empleados existentes (por defecto desactivados)
-- Los nuevos permisos son:
-- - ver_reportes: Acceso al botón de reportes
-- - ver_total_dia: Ver la card de Total del Día
-- - ver_estadisticas: Acceso a estadísticas y botón "Ver detalle"

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Agregando nuevos permisos de empleados';
  RAISE NOTICE '========================================';

  -- Actualizar registros existentes para agregar los nuevos permisos
  UPDATE public.caja_empleados
  SET permisos = permisos || '{
    "ver_reportes": false,
    "ver_total_dia": true,
    "ver_estadisticas": false
  }'::jsonb
  WHERE NOT (permisos ? 'ver_reportes');

  RAISE NOTICE 'Permisos agregados a empleados existentes';
  RAISE NOTICE '========================================';
END $$;

-- Actualizar el valor default de la columna permisos para nuevos empleados
-- Nota: No podemos usar ALTER COLUMN ... SET DEFAULT con jsonb directamente,
-- así que creamos un comentario documentando los permisos disponibles

COMMENT ON COLUMN public.caja_empleados.permisos IS 'Permisos configurables del empleado:
- anular_movimientos: Anular entradas y salidas
- eliminar_arqueos: Eliminar arqueos de caja
- editar_saldo_inicial: Modificar saldo inicial del día
- agregar_categorias: Crear nuevas categorías
- agregar_metodos_pago: Crear nuevos métodos de pago
- editar_cierre: Modificar cierre de caja existente
- reabrir_dia: Reabrir un día cerrado
- ver_reportes: Acceder a reportes
- ver_total_dia: Ver card de Total del Día
- ver_estadisticas: Acceder a estadísticas y detalle de movimientos';
