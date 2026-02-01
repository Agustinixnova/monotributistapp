# Fix: Efectivo en Caja Principal - Gastos de Caja Secundaria

## Problema Reportado
Cuando se hacía un retiro/gasto desde caja secundaria, el sistema:
- ✗ Descontaba el monto de la caja secundaria (correcto)
- ✗ **También descontaba el monto del "Efectivo en Caja Principal"** (incorrecto)

Ejemplo: Un gasto de $3,000 desde caja secundaria afectaba incorrectamente ambas cajas.

## Solución Implementada

### Cambios en Base de Datos
**Archivo:** `supabase/migrations/20260131177000_fix_efectivo_caja_principal.sql`

**Funciones actualizadas:**
- `caja_resumen_dia_v2(p_user_id, p_fecha)`
- `caja_resumen_dia(p_fecha)`

### Comportamiento Correcto (Después del Fix)

| Métrica | Incluye gastos secundaria | Razón |
|---------|---------------------------|-------|
| **Total del Día** (total_salidas) | ✓ SÍ | Refleja el gasto real del negocio |
| **Efectivo en Caja** (efectivo_salidas) | ✗ NO | Solo registra movimientos de caja principal |
| **Saldo Caja Secundaria** | ✓ SÍ | Se actualiza correctamente |

### Lógica SQL
```sql
-- CTE para movimientos principales (excluye transferencias internas)
movimientos_principal AS (
    SELECT m.tipo, m.monto_total
    FROM caja_movimientos m
    LEFT JOIN caja_categorias c ON m.categoria_id = c.id
    WHERE NOT (c.nombre ILIKE '%caja secundaria%')
)

-- CTE para gastos reales de caja secundaria
gastos_secundaria AS (
    SELECT 'salida'::TEXT as tipo, cs.monto as monto_total
    FROM caja_secundaria_movimientos cs
    WHERE cs.tipo = 'salida' AND cs.origen = 'gasto'
)

-- Todos los movimientos para Total del Día (incluye gastos secundaria)
todos_movimientos AS (
    SELECT * FROM movimientos_principal
    UNION ALL
    SELECT * FROM gastos_secundaria  -- <-- Incluye en total_salidas
)

-- Efectivo solo de caja principal (NO incluye gastos secundaria)
efectivo_principal AS (
    SELECT ...
    FROM caja_movimientos m
    WHERE NOT (c.nombre ILIKE '%caja secundaria%')  -- <-- Excluye de efectivo_salidas
)
```

## Pruebas Realizadas

### Test de Verificación
**Fecha:** 2026-02-01
**Resultado:**
```
Gastos caja secundaria: $3,000.00
Total salidas: $13,000.00 ✓ (incluye $3,000 de secundaria)
Efectivo salidas: $10,000.00 ✓ (NO incluye $3,000 de secundaria)
```

**Cálculo:** $13,000 (total) - $3,000 (secundaria) = $10,000 (efectivo principal) ✓

## Pasos para Verificar el Fix

1. **Cerrar sesión** en la aplicación
2. **Borrar caché del navegador** (Ctrl+Shift+Del)
3. **Iniciar sesión** nuevamente
4. **Hacer un gasto desde Caja Secundaria**
5. **Verificar que:**
   - Total del Día: La salida aparece sumada ✓
   - Efectivo en Caja: NO se descuenta el monto ✓
   - Saldo Caja Secundaria: Se descuenta el monto ✓

## Archivos Modificados

### Migración Principal
- `20260131177000_fix_efectivo_caja_principal.sql` ✓ Aplicada

### Archivos de Test (renombrados a .skip)
- `20260131176000_fix_resumen_final.sql.skip` (versión incorrecta)
- `20260131175000_test_resumen_dia.sql.skip`
- `20260131175100_debug_resumen.sql.skip`
- `20260131176100_test_fix.sql.skip`
- `20260131178000_verify_fix.sql.skip`
- `20260131179000_test_real_calculation.sql.skip`

## Estado del Fix
✅ **COMPLETADO Y VERIFICADO**

- ✓ Migración aplicada a la base de datos
- ✓ Función actualizada correctamente
- ✓ Test con datos reales exitoso
- ✓ Archivos de prueba archivados
- ⚠️ **Requiere que el usuario cierre sesión y limpie caché para ver los cambios**

## Fecha de Implementación
2026-01-31 / 2026-02-01

## Notas Técnicas
- Las funciones se ejecutan con `SECURITY DEFINER` para mantener permisos
- Se utilizan CTEs (Common Table Expressions) para claridad y performance
- Los filtros usan `ILIKE '%caja secundaria%'` para ser case-insensitive
- Se mantiene compatibilidad con ambas versiones: `_v2` (con user_id) y sin sufijo (usa `get_caja_owner_id()`)
