# Funcionalidad: Eliminar y Comentar Movimientos en Caja Secundaria

## Resumen
Replicación de la funcionalidad de eliminar y comentar movimientos de la caja diaria, ahora disponible en caja secundaria.

## Cambios Realizados

### 1. Servicio: `cajaSecundariaService.js`

#### Nuevas Funciones

**`anularMovimientoSecundaria(id, motivo)`**
- Elimina un movimiento de caja secundaria
- El trigger bidireccional se encarga automáticamente de la restitución
- Tipos de movimientos y su comportamiento:
  - **Ingreso desde caja principal**: Anula el movimiento principal → dinero vuelve a caja principal
  - **Egreso a caja principal**: Anula la entrada en caja principal → dinero vuelve a caja secundaria
  - **Gasto**: Solo se elimina de caja secundaria → dinero vuelve a caja secundaria

**`actualizarComentarioSecundaria(id, descripcion)`**
- Actualiza el comentario/descripción de un movimiento
- Permite editar o agregar notas a movimientos existentes

### 2. Componente: `ModalDetalleMovimientoSecundaria.jsx`

#### Nuevas Características

**Imports Agregados:**
```javascript
import { Trash2, MessageSquare } from 'lucide-react'
import ModalComentario from './ModalComentario'
import ModalConfirmacion from './ModalConfirmacion'
```

**Estados Agregados:**
- `modalComentario`: Control del modal de comentarios
- `confirmEliminar`: Control del modal de confirmación de eliminación
- `procesando`: Estado de procesamiento durante la eliminación

**Handlers Nuevos:**
- `handleEliminar()`: Elimina el movimiento y refresca la lista
- `handleGuardarComentario()`: Guarda el comentario y recarga el detalle

**UI Actualizada:**
- Footer con tres botones:
  1. **Agregar/Editar comentario** (violeta)
  2. **Eliminar** (rojo)
  3. **Cerrar** (gris)

**Modales Agregados:**
1. **ModalComentario**: Para agregar/editar comentarios
2. **ModalConfirmacion**: Para confirmar la eliminación con mensajes específicos según tipo de movimiento

#### Mensajes de Confirmación Contextuales

- **Gasto**: "Al eliminar este gasto, el dinero volverá a estar disponible en caja secundaria."
- **Ingreso**: "Al eliminar este ingreso, el dinero volverá a caja principal."
- **Egreso**: "Al eliminar este egreso, el dinero volverá a caja secundaria."

### 3. Componente: `ModalCajaSecundaria.jsx`

**Cambio:**
- Agregado prop `onRefresh={onRecargar}` a `ModalDetalleMovimientoSecundaria`
- Permite refrescar la lista de movimientos después de eliminar/comentar

## Lógica de Restitución (Trigger Bidireccional)

### Trigger Existente: `anular_movimiento_principal_desde_secundaria()`

El trigger en PostgreSQL ya maneja toda la lógica:

```sql
-- Si eliminas un movimiento de caja secundaria con movimiento_principal_id
→ Se anula automáticamente el movimiento principal
→ Esto restaura el dinero según el tipo de operación
```

### Flujo de Eliminación

1. **Usuario hace click en "Eliminar"**
2. **Se muestra modal de confirmación** con mensaje contextual
3. **Al confirmar**: Se ejecuta `anularMovimientoSecundaria(id)`
4. **Service hace DELETE** en `caja_secundaria_movimientos`
5. **Trigger detecta** si existe `movimiento_principal_id`
6. **Si existe**: Marca como `anulado = true` el movimiento principal
7. **Resultado**:
   - Movimiento secundario eliminado ✓
   - Movimiento principal anulado (si existía) ✓
   - Dinero restituido correctamente ✓
   - Lista de movimientos se refresca ✓

## Archivos Modificados

1. `src/modules/caja-diaria/services/cajaSecundariaService.js`
   - ✓ Agregadas funciones `anularMovimientoSecundaria()`
   - ✓ Agregadas funciones `actualizarComentarioSecundaria()`

2. `src/modules/caja-diaria/components/ModalDetalleMovimientoSecundaria.jsx`
   - ✓ Agregados botones de eliminar y comentar
   - ✓ Agregados modales de confirmación y comentario
   - ✓ Agregados handlers para las acciones
   - ✓ Agregado prop `onRefresh`

3. `src/modules/caja-diaria/components/ModalCajaSecundaria.jsx`
   - ✓ Pasado prop `onRefresh` al modal de detalle

## Testing Recomendado

### Caso 1: Eliminar Ingreso desde Caja Principal
1. Hacer una transferencia a caja secundaria ($1,000)
2. Verificar que caja principal baje $1,000
3. Verificar que caja secundaria suba $1,000
4. Abrir detalle del movimiento en caja secundaria
5. Hacer click en "Eliminar" → Confirmar
6. **Resultado esperado:**
   - Movimiento desaparece de caja secundaria ✓
   - Caja secundaria baja $1,000 ✓
   - Caja principal sube $1,000 (dinero restituido) ✓

### Caso 2: Eliminar Egreso a Caja Principal
1. Hacer un reintegro a caja principal ($500)
2. Verificar que caja secundaria baje $500
3. Verificar que caja principal suba $500
4. Abrir detalle del movimiento en caja secundaria
5. Hacer click en "Eliminar" → Confirmar
6. **Resultado esperado:**
   - Movimiento desaparece de caja secundaria ✓
   - Caja secundaria sube $500 (dinero restituido) ✓
   - Caja principal baja $500 ✓

### Caso 3: Eliminar Gasto
1. Hacer un gasto desde caja secundaria ($200)
2. Verificar que caja secundaria baje $200
3. Abrir detalle del movimiento en caja secundaria
4. Hacer click en "Eliminar" → Confirmar
5. **Resultado esperado:**
   - Movimiento desaparece de caja secundaria ✓
   - Caja secundaria sube $200 (dinero restituido) ✓
   - Caja principal NO se afecta ✓

### Caso 4: Agregar Comentario
1. Abrir detalle de cualquier movimiento
2. Click en "Agregar comentario"
3. Escribir "Gasto de prueba para testeo"
4. Guardar
5. **Resultado esperado:**
   - Modal se cierra ✓
   - Comentario aparece en el detalle ✓
   - Botón cambia a "Editar comentario" ✓
   - Lista de movimientos se refresca ✓

### Caso 5: Editar Comentario Existente
1. Abrir detalle de movimiento con comentario
2. Click en "Editar comentario"
3. Modificar el texto
4. Guardar
5. **Resultado esperado:**
   - Comentario actualizado en el detalle ✓
   - Lista de movimientos se refresca ✓

## Estado Actual
✅ **IMPLEMENTADO Y LISTO PARA TESTEAR**

## Fecha de Implementación
2026-02-01
