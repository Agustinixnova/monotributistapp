-- =====================================================
-- Actualizar permisos de empleados existentes
-- Dar permiso editar_cierre a todos los empleados
-- =====================================================

UPDATE public.caja_empleados
SET permisos = permisos || '{"editar_cierre": true}'::jsonb
WHERE permisos->>'editar_cierre' = 'false'
   OR permisos->>'editar_cierre' IS NULL;

-- Comentario: Este permiso permite a los empleados cerrar la caja
-- al final de su turno, que es una operación normal de trabajo
