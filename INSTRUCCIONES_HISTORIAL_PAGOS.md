# 📋 INSTRUCCIONES: Sistema de Historial de Pagos

## 🎯 Resumen

Se implementó un sistema completo para gestionar el historial de pagos de cuotas del monotributo, que incluye:

1. ✅ Campos de deuda inicial con períodos específicos
2. ✅ Función corregida que considera fecha de alta
3. ✅ Ajuste automático de deuda al registrar pagos
4. ✅ Interfaz visual para gestionar 12 meses de cuotas
5. ✅ Estado 'desconocido' cuando no hay datos suficientes

---

## 🚀 PASOS DE IMPLEMENTACIÓN

### Paso 1: Aplicar migración SQL

Ejecuta en el SQL Editor de Supabase:

```sql
-- El archivo está en: supabase/migrations/20260113000000_deuda_inicial_y_periodos.sql

-- O manualmente:
ALTER TABLE public.client_fiscal_data
ADD COLUMN IF NOT EXISTS fecha_alta_sistema DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS periodo_deuda_desde DATE,
ADD COLUMN IF NOT EXISTS periodo_deuda_hasta DATE,
ADD COLUMN IF NOT EXISTS cuotas_adeudadas_al_alta INTEGER DEFAULT 0;

-- Inicializar fecha_alta para clientes existentes
UPDATE public.client_fiscal_data
SET fecha_alta_sistema = DATE(created_at)
WHERE fecha_alta_sistema IS NULL;

-- Luego ejecutar el resto del archivo (función + triggers)
```

### Paso 2: Verificar que todo funciona

```sql
-- Verificar campos nuevos
SELECT id, razon_social, fecha_alta_sistema, cuotas_adeudadas_al_alta,
       periodo_deuda_desde, periodo_deuda_hasta
FROM client_fiscal_data
WHERE tipo_contribuyente = 'monotributista'
LIMIT 5;

-- Probar función de cálculo
SELECT id, razon_social, estado_pago_monotributo,
       calcular_estado_pago_monotributo(id) as estado_calculado
FROM client_fiscal_data
WHERE tipo_contribuyente = 'monotributista'
LIMIT 5;
```

### Paso 3: Recalcular todos los estados

```sql
UPDATE client_fiscal_data
SET estado_pago_monotributo = calcular_estado_pago_monotributo(id)
WHERE tipo_contribuyente = 'monotributista';
```

### Paso 4: Verificar en la UI

1. Refresca la app (http://localhost:4000)
2. Ve a **Mi Cartera**
3. Entra a la ficha de un cliente monotributista
4. Busca la nueva sección **"Historial de Pagos"**

---

## 📱 CÓMO USAR LA INTERFAZ

### A. Configurar deuda inicial

Al dar de alta un cliente con deuda:

1. En la sección **"Deuda al momento del alta"**, clic en el ícono de editar
2. Completar:
   - **Cuotas adeudadas**: Cantidad de meses que debe (ej: 8)
   - **Desde**: Primer mes de deuda (ej: Mayo 2025)
   - **Hasta**: Último mes de deuda (ej: Diciembre 2025)
   - **Notas**: Descripción opcional
3. Clic en **Guardar**

**Ejemplo:**
```
Cuotas adeudadas: 3
Desde: 2025-10
Hasta: 2025-12
Notas: "Cliente llegó debiendo Oct-Dic 2025"
```

### B. Gestionar cuotas mensuales

Para cada mes del listado de "Últimos 12 meses":

#### Si está **"Sin registro":**
- ✅ Clic en ícono verde → Marca como **Pagada**
- ⏰ Clic en ícono amarillo → Marca como **Pendiente**

#### Si ya tiene registro:
- ✏️ Clic en **Editar** → Puedes cambiar a:
  - **Pagada** (informada por el cliente)
  - **Verificada** (confirmada en AFIP por la contadora)
  - **Pendiente** (explícitamente impaga)
- 🗑️ Clic en **Eliminar** → Quita el registro (vuelve a "Sin registro")

### C. Lógica automática

**Al marcar un mes como pagado:**
- Si el mes está en el período de deuda inicial → Se decrementa `cuotas_adeudadas_al_alta`
- Se recalcula automáticamente el `estado_pago_monotributo`

**Ejemplo:**
```
Estado inicial:
- Deuda inicial: 3 cuotas (Oct, Nov, Dic 2025)
- Estado: 'debe_2_mas'

Acción: Marcar Diciembre 2025 como "Pagada"

Resultado:
- Deuda inicial: 2 cuotas (solo Oct, Nov)
- Estado: 'debe_2_mas'

Acción: Marcar Noviembre 2025 como "Pagada"

Resultado:
- Deuda inicial: 1 cuota (solo Oct)
- Estado: 'debe_1_cuota'

Acción: Marcar Octubre 2025 como "Pagada"

Resultado:
- Deuda inicial: 0 cuotas
- Períodos limpiados automáticamente
- Estado: 'al_dia' ✅
```

---

## 🔍 CASOS DE USO

### Caso 1: Cliente nuevo sin deuda

```
Alta: 10 Enero 2026
Configurar:
  - Cuotas adeudadas: 0
  - No completar períodos
  - Estado: desconocido (hasta que pase el primer mes)
```

### Caso 2: Cliente nuevo con deuda (juan@gmail.com)

```
Alta: 7 Enero 2026
Configurar:
  - Cuotas adeudadas: 1
  - Desde: 2025-12
  - Hasta: 2025-12
  - Notas: "Debe Diciembre 2025"

Resultado: estado_pago_monotributo = 'debe_1_cuota' ✅
```

### Caso 3: Cliente con deuda múltiple

```
Alta: 5 Enero 2026
Configurar:
  - Cuotas adeudadas: 8
  - Desde: 2025-05
  - Hasta: 2025-12
  - Notas: "Cliente con deuda Mayo-Diciembre 2025"

Resultado: estado_pago_monotributo = 'debe_2_mas' ✅
```

### Caso 4: Regularizar deuda gradualmente

```
Estado inicial: Debe 5 cuotas (Ago-Dic 2025)

Paso 1: Cliente paga Diciembre
  → Registras: Diciembre 2025 = "Pagada"
  → Sistema: Deuda = 4 cuotas, estado = 'debe_2_mas'

Paso 2: Cliente paga Noviembre
  → Registras: Noviembre 2025 = "Pagada"
  → Sistema: Deuda = 3 cuotas, estado = 'debe_2_mas'

Paso 3: Cliente paga Octubre
  → Registras: Octubre 2025 = "Pagada"
  → Sistema: Deuda = 2 cuotas, estado = 'debe_2_mas'

Paso 4: Cliente paga Septiembre
  → Registras: Septiembre 2025 = "Pagada"
  → Sistema: Deuda = 1 cuota, estado = 'debe_1_cuota'

Paso 5: Cliente paga Agosto
  → Registras: Agosto 2025 = "Pagada"
  → Sistema: Deuda = 0, estado = 'al_dia' ✅
```

---

## ⚠️ IMPORTANTE

### DO ✅

- ✅ Configurar deuda inicial AL DAR DE ALTA el cliente
- ✅ Usar períodos específicos (desde/hasta) para evitar doble conteo
- ✅ Marcar como "Verificada" cuando confirmes en AFIP
- ✅ Usar "Pendiente" para cuotas que SABES que están impagas
- ✅ Dejar "Sin registro" cuando NO tenés información

### DON'T ❌

- ❌ NO configurar "Al día" Y "Cuotas adeudadas > 0" simultáneamente
- ❌ NO crear registros de cuotas antes de la fecha_alta_sistema
- ❌ NO marcar como "Pagada" sin confirmación del cliente
- ❌ NO editar manualmente cuotas_adeudadas_al_alta después del alta (se ajusta automáticamente)

---

## 🎨 ESTADOS VISUALES

| Estado | Color | Significado |
|--------|-------|-------------|
| 🔴 Sin registro | Gris | No hay información de este mes |
| ⏰ Pendiente | Amarillo | Cuota impaga (explícitamente marcada) |
| ✅ Pagada | Verde | Cliente informó el pago |
| ✔️ Verificada | Azul | Contadora confirmó en AFIP |

---

## 🔧 SOLUCIÓN PROBLEMAS COMUNES

### Problema: Cliente muestra "Al día" pero debería deber

**Solución:**
1. Ve a la ficha del cliente
2. Abre "Historial de Pagos"
3. Edita la deuda inicial:
   - Configura cuotas adeudadas
   - Define período desde/hasta
4. Guarda → El sistema recalcula automáticamente

### Problema: No se actualiza el estado después de pagar

**Solución:**
```sql
-- Verificar que el trigger está activo
SELECT * FROM pg_trigger WHERE tgname = 'trigger_actualizar_estado_pago';

-- Si no existe, ejecutar:
-- supabase/migrations/20260113000000_deuda_inicial_y_periodos.sql
```

### Problema: Cliente nuevo muestra "Debe 12 meses"

**Causa:** No tiene configurada `fecha_alta_sistema`

**Solución:**
```sql
UPDATE client_fiscal_data
SET fecha_alta_sistema = DATE(created_at)
WHERE fecha_alta_sistema IS NULL;
```

---

## 📊 MONITOREO

### Query útiles para monitorear

```sql
-- Clientes con deuda inicial configurada
SELECT razon_social, cuotas_adeudadas_al_alta,
       periodo_deuda_desde, periodo_deuda_hasta, estado_pago_monotributo
FROM client_fiscal_data
WHERE cuotas_adeudadas_al_alta > 0
ORDER BY cuotas_adeudadas_al_alta DESC;

-- Distribución de estados de pago
SELECT estado_pago_monotributo, COUNT(*) as cantidad
FROM client_fiscal_data
WHERE tipo_contribuyente = 'monotributista'
GROUP BY estado_pago_monotributo;

-- Clientes sin fecha_alta_sistema
SELECT razon_social, created_at, fecha_alta_sistema
FROM client_fiscal_data
WHERE fecha_alta_sistema IS NULL
AND tipo_contribuyente = 'monotributista';
```

---

## 📈 MÉTRICAS Y REPORTES

Puedes consultar fácilmente:

```sql
-- Cuántos clientes están al día
SELECT COUNT(*) FROM client_fiscal_data
WHERE estado_pago_monotributo = 'al_dia'
AND tipo_contribuyente = 'monotributista';

-- Cuántos deben 1 cuota
SELECT COUNT(*) FROM client_fiscal_data
WHERE estado_pago_monotributo = 'debe_1_cuota'
AND tipo_contribuyente = 'monotributista';

-- Total de deuda inicial en el sistema
SELECT SUM(cuotas_adeudadas_al_alta) as total_cuotas_adeudadas
FROM client_fiscal_data
WHERE tipo_contribuyente = 'monotributista';
```

---

## 🎓 CONCEPTOS CLAVE

### 1. Fecha de alta vs Created at

- **created_at**: Cuando se creó el registro en la BD
- **fecha_alta_sistema**: Cuándo el cliente se dio de alta realmente (puede editarse)

### 2. Deuda inicial vs Cuotas posteriores

- **Deuda inicial**: Lo que debía ANTES de entrar al sistema
- **Cuotas posteriores**: Meses DESPUÉS del alta que no se pagaron

El sistema SUMA ambos para calcular el estado total.

### 3. Doble conteo - EVITADO

Si un mes está en `periodo_deuda_desde/hasta`, NO se cuenta dos veces:
- O se cuenta como parte de `cuotas_adeudadas_al_alta`
- O se cuenta como cuota sin registro
- Pero NUNCA ambos

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Aplicar migración SQL en Supabase
- [ ] Verificar función `calcular_estado_pago_monotributo`
- [ ] Verificar trigger `trigger_ajustar_deuda_inicial`
- [ ] Recalcular estados de todos los clientes
- [ ] Probar UI en desarrollo (http://localhost:4000)
- [ ] Configurar deuda inicial de juan@gmail.com
- [ ] Verificar que juan@gmail.com muestra 'debe_1_cuota'
- [ ] Marcar Diciembre como pagada
- [ ] Verificar que juan@gmail.com pasa a 'al_dia'
- [ ] Probar con otros clientes

---

Fecha: 12 Enero 2026
Versión: 1.0
