# 📊 LÓGICA DE CÁLCULO DE DEUDAS - VERSIÓN CORREGIDA

## 🔍 ANÁLISIS REAL DE LA FUNCIÓN ACTUAL

### Cómo funciona REALMENTE (código líneas 39-63)

```sql
FOR i IN 1..12 LOOP
    SELECT estado INTO v_cuota_estado
    FROM client_cuota_mensual
    WHERE client_id = p_client_id
      AND anio = v_anio_check
      AND mes = v_mes_check
      AND estado IN ('informada', 'verificada')
    LIMIT 1;

    -- Si encontró pago, DETENER
    IF v_cuota_estado IS NOT NULL THEN
        EXIT;
    END IF;

    -- NO encontró pago → incrementar deuda
    v_meses_adeudados := v_meses_adeudados + 1;

    -- Retroceder un mes
    v_mes_check := v_mes_check - 1;
    ...
END LOOP;
```

**Lógica:**
1. ✅ Si NO encuentra registro → cuenta como adeudado
2. ✅ Si encuentra pago → detiene conteo
3. ✅ Retrocede máximo 12 meses

---

## ⚠️ CORRECCIÓN: El Problema Real

### Caso juan@gmail.com (CORREGIDO)

**Escenario 1 - Lo que DEBERÍA pasar:**
```
Alta: 7 Enero 2026, debe 1 cuota (Diciembre 2025)
Hoy: 12 Enero 2026 (< 20 → evalúa desde Diciembre)

Loop:
  1. Diciembre 2025 → NO encuentra pago → meses_adeudados = 1
  2. Noviembre 2025 → NO encuentra pago → meses_adeudados = 2
  3. Octubre 2025   → NO encuentra pago → meses_adeudados = 3
  ...
  12. Enero 2025    → NO encuentra pago → meses_adeudados = 12

Resultado: 'debe_2_mas' ❌ (incorrecto, debería ser 'debe_1_cuota')
```

**Escenario 2 - Por qué dice "al día":**

Probablemente existe UN REGISTRO antiguo (ej: de hace 3-4 meses) que cuando retrocede lo encuentra:

```
Loop:
  1. Diciembre 2025 → NO encuentra → meses_adeudados = 1
  2. Noviembre 2025 → NO encuentra → meses_adeudados = 2
  3. Octubre 2025   → SÍ encuentra (estado='informada') → EXIT

Resultado: 'debe_2_mas' pero si hubo un pago viejo más atrás y solo debe 1 real
```

O peor:
```
Loop:
  1. Diciembre 2025 → SÍ encuentra algo viejo → EXIT inmediato

Resultado: 'al_dia' ✅ (incorrecto si el registro no corresponde)
```

---

## 🐛 PROBLEMAS IDENTIFICADOS (ChatGPT + Revisión)

### Problema 1: Sin contexto de "fecha de alta"

La función cuenta TODOS los meses hacia atrás sin saber:
- ¿Cuándo se dio de alta el cliente?
- ¿Qué deuda tenía AL INGRESAR?

**Impacto:**
- Cliente nuevo (1 semana en el sistema) → cuenta 12 meses atrás
- Marca "debe_2_mas" aunque solo existe hace 1 semana

### Problema 2: "Al día" sin evidencia = PELIGROSO

Si un cliente se da de alta hoy y NO tiene ningún registro:
- meses_adeudados = 12 → 'debe_2_mas'

PERO si tiene UN pago viejo (ej: de hace 6 meses):
- meses_adeudados = 0 → 'al_dia'

**ChatGPT tiene razón:** Sin datos confiables → debería ser `'desconocido'`

### Problema 3: Doble conteo con deuda_inicial

Si sumamos directamente `deuda_inicial` + `meses_adeudados`:

```sql
v_meses_adeudados := v_meses_adeudados + deuda_inicial;
```

Y luego alguien carga períodos retroactivos → SE SUMA DOS VECES

### Problema 4: No distingue "sin registro" vs "pendiente explícito"

Actualmente:
- NO hay registro de Diciembre → cuenta como adeudado
- SÍ hay registro con estado='pendiente' → ???

No está claro si busca solo 'informada'/'verificada' o también considera 'pendiente'.

---

## 🔧 SOLUCIÓN ROBUSTA (Incorporando feedback ChatGPT)

### 1. Campos en `client_fiscal_data`

```sql
ALTER TABLE public.client_fiscal_data

-- Deuda al alta (mejorado)
ADD COLUMN fecha_alta_sistema DATE DEFAULT CURRENT_DATE,
ADD COLUMN cuotas_adeudadas_al_alta INTEGER DEFAULT 0,
ADD COLUMN periodo_deuda_desde DATE,  -- Nuevo: desde qué mes debe
ADD COLUMN periodo_deuda_hasta DATE,  -- Nuevo: hasta qué mes debe
ADD COLUMN notas_deuda_inicial TEXT,

-- Estado con "desconocido" como opción real
-- (ya existe pero necesita uso correcto)
CHECK (estado_pago_monotributo IN ('al_dia', 'debe_1_cuota', 'debe_2_mas', 'desconocido'));
```

**Ejemplo de carga:**
```sql
-- Cliente que se da de alta debiendo Mayo-2025 a Diciembre-2025 (8 meses)
INSERT INTO client_fiscal_data (
    fecha_alta_sistema,
    cuotas_adeudadas_al_alta,
    periodo_deuda_desde,
    periodo_deuda_hasta,
    notas_deuda_inicial
) VALUES (
    '2026-01-07',
    8,
    '2025-05-01',
    '2025-12-01',
    'Cliente llegó con deuda Mayo-Dic 2025'
);
```

---

### 2. Función CORREGIDA (a prueba de balas)

```sql
CREATE OR REPLACE FUNCTION public.calcular_estado_pago_monotributo(p_client_id UUID)
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

    -- NUEVOS: Control de contexto
    v_fecha_alta DATE;
    v_deuda_inicial INTEGER;
    v_periodo_desde DATE;
    v_periodo_hasta DATE;
    v_meses_desde_alta INTEGER;
    v_tiene_datos BOOLEAN := FALSE;
    v_fecha_check DATE;
BEGIN
    -- 1. Obtener contexto del cliente
    SELECT
        fecha_alta_sistema,
        cuotas_adeudadas_al_alta,
        periodo_deuda_desde,
        periodo_deuda_hasta
    INTO
        v_fecha_alta,
        v_deuda_inicial,
        v_periodo_desde,
        v_periodo_hasta
    FROM public.client_fiscal_data
    WHERE id = p_client_id;

    -- 2. Obtener fecha actual en Argentina
    v_ahora_arg := NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires';
    v_dia_actual := EXTRACT(DAY FROM v_ahora_arg);
    v_mes_actual := EXTRACT(MONTH FROM v_ahora_arg);
    v_anio_actual := EXTRACT(YEAR FROM v_ahora_arg);

    v_anio_check := v_anio_actual;
    v_mes_check := v_mes_actual;

    -- 3. Ajustar por día 20
    IF v_dia_actual < 20 THEN
        v_mes_check := v_mes_check - 1;
        IF v_mes_check = 0 THEN
            v_mes_check := 12;
            v_anio_check := v_anio_check - 1;
        END IF;
    END IF;

    -- 4. Calcular cuántos meses desde el alta
    IF v_fecha_alta IS NOT NULL THEN
        v_meses_desde_alta := (
            (v_anio_check - EXTRACT(YEAR FROM v_fecha_alta)) * 12 +
            (v_mes_check - EXTRACT(MONTH FROM v_fecha_alta))
        );

        -- Si se dio de alta hace menos de 1 mes y no tiene deuda inicial
        -- → retornar 'desconocido' (sin datos suficientes)
        IF v_meses_desde_alta < 1 AND COALESCE(v_deuda_inicial, 0) = 0 THEN
            RETURN 'desconocido';
        END IF;
    ELSE
        -- Cliente sin fecha_alta (legacy) → usar límite de 12 meses
        v_meses_desde_alta := 12;
    END IF;

    -- 5. Contar meses adeudados SOLO desde la fecha de alta
    FOR i IN 1..LEAST(12, v_meses_desde_alta + 1) LOOP
        -- Construir fecha del mes a verificar
        v_fecha_check := make_date(v_anio_check, v_mes_check, 1);

        -- Si retrocedimos antes de la fecha de alta, DETENER
        IF v_fecha_alta IS NOT NULL AND v_fecha_check < v_fecha_alta THEN
            EXIT;
        END IF;

        -- Verificar si este mes está en el período de deuda inicial
        -- (para NO contarlo dos veces)
        IF v_periodo_desde IS NOT NULL AND v_periodo_hasta IS NOT NULL THEN
            IF v_fecha_check >= v_periodo_desde AND v_fecha_check <= v_periodo_hasta THEN
                -- Este mes está cubierto por deuda_inicial, saltar
                v_mes_check := v_mes_check - 1;
                IF v_mes_check = 0 THEN
                    v_mes_check := 12;
                    v_anio_check := v_anio_check - 1;
                END IF;
                CONTINUE;
            END IF;
        END IF;

        -- Buscar cuota pagada para este mes
        SELECT estado INTO v_cuota_estado
        FROM public.client_cuota_mensual
        WHERE client_id = p_client_id
          AND anio = v_anio_check
          AND mes = v_mes_check
          AND estado IN ('informada', 'verificada')
        LIMIT 1;

        -- Si encontró pago, marcar que hay datos y detener
        IF v_cuota_estado IS NOT NULL THEN
            v_tiene_datos := TRUE;
            EXIT;
        END IF;

        -- NO encontró pago → verificar si hay registro pendiente
        SELECT COUNT(*) > 0 INTO v_tiene_datos
        FROM public.client_cuota_mensual
        WHERE client_id = p_client_id
          AND anio = v_anio_check
          AND mes = v_mes_check;

        -- Incrementar adeudado
        v_meses_adeudados := v_meses_adeudados + 1;

        -- Retroceder un mes
        v_mes_check := v_mes_check - 1;
        IF v_mes_check = 0 THEN
            v_mes_check := 12;
            v_anio_check := v_anio_check - 1;
        END IF;
    END LOOP;

    -- 6. SUMAR deuda inicial (solo si está configurada)
    IF v_deuda_inicial IS NOT NULL AND v_deuda_inicial > 0 THEN
        v_meses_adeudados := v_meses_adeudados + v_deuda_inicial;
        v_tiene_datos := TRUE;
    END IF;

    -- 7. Clasificar con protección de "sin datos"
    -- Si no tiene datos Y no tiene deuda inicial → desconocido
    IF NOT v_tiene_datos AND v_meses_adeudados = 0 THEN
        RETURN 'desconocido';
    END IF;

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

---

## ✅ MEJORAS IMPLEMENTADAS (según feedback ChatGPT)

### ✓ 1. Contexto de fecha de alta
- NO cuenta meses antes del alta
- Evita "debe 12 meses" en cliente nuevo

### ✓ 2. Estado 'desconocido' real
```sql
-- Cliente nuevo sin datos → 'desconocido'
IF v_meses_desde_alta < 1 AND deuda_inicial = 0 THEN
    RETURN 'desconocido';
END IF;
```

### ✓ 3. NO doble-contar deuda inicial
```sql
-- Si el mes está en periodo_deuda_desde/hasta → SKIP
IF v_fecha_check >= v_periodo_desde AND v_fecha_check <= v_periodo_hasta THEN
    CONTINUE; -- No cuenta este mes
END IF;
```

### ✓ 4. Períodos específicos en lugar de solo cantidad
```sql
periodo_deuda_desde: '2025-05-01'
periodo_deuda_hasta: '2025-12-01'
```
Así se muestra: **"Debe: Mayo-2025 → Diciembre-2025"**

### ✓ 5. Validación en alta de cliente
```javascript
// En formulario de alta
if (estado_pago === 'al_dia' && cuotas_adeudadas > 0) {
    error('No puede estar al día y deber cuotas simultáneamente');
}
```

---

## 🎯 CASOS DE USO RESUELTOS

### Caso A: Cliente nuevo sin deuda
```
Alta: 10 Enero 2026
Deuda inicial: 0
Hoy: 12 Enero 2026

Resultado: 'desconocido' (aún no hay datos suficientes)
```

### Caso B: juan@gmail.com CORREGIDO
```
Alta: 7 Enero 2026
Deuda inicial: 1 cuota (Diciembre 2025)
periodo_desde: 2025-12-01
periodo_hasta: 2025-12-01
Hoy: 12 Enero 2026

Loop:
  - Diciembre 2025 → está en período de deuda inicial → SKIP
  - NO retrocede más (fecha_alta limita)

Meses adeudados desde sistema: 0
Deuda inicial: 1

Total: 1 mes
Resultado: 'debe_1_cuota' ✅
```

### Caso C: Cliente paga Diciembre
```
Alta: 7 Enero 2026
Deuda inicial: 1 (Diciembre)
Acción: Paga Diciembre el 15 Enero

Loop:
  - Diciembre 2025 → encuentra pago 'informada' → EXIT

Meses adeudados: 0
Deuda inicial: 1 (pero ya está cubierto por el pago)

¿Cómo resolvemos esto?
→ Al registrar pago de Diciembre, DECREMENTAR cuotas_adeudadas_al_alta
```

---

## 🔄 LÓGICA DE PAGOS DE DEUDA INICIAL

Cuando un cliente paga un mes que está en su deuda inicial:

```sql
CREATE OR REPLACE FUNCTION registrar_pago_y_ajustar_deuda()
RETURNS TRIGGER AS $$
DECLARE
    v_periodo_desde DATE;
    v_periodo_hasta DATE;
    v_deuda_inicial INTEGER;
BEGIN
    -- Obtener datos de deuda inicial
    SELECT periodo_deuda_desde, periodo_deuda_hasta, cuotas_adeudadas_al_alta
    INTO v_periodo_desde, v_periodo_hasta, v_deuda_inicial
    FROM client_fiscal_data
    WHERE id = NEW.client_id;

    -- Si el mes pagado está en el rango de deuda inicial
    IF v_periodo_desde IS NOT NULL AND v_periodo_hasta IS NOT NULL THEN
        IF make_date(NEW.anio, NEW.mes, 1) >= v_periodo_desde
           AND make_date(NEW.anio, NEW.mes, 1) <= v_periodo_hasta THEN

            -- Decrementar deuda inicial
            UPDATE client_fiscal_data
            SET cuotas_adeudadas_al_alta = GREATEST(0, cuotas_adeudadas_al_alta - 1)
            WHERE id = NEW.client_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📋 PLAN DE IMPLEMENTACIÓN

### Fase 1: Migración de datos
```sql
-- 1. Agregar campos nuevos
ALTER TABLE client_fiscal_data
ADD COLUMN fecha_alta_sistema DATE,
ADD COLUMN periodo_deuda_desde DATE,
ADD COLUMN periodo_deuda_hasta DATE;

-- 2. Inicializar fecha_alta para clientes existentes
UPDATE client_fiscal_data
SET fecha_alta_sistema = DATE(created_at)
WHERE fecha_alta_sistema IS NULL;
```

### Fase 2: Actualizar función
- Reemplazar función con versión corregida

### Fase 3: Actualizar UI
- Formulario de alta con validaciones
- Mostrar períodos específicos en lugar de solo cantidad

### Fase 4: Recalcular todos
```sql
UPDATE client_fiscal_data
SET estado_pago_monotributo = calcular_estado_pago_monotributo(id)
WHERE tipo_contribuyente = 'monotributista';
```

---

## 🎓 CONCLUSIÓN

ChatGPT tenía razón en:
✅ Mi explicación del bug estaba confusa
✅ Riesgo de doble conteo con deuda_inicial
✅ Peligro de "al día" sin evidencia
✅ Necesidad de períodos específicos
✅ Validaciones en el alta

**Esta versión corregida:**
- ✓ Considera fecha de alta
- ✓ No cuenta antes del alta
- ✓ Usa 'desconocido' cuando corresponde
- ✓ Evita doble conteo
- ✓ Guarda períodos específicos
- ✓ Ajusta deuda al pagar

---

Fecha: 12 Enero 2026
Versión: 2.0 (Corregida)
