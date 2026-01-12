# 📊 LÓGICA COMPLETA DE CÁLCULO DE DEUDAS - MonoGestión

## 🔍 Análisis Detallado del Sistema

### 1. CÓMO FUNCIONA ACTUALMENTE

#### Tabla Principal: `client_cuota_mensual`
```sql
CREATE TABLE client_cuota_mensual (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES client_fiscal_data(id),
    anio INTEGER,
    mes INTEGER,
    monto_cuota DECIMAL(10,2),
    estado TEXT CHECK (estado IN ('pendiente', 'informada', 'verificada')),
    fecha_pago DATE,
    comprobante_url TEXT,
    informado_por UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    UNIQUE(client_id, anio, mes)
)
```

#### Campo en `client_fiscal_data`
```sql
estado_pago_monotributo TEXT
    CHECK (estado_pago_monotributo IN ('al_dia', 'debe_1_cuota', 'debe_2_mas', 'desconocido'))
    DEFAULT 'al_dia'
```

---

### 2. FUNCIÓN DE CÁLCULO AUTOMÁTICO

#### Función: `calcular_estado_pago_monotributo(p_client_id UUID)`

**Ubicación:** `SQL_tables/EJECUTAR_MANUAL_estado_pago.sql` líneas 20-79

**Lógica paso a paso:**

```
1. Obtener fecha actual en Argentina (UTC-3)
   └─ v_ahora_arg = NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires'

2. Determinar desde qué mes empezar a contar:
   ├─ Si día actual < 20  → evaluar desde mes ANTERIOR
   └─ Si día actual >= 20 → evaluar desde mes ACTUAL

   Ejemplo:
   - Hoy: 11 Enero 2026 → evaluar desde Diciembre 2025
   - Hoy: 25 Enero 2026 → evaluar desde Enero 2026

3. Contar meses adeudados (hacia atrás, máximo 12 meses):
   FOR i IN 1..12 LOOP
       ¿Existe registro con estado 'informada' o 'verificada'?
       ├─ SÍ → DETENER CONTEO (encontró cuota pagada)
       └─ NO → meses_adeudados++, retroceder 1 mes
   END LOOP

4. Clasificar resultado:
   ├─ 0 meses adeudados → 'al_dia'
   ├─ 1 mes adeudado    → 'debe_1_cuota'
   └─ 2+ meses          → 'debe_2_mas'
```

**Trigger que actualiza automáticamente:**
```sql
CREATE TRIGGER trigger_actualizar_estado_pago
    AFTER INSERT OR UPDATE ON client_cuota_mensual
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_estado_pago_trigger();
```

---

### 3. EJEMPLOS DE FUNCIONAMIENTO

#### Caso A: Cliente al día
```
Fecha actual: 11 Enero 2026 (antes del día 20)
Evaluación desde: Diciembre 2025

Verificación:
- Diciembre 2025: ✓ Tiene registro con estado='informada'

Resultado: 'al_dia' (0 meses adeudados)
```

#### Caso B: Cliente debe 1 cuota
```
Fecha actual: 25 Enero 2026 (después del día 20)
Evaluación desde: Enero 2026

Verificación:
- Enero 2026:     ✗ NO tiene registro
- Diciembre 2025: ✓ Tiene registro con estado='informada'

Resultado: 'debe_1_cuota' (1 mes adeudado)
```

#### Caso C: Cliente debe 2+ cuotas
```
Fecha actual: 15 Marzo 2026
Evaluación desde: Febrero 2026 (día < 20)

Verificación:
- Febrero 2026:   ✗ NO tiene registro
- Enero 2026:     ✗ NO tiene registro
- Diciembre 2025: ✓ Tiene registro con estado='informada'

Resultado: 'debe_2_mas' (2 meses adeudados)
```

---

## ⚠️ PROBLEMA IDENTIFICADO

### El problema reportado:

**Cliente:** juan@gmail.com
**Estado registrado al alta:** Debe 1 cuota
**Estado mostrado al usuario:** Al día ✓

### ¿Por qué ocurre?

La función `calcular_estado_pago_monotributo()` **SOLO** mira registros en la tabla `client_cuota_mensual`.

**Escenario problemático:**

1. **Alta del cliente (7 Enero 2026)**
   - Cliente se inscribe en el sistema
   - Llega con deuda de 1 cuota atrasada (Diciembre 2025)
   - Se registra `estado_pago_monotributo = 'debe_1_cuota'` manualmente

2. **Situación actual (12 Enero 2026)**
   - La función busca: ¿Existe registro de Diciembre 2025?
   - Respuesta: NO existe en `client_cuota_mensual`
   - **PERO** la función cuenta hacia atrás y como NO encuentra ningún registro, retorna 'al_dia'

### La raíz del problema:

```
❌ NO CONSIDERA:
- Deuda inicial al momento del alta
- Fecha de alta en el sistema
- Cuántas cuotas debía antes de ingresar al sistema

✓ SOLO CONSIDERA:
- Registros en client_cuota_mensual con estado 'informada' o 'verificada'
- Cuenta meses consecutivos hacia atrás
- Se detiene cuando encuentra un pago
```

---

## 🔧 SOLUCIONES PROPUESTAS

### OPCIÓN 1: Campo de "deuda inicial" (RECOMENDADA)

**Agregar campos a `client_fiscal_data`:**

```sql
ALTER TABLE client_fiscal_data
ADD COLUMN cuotas_adeudadas_al_alta INTEGER DEFAULT 0,
ADD COLUMN fecha_alta_sistema DATE,
ADD COLUMN notas_deuda_inicial TEXT;
```

**Modificar función de cálculo:**

```sql
CREATE OR REPLACE FUNCTION calcular_estado_pago_monotributo(p_client_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_ahora_arg TIMESTAMP;
    v_dia_actual INTEGER;
    v_mes_actual INTEGER;
    v_anio_actual INTEGER;
    v_meses_adeudados INTEGER := 0;
    v_anio_check INTEGER;
    v_mes_check INTEGER;
    v_cuota_estado TEXT;
    v_max_meses_check INTEGER := 12;

    -- NUEVOS: Para deuda inicial
    v_deuda_inicial INTEGER;
    v_fecha_alta DATE;
    v_meses_desde_alta INTEGER;
BEGIN
    -- Obtener deuda inicial y fecha de alta
    SELECT cuotas_adeudadas_al_alta, fecha_alta_sistema
    INTO v_deuda_inicial, v_fecha_alta
    FROM client_fiscal_data
    WHERE id = p_client_id;

    -- Si no tiene fecha de alta, usar NULL (cliente antiguo)
    IF v_fecha_alta IS NULL THEN
        v_deuda_inicial := 0;
    END IF;

    v_ahora_arg := NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires';
    v_dia_actual := EXTRACT(DAY FROM v_ahora_arg);
    v_mes_actual := EXTRACT(MONTH FROM v_ahora_arg);
    v_anio_actual := EXTRACT(YEAR FROM v_ahora_arg);

    v_anio_check := v_anio_actual;
    v_mes_check := v_mes_actual;

    -- Si es antes del día 20, empezar desde mes anterior
    IF v_dia_actual < 20 THEN
        v_mes_check := v_mes_check - 1;
        IF v_mes_check = 0 THEN
            v_mes_check := 12;
            v_anio_check := v_anio_check - 1;
        END IF;
    END IF;

    -- Calcular cuántos meses pasaron desde el alta
    IF v_fecha_alta IS NOT NULL THEN
        v_meses_desde_alta := (
            (v_anio_check - EXTRACT(YEAR FROM v_fecha_alta)) * 12 +
            (v_mes_check - EXTRACT(MONTH FROM v_fecha_alta))
        );

        -- Limitar búsqueda a meses desde el alta
        IF v_meses_desde_alta < v_max_meses_check THEN
            v_max_meses_check := v_meses_desde_alta + 1;
        END IF;
    END IF;

    -- Contar meses adeudados desde el mes a evaluar hacia atrás
    FOR i IN 1..v_max_meses_check LOOP
        -- Si llegamos a la fecha de alta, detenerse
        IF v_fecha_alta IS NOT NULL THEN
            IF (v_anio_check < EXTRACT(YEAR FROM v_fecha_alta)) OR
               (v_anio_check = EXTRACT(YEAR FROM v_fecha_alta) AND
                v_mes_check < EXTRACT(MONTH FROM v_fecha_alta)) THEN
                EXIT;
            END IF;
        END IF;

        -- Buscar si hay cuota pagada este mes
        SELECT estado INTO v_cuota_estado
        FROM client_cuota_mensual
        WHERE client_id = p_client_id
          AND anio = v_anio_check
          AND mes = v_mes_check
          AND estado IN ('informada', 'verificada')
        LIMIT 1;

        -- Si encontró cuota pagada, detener
        IF v_cuota_estado IS NOT NULL THEN
            EXIT;
        END IF;

        -- No encontró cuota pagada, incrementar contador
        v_meses_adeudados := v_meses_adeudados + 1;

        -- Retroceder un mes
        v_mes_check := v_mes_check - 1;
        IF v_mes_check = 0 THEN
            v_mes_check := 12;
            v_anio_check := v_anio_check - 1;
        END IF;
    END LOOP;

    -- SUMAR la deuda inicial
    v_meses_adeudados := v_meses_adeudados + COALESCE(v_deuda_inicial, 0);

    -- Clasificar
    IF v_meses_adeudados = 0 THEN
        RETURN 'al_dia';
    ELSIF v_meses_adeudados = 1 THEN
        RETURN 'debe_1_cuota';
    ELSE
        RETURN 'debe_2_mas';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Ventajas:**
✓ Solución limpia y clara
✓ Mantiene registro histórico de deuda inicial
✓ Fácil de auditar
✓ No requiere crear registros "falsos" en client_cuota_mensual

**Desventajas:**
- Requiere migración de datos existentes
- Los clientes actuales necesitan que se les configure la fecha_alta_sistema

---

### OPCIÓN 2: Crear registros retroactivos en `client_cuota_mensual`

Al dar de alta un cliente con deuda, crear registros con `estado='pendiente'` para los meses adeudados.

**Ejemplo:**
```sql
-- Cliente dado de alta el 7 Enero 2026, debe 1 cuota (Diciembre 2025)
INSERT INTO client_cuota_mensual (client_id, anio, mes, estado, monto_cuota)
VALUES
    ('uuid-cliente', 2025, 12, 'pendiente', 150000);
```

**Ventajas:**
✓ No requiere cambiar la lógica de cálculo
✓ Usa el sistema existente

**Desventajas:**
❌ Crea datos "artificiales"
❌ Puede confundir sobre el origen de la deuda
❌ Dificulta distinguir entre cuotas históricas y nuevas

---

### OPCIÓN 3: Hybrid - Mejor de ambos mundos

1. Agregar campos de deuda inicial (OPCIÓN 1)
2. Al dar de alta, OPCIONALMENTE crear registros retroactivos si se desea
3. La función considera AMBOS: registros + deuda_inicial

**Ventajas:**
✓ Máxima flexibilidad
✓ Auditabilidad completa
✓ Permite elegir método según caso

---

## 📝 RECOMENDACIÓN FINAL

**Implementar OPCIÓN 1** por las siguientes razones:

1. **Claridad:** Separa claramente deuda inicial de cuotas nuevas
2. **Auditabilidad:** Se sabe exactamente cuánto debía al ingresar
3. **Escalabilidad:** Fácil agregar más campos si se necesita (ej: fecha_regularizacion)
4. **Transparencia:** El cliente y la contadora ven claramente el origen de la deuda

---

## 🚀 PASOS DE IMPLEMENTACIÓN

### 1. Crear migración SQL
```sql
-- Archivo: supabase/migrations/20260113000000_deuda_inicial.sql

-- Agregar campos
ALTER TABLE public.client_fiscal_data
ADD COLUMN IF NOT EXISTS cuotas_adeudadas_al_alta INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fecha_alta_sistema DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS notas_deuda_inicial TEXT;

-- Comentarios
COMMENT ON COLUMN client_fiscal_data.cuotas_adeudadas_al_alta
    IS 'Cantidad de cuotas que debía al momento de darse de alta en el sistema';
COMMENT ON COLUMN client_fiscal_data.fecha_alta_sistema
    IS 'Fecha en que el cliente fue dado de alta en MonoGestión';
COMMENT ON COLUMN client_fiscal_data.notas_deuda_inicial
    IS 'Notas sobre la deuda inicial (ej: "Debe Dic-2025 y Nov-2025")';

-- Actualizar clientes existentes con fecha de alta = created_at
UPDATE public.client_fiscal_data
SET fecha_alta_sistema = DATE(created_at)
WHERE fecha_alta_sistema IS NULL;
```

### 2. Actualizar función de cálculo
(Ver código completo en OPCIÓN 1)

### 3. Actualizar formulario de alta de clientes

En `src/modules/users/components/FiscalDataForm.jsx` agregar campos:

```jsx
<div className="space-y-4">
  <h3>Situación de pago al alta</h3>

  <div>
    <label>¿Cuántas cuotas debe?</label>
    <input
      type="number"
      name="cuotas_adeudadas_al_alta"
      min="0"
      max="12"
      defaultValue={0}
    />
  </div>

  <div>
    <label>Notas sobre deuda inicial</label>
    <textarea
      name="notas_deuda_inicial"
      placeholder="Ej: Debe Diciembre 2025 y Noviembre 2025"
    />
  </div>
</div>
```

### 4. Recalcular todos los clientes
```sql
UPDATE client_fiscal_data
SET estado_pago_monotributo = calcular_estado_pago_monotributo(id)
WHERE tipo_contribuyente = 'monotributista';
```

---

## 📊 CASO ESPECÍFICO: juan@gmail.com

### Solución inmediata:

```sql
-- 1. Verificar datos actuales
SELECT id, razon_social, estado_pago_monotributo,
       calcular_estado_pago_monotributo(id) as estado_calculado
FROM client_fiscal_data
WHERE user_id = (SELECT id FROM profiles WHERE email = 'juan@gmail.com');

-- 2. Actualizar con deuda inicial
UPDATE client_fiscal_data
SET cuotas_adeudadas_al_alta = 1,
    fecha_alta_sistema = '2026-01-07',
    notas_deuda_inicial = 'Cliente llegó debiendo Diciembre 2025'
WHERE user_id = (SELECT id FROM profiles WHERE email = 'juan@gmail.com');

-- 3. Recalcular estado
UPDATE client_fiscal_data
SET estado_pago_monotributo = calcular_estado_pago_monotributo(id)
WHERE user_id = (SELECT id FROM profiles WHERE email = 'juan@gmail.com');
```

---

## 🎯 CONCLUSIÓN

El sistema actual funciona perfectamente para clientes que se dan de alta **sin deuda previa**.

Para clientes con deuda anterior al alta, se necesita:
1. ✅ Registrar la deuda inicial
2. ✅ Fecha de alta en el sistema
3. ✅ Modificar la función de cálculo para considerar ambos

**Esto garantiza:**
- ✓ Cálculo correcto del estado de pago
- ✓ Visibilidad de deuda histórica
- ✓ Claridad para cliente y contadora
- ✓ Base para futuros reportes y auditorías

---

Fecha de análisis: 12 Enero 2026
Versión: 1.0
Analista: Claude AI
