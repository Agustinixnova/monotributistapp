-- =====================================================
-- Consulta de información del usuario y sus movimientos
-- Usuario ID: c671f12e-d88c-45e2-86c7-a37a8040492d
-- =====================================================

-- 1. Información básica del usuario
SELECT
  p.id,
  p.nombre,
  p.apellido,
  p.email,
  r.nombre as rol
FROM public.profiles p
LEFT JOIN public.roles r ON r.id = p.rol_id
WHERE p.id = 'c671f12e-d88c-45e2-86c7-a37a8040492d';

-- 2. Verificar si es empleado de alguien
SELECT
  e.id,
  e.duenio_id,
  e.empleado_id,
  e.puede_registrar_movimientos,
  e.puede_hacer_arqueos,
  e.puede_cerrar_caja,
  e.activo,
  p_duenio.nombre || ' ' || p_duenio.apellido as duenio_nombre
FROM public.caja_empleados e
LEFT JOIN public.profiles p_duenio ON p_duenio.id = e.duenio_id
WHERE e.empleado_id = 'c671f12e-d88c-45e2-86c7-a37a8040492d'
  AND e.activo = true;

-- 3. Categorías que CREÓ este usuario (solo las que tienen user_id asignado)
SELECT
  c.id,
  c.nombre,
  c.icono,
  c.tipo,
  c.es_sistema,
  c.orden,
  c.activo,
  c.created_at
FROM public.caja_categorias c
WHERE c.user_id = 'c671f12e-d88c-45e2-86c7-a37a8040492d'
ORDER BY c.orden, c.nombre;

-- 4. Todos los movimientos (ventas/ingresos) de este usuario
SELECT
  m.id,
  m.fecha,
  m.hora,
  m.tipo,
  cat.nombre as categoria,
  m.descripcion,
  m.monto_total,
  m.anulado,
  m.created_at,
  CASE
    WHEN m.created_by_id != m.user_id THEN
      p_creador.nombre || ' ' || p_creador.apellido || ' (empleado)'
    ELSE 'Dueño'
  END as creado_por
FROM public.caja_movimientos m
LEFT JOIN public.caja_categorias cat ON cat.id = m.categoria_id
LEFT JOIN public.profiles p_creador ON p_creador.id = m.created_by_id
WHERE m.user_id = 'c671f12e-d88c-45e2-86c7-a37a8040492d'
ORDER BY m.fecha DESC, m.hora DESC
LIMIT 100;

-- 5. Resumen de ventas por categoría (solo ingresos)
SELECT
  cat.nombre as categoria,
  cat.tipo,
  COUNT(*) as cantidad_operaciones,
  SUM(m.monto_total) as total,
  MIN(m.fecha) as primera_venta,
  MAX(m.fecha) as ultima_venta
FROM public.caja_movimientos m
LEFT JOIN public.caja_categorias cat ON cat.id = m.categoria_id
WHERE m.user_id = 'c671f12e-d88c-45e2-86c7-a37a8040492d'
  AND m.tipo = 'entrada'
  AND m.anulado = false
GROUP BY cat.id, cat.nombre, cat.tipo
ORDER BY total DESC;

-- 6. Resumen general de este usuario
SELECT
  COUNT(*) as total_movimientos,
  SUM(CASE WHEN tipo = 'entrada' AND anulado = false THEN monto_total ELSE 0 END) as total_ingresos,
  SUM(CASE WHEN tipo = 'salida' AND anulado = false THEN monto_total ELSE 0 END) as total_egresos,
  SUM(CASE WHEN tipo = 'entrada' AND anulado = false THEN 1 ELSE 0 END) as cantidad_ingresos,
  SUM(CASE WHEN tipo = 'salida' AND anulado = false THEN 1 ELSE 0 END) as cantidad_egresos,
  MIN(fecha) as primer_movimiento,
  MAX(fecha) as ultimo_movimiento
FROM public.caja_movimientos
WHERE user_id = 'c671f12e-d88c-45e2-86c7-a37a8040492d';
