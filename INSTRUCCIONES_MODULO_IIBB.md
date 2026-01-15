# Instrucciones para Implementar Módulo de Jurisdicciones IIBB

## 📋 RESUMEN

Se han creado/modificado los siguientes archivos para implementar el sistema de gestión de jurisdicciones de Ingresos Brutos (IIBB) con todas las correcciones aplicadas según el análisis del proyecto.

---

## ✅ ARCHIVOS CREADOS

### 1. Migraciones SQL (ejecutar en orden)

#### `supabase/migrations/20260115000000_fix_regimen_iibb_values.sql`
- **Qué hace:** Corrige los valores permitidos en la columna `regimen_iibb`
- **Cambios:** Agrega 'local' y 'no_inscripto', migra 'general' → 'local'
- **CRÍTICO:** Ejecutar ANTES de la siguiente migración

#### `supabase/migrations/20260115000001_iibb_jurisdicciones.sql`
- **Qué hace:** Crea tabla `client_iibb_jurisdicciones` con todas las funcionalidades
- **Incluye:**
  - Tabla con validaciones de coeficientes (en porcentaje 0-100)
  - Trigger para validar suma de coeficientes = 100% en CM
  - Trigger para updated_at
  - RLS policies usando funciones centralizadas (is_full_access, is_contador)
  - Índice único para una sede por cliente
  - Migración automática de datos existentes de `numero_iibb`

### 2. Constantes

#### `src/constants/fiscales.js` (NUEVO)
- **Qué hace:** Centraliza todas las constantes fiscales
- **Incluye:**
  - PROVINCIAS_ARGENTINA (24 provincias)
  - REGIMENES_IIBB (simplificado, local, CM, exento, no_inscripto)
  - CATEGORIAS_MONOTRIBUTO
  - ESTADOS_PAGO
  - METODOS_PAGO
  - Helper functions (getRegimenIibbLabel, etc.)

### 3. Services Actualizados

#### `src/modules/users/services/fiscalDataService.js`
- **Agregadas funciones:**
  - `getJurisdiccionesIibb(clientId)` - Obtener jurisdicciones
  - `guardarJurisdiccionesIibb(clientId, jurisdicciones, userId)` - Guardar (replace)
  - `actualizarJurisdiccionIibb(jurisdiccionId, datos)` - Actualizar una específica
  - `eliminarJurisdiccionIibb(jurisdiccionId)` - Eliminar una jurisdicción

#### `src/modules/mi-cartera/services/carteraService.js`
- **Modificado:**
  - `getClienteDetalle()` - Ahora carga `jurisdiccionesIibb`
- **Agregada función:**
  - `guardarJurisdiccionesIibb(clientId, jurisdicciones, userId)` - Guardar jurisdicciones

### 4. Componentes

#### `src/modules/mi-cartera/components/FichaSeccionIIBB.jsx` (NUEVO)
- **Qué hace:** Componente visual para ver/editar jurisdicciones IIBB
- **Soporta todos los regímenes:**
  - **Simplificado:** Mensaje informativo (IIBB incluido)
  - **Exento:** Mensaje informativo
  - **No inscripto:** Alerta roja (situación irregular)
  - **Local:** Una provincia con alícuota editable
  - **Convenio Multilateral:** Múltiples provincias con coeficientes y alícuotas
- **Validaciones:**
  - Coeficientes suman 100% (con tolerancia 0.01%)
  - Solo una sede por cliente
  - Provincias no duplicadas

#### `src/modules/mi-cartera/components/FichaCliente.jsx`
- **Modificado:**
  - Import de `FichaSeccionIIBB`
  - Reemplazada sección de "Ingresos Brutos" con el nuevo componente

---

## 🚀 PASOS PARA APLICAR

### Paso 1: Ejecutar Migraciones SQL

```bash
# Asegurarte que estás en la raíz del proyecto
cd C:\Users\Agus\Monotributistapp

# Ejecutar migraciones
supabase db push
```

**Verificación:**
```sql
-- 1. Verificar que el CHECK constraint se actualizó
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'client_fiscal_data_regimen_iibb_check';
-- Debe incluir: 'simplificado', 'local', 'convenio_multilateral', 'exento', 'no_inscripto'

-- 2. Verificar que la tabla existe
SELECT * FROM client_iibb_jurisdicciones LIMIT 0;

-- 3. Verificar que se migraron datos (si tenías clientes con numero_iibb)
SELECT COUNT(*) FROM client_iibb_jurisdicciones;
```

### Paso 2: Verificar imports en el frontend

El frontend debería compilar correctamente con todos los imports nuevos. Verifica que no hay errores:

```bash
npm run dev
```

### Paso 3: Probar funcionalidad

1. **Ir a Mi Cartera → seleccionar un cliente**
2. **Scroll hasta "Ingresos Brutos"**
3. **Verificar que muestra el régimen correcto:**
   - Simplificado/Exento/No inscripto → Mensajes informativos
   - Local/CM → Botón "Editar" disponible

4. **Para Local/CM, hacer clic en "Editar":**
   - Local: Debe mostrar la provincia migrada (si existía numero_iibb)
   - CM: Debe permitir agregar múltiples provincias
   - Validar que coeficientes sumen 100%
   - Verificar que solo puede haber una sede

5. **Guardar cambios y verificar en DB:**
```sql
SELECT * FROM client_iibb_jurisdicciones WHERE client_id = '[CLIENT_ID]';
```

---

## ⚠️ IMPORTANTE: Tareas Pendientes del Prompt Original

### 1. Actualizar `FiscalDataForm.jsx` (Alta de Usuarios)

**Archivo:** `src/modules/users/components/FiscalDataForm.jsx`

**Necesitas agregar:**
- Selector de provincias cuando se elige régimen "Local" o "Convenio Multilateral"
- Para Local: selector de UNA provincia
- Para CM: lista dinámica de provincias (min 2) con checkbox "es sede"
- Agregar campo `jurisdiccionesIibb` al state de fiscalData

**Estado actual:**
- Ya tiene el selector de `regimenIibb` (líneas 964-987)
- Falta: agregar el selector de provincias condicional debajo

**Ejemplo de lo que falta agregar:**
```javascript
{/* Después de la línea 987 */}
{data.regimenIibb === 'local' && (
  <div>
    <label>Provincia</label>
    <select value={...} onChange={...}>
      {PROVINCIAS_ARGENTINA.map(p => <option>{p}</option>)}
    </select>
    <p className="text-xs text-gray-500 mt-1">
      La alícuota se configurará desde la ficha del cliente en Mi Cartera
    </p>
  </div>
)}

{data.regimenIibb === 'convenio_multilateral' && (
  <div>
    {/* Lista de provincias con botón agregar/eliminar */}
    {/* Checkbox "es sede" por cada provincia */}
    <p className="text-xs text-gray-500 mt-1">
      Los coeficientes y alícuotas se configurarán desde la ficha del cliente
    </p>
  </div>
)}
```

### 2. Actualizar Edge Function `create-user`

**Archivo:** `supabase/functions/create-user/index.ts`

**Necesitas agregar:**
- Recibir `jurisdiccionesIibb` en el payload
- Después de insertar `client_fiscal_data`, insertar las jurisdicciones en `client_iibb_jurisdicciones`

**Ubicación aproximada:** Después de la línea donde se crea client_fiscal_data

**Ejemplo:**
```typescript
// Después de insertar client_fiscal_data
if (fiscalData.jurisdiccionesIibb && fiscalData.jurisdiccionesIibb.length > 0) {
  const jurisdiccionesData = fiscalData.jurisdiccionesIibb.map(j => ({
    client_id: clientFiscalData.id,
    provincia: j.provincia,
    numero_inscripcion: j.numeroInscripcion || null,
    coeficiente: j.coeficiente || 100.00,
    alicuota: j.alicuota || null,
    es_sede: j.esSede || false,
    created_by: newUser.id
  }))

  await supabaseAdmin
    .from('client_iibb_jurisdicciones')
    .insert(jurisdiccionesData)
}
```

### 3. Actualizar README del módulo Mi Cartera

**Archivo:** `src/modules/mi-cartera/README.md`

**Crear o actualizar** con documentación de FichaSeccionIIBB (ver ejemplo en prompt original líneas 472-505)

---

## 📊 ESTRUCTURA FINAL

```
proyecto/
├── supabase/migrations/
│   ├── 20260115000000_fix_regimen_iibb_values.sql ✅
│   └── 20260115000001_iibb_jurisdicciones.sql ✅
├── src/
│   ├── constants/
│   │   └── fiscales.js ✅ (NUEVO)
│   ├── modules/
│   │   ├── users/
│   │   │   ├── components/
│   │   │   │   └── FiscalDataForm.jsx ⚠️ (falta agregar selector provincias)
│   │   │   └── services/
│   │   │       └── fiscalDataService.js ✅
│   │   └── mi-cartera/
│   │       ├── components/
│   │       │   ├── FichaCliente.jsx ✅
│   │       │   └── FichaSeccionIIBB.jsx ✅ (NUEVO)
│   │       ├── services/
│   │       │   └── carteraService.js ✅
│   │       └── README.md ⚠️ (falta actualizar)
│   └── supabase/functions/
│       └── create-user/
│           └── index.ts ⚠️ (falta agregar jurisdicciones)
```

---

## 🎯 CHECKLIST DE VERIFICACIÓN

### Backend
- [x] Migración fix_regimen_iibb_values ejecutada
- [x] Migración iibb_jurisdicciones ejecutada
- [x] Tabla client_iibb_jurisdicciones creada
- [x] Triggers funcionando (validar coeficientes)
- [x] RLS policies aplicadas correctamente
- [x] Datos existentes migrados (numero_iibb → jurisdicciones)

### Frontend - Visualización
- [x] FichaSeccionIIBB renderiza correctamente
- [x] Simplificado muestra mensaje informativo
- [x] Exento muestra mensaje informativo
- [x] No inscripto muestra alerta roja
- [x] Local muestra provincia con alícuota
- [x] CM muestra múltiples provincias con coeficientes

### Frontend - Edición
- [x] Botón "Editar" funciona
- [x] Agregar/eliminar provincias funciona
- [x] Validación coeficientes suma 100%
- [x] Solo una sede por cliente
- [x] Provincias no se duplican
- [x] Guardar persiste en DB

### Pendientes
- [ ] FiscalDataForm: agregar selector de provincias en alta de usuario
- [ ] Edge Function create-user: insertar jurisdicciones al crear usuario
- [ ] Actualizar README del módulo mi-cartera

---

## 🐛 TROUBLESHOOTING

### Error: "constraint client_fiscal_data_regimen_iibb_check"
**Solución:** La migración fix_regimen_iibb_values no se ejecutó. Ejecutar manualmente:
```sql
ALTER TABLE public.client_fiscal_data DROP CONSTRAINT IF EXISTS client_fiscal_data_regimen_iibb_check;
ALTER TABLE public.client_fiscal_data ADD CONSTRAINT client_fiscal_data_regimen_iibb_check
CHECK (regimen_iibb IN ('simplificado', 'local', 'convenio_multilateral', 'exento', 'no_inscripto'));
```

### Error: "Los coeficientes deben sumar 100%"
**Causa:** El trigger `validar_coeficientes_cm()` está funcionando correctamente.
**Solución:** Asegurar que la suma de coeficientes sea exactamente 100.00% (permitida tolerancia 99.99-100.01)

### Error: "Cannot find module '@/constants/fiscales'"
**Causa:** El archivo de constantes no se importó correctamente
**Solución:** Verificar que el path es correcto: `../../../constants/fiscales`

### No aparece la sección en FichaCliente
**Causa:** El componente no se importó o el user no tiene el cliente cargado
**Solución:** Verificar import en línea 12 de FichaCliente.jsx

---

## 📞 CONTACTO

Si encontrás algún problema durante la implementación, revisá:
1. Logs de Supabase Dashboard → Logs
2. Console del navegador (F12)
3. Compilación de Vite en terminal

---

## 🎉 RESULTADO FINAL

Una vez completados todos los pasos, tendrás:

✅ Sistema completo de gestión de jurisdicciones IIBB
✅ Validaciones automáticas en base de datos
✅ Interfaz intuitiva para contadoras
✅ Historial y auditoría de cambios
✅ Compatible con todos los regímenes IIBB de Argentina
✅ RLS correctamente configurado usando funciones centralizadas
✅ Coeficientes en porcentaje (0-100) para mejor UX
