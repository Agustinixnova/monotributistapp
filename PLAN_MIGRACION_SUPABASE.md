# Plan de Migración Supabase: USA → São Paulo

## 🎯 Objetivo
Migrar proyecto MonoGestión de Supabase USA a Supabase São Paulo SIN pérdida de datos, manteniendo integridad completa de:
- 32 tablas con datos de producción
- 1-20 usuarios reales con datos fiscales
- 47 migraciones SQL con funciones, triggers y RLS
- 4 storage buckets (pocos archivos)
- 2 Edge Functions

---

## ⚠️ REGLAS CRÍTICAS

1. **NUNCA ejecutar pasos destructivos sin backup verificado**
2. **Verificar CADA paso antes de continuar al siguiente**
3. **El proyecto actual SIGUE funcionando hasta cutover final**
4. **Rollback plan listo en todo momento**

---

## 📋 FASE 0: PREPARACIÓN (CRÍTICO)

### 0.1. Crear backup completo del proyecto actual

```bash
# Backup de schema completo
supabase db dump --db-url "postgresql://postgres:[password]@db.hymhyqwylgjmqbvuyutd.supabase.co:5432/postgres" > backup_schema_$(date +%Y%m%d).sql

# Backup solo de datos
supabase db dump --data-only --db-url "postgresql://postgres:[password]@db.hymhyqwylgjmqbvuyutd.supabase.co:5432/postgres" > backup_data_$(date +%Y%m%d).sql
```

**Verificación:**
- ✅ Archivos .sql generados y no vacíos
- ✅ Tamaño razonable (revisar con `ls -lh`)
- ✅ Guardar backups en lugar seguro (copiar a otro directorio, cloud)

### 0.2. Documentar credenciales proyecto actual

Crear archivo `CREDENCIALES_PROYECTO_ACTUAL.txt`:
```
URL: https://hymhyqwylgjmqbvuyutd.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: [obtener del dashboard]
DB Password: [obtener del dashboard]
```

### 0.3. Obtener credenciales proyecto nuevo São Paulo

Crear archivo `CREDENCIALES_PROYECTO_NUEVO.txt`:
```
URL: [tu proyecto São Paulo]
Anon Key: [obtener del dashboard]
Service Role Key: [obtener del dashboard]
DB Password: [obtener del dashboard]
Project ID: [obtener del dashboard]
```

### 0.4. Verificar versión PostgreSQL nueva

- Ir al Dashboard → Settings → General
- **DEBE ser PostgreSQL 17** (igual que proyecto actual)
- Si es diferente, contactar soporte Supabase

---

## 📋 FASE 1: MIGRACIÓN DE SCHEMA

### 1.1. Link proyecto nuevo con Supabase CLI

```bash
# Cambiar a directorio del proyecto
cd C:\Users\Agus\Monotributistapp

# Link al proyecto nuevo (usar Project ID de São Paulo)
supabase link --project-ref [PROJECT_ID_SAO_PAULO]
```

### 1.2. Ejecutar migraciones en orden

El proyecto tiene 47 migraciones. Ejecutarlas **en orden secuencial** es CRÍTICO.

**Opción A: Ejecutar todas juntas (recomendado)**
```bash
supabase db push
```

**Opción B: Ejecutar una por una para debugging**
```bash
supabase migration up
```

**Verificación después de cada batch:**
```sql
-- Conectar al nuevo proyecto y verificar
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
```

**Tablas esperadas (mínimo 32):**
- app_settings
- buzon_adjuntos, buzon_conversaciones, buzon_mensajes, buzon_participantes
- client_cuota_mensual
- client_facturacion_cargas, client_facturacion_resumen_mensual
- client_fiscal_data
- client_grupo_familiar, client_locales, client_notas_internas, client_notifications, client_sugerencias_cambio
- convenio_multilateral_vencimientos
- educacion_adjuntos, educacion_articulos, educacion_categorias
- historial_cambio_categoria, historial_cambios_cliente
- invoices, payments
- modules, monotributo_categorias
- profiles
- role_default_modules, role_permissions, roles
- subscription_plans, subscriptions
- user_module_access

**Funciones esperadas (mínimo 20):**
- get_user_role, is_full_access, is_admin, is_contador
- recalcular_resumen_mensual, trigger_recalcular_resumen
- calcular_estado_pago_monotributo
- agregar_historial_categoria, registrar_cambio_auditoria
- get_notas_cliente, get_recordatorios_pendientes
- crear_conversacion_directa, responder_conversacion
- generate_invoice_number
- Y otras...

### 1.3. Verificar RLS habilitado en todas las tablas

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Esperado:** TODAS las tablas con `rowsecurity = true`

### 1.4. Verificar Triggers activos

```sql
SELECT
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

**Triggers críticos esperados:**
- trigger_recalcular_resumen → client_facturacion_cargas
- calcular_estado_pago_trigger → client_cuota_mensual
- actualizar_ultimo_mensaje_trigger → buzon_mensajes
- educacion_slug_trigger → educacion_articulos

---

## 📋 FASE 2: MIGRACIÓN DE DATOS

### 2.1. Exportar datos tablas críticas desde proyecto actual

**Orden de exportación (respetar dependencias FK):**

```bash
# 1. Tablas sin dependencias (seed data)
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.roles > data_01_roles.sql
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.modules > data_02_modules.sql
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.monotributo_categorias > data_03_categorias.sql
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.role_default_modules > data_04_role_modules.sql

# 2. Usuarios y perfiles
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t auth.users > data_05_users.sql
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.profiles > data_06_profiles.sql

# 3. Datos fiscales de clientes (CRÍTICO)
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.client_fiscal_data > data_07_fiscal_data.sql

# 4. Facturación (CRÍTICO)
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.client_facturacion_cargas > data_08_cargas.sql
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.client_facturacion_resumen_mensual > data_09_resumenes.sql
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.client_cuota_mensual > data_10_cuotas.sql

# 5. Historial y auditoría
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.historial_cambio_categoria > data_11_historial_cat.sql
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.historial_cambios_cliente > data_12_historial_cambios.sql

# 6. Notas internas
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.client_notas_internas > data_13_notas.sql

# 7. Mi Cartera
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.client_locales > data_14_locales.sql
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.client_grupo_familiar > data_15_grupo_familiar.sql
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.client_sugerencias_cambio > data_16_sugerencias.sql

# 8. Buzón (si hay mensajes)
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.buzon_conversaciones > data_17_conversaciones.sql
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.buzon_participantes > data_18_participantes.sql
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.buzon_mensajes > data_19_mensajes.sql
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.buzon_adjuntos > data_20_buzon_adjuntos.sql

# 9. Notificaciones
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.client_notifications > data_21_notifications.sql

# 10. Educación (si hay artículos)
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.educacion_categorias > data_22_edu_categorias.sql
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.educacion_articulos > data_23_edu_articulos.sql
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.educacion_adjuntos > data_24_edu_adjuntos.sql

# 11. Convenio Multilateral
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.convenio_multilateral_vencimientos > data_25_cm_vencimientos.sql

# 12. User module access
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.user_module_access > data_26_user_modules.sql

# 13. Configuración (si la cambiaste)
supabase db dump --data-only --db-url "[URL_ACTUAL]" -t public.app_settings > data_27_settings.sql
```

### 2.2. Importar datos en proyecto nuevo

**IMPORTANTE:** Importar en el MISMO orden que exportaste.

```bash
# Conectar a proyecto nuevo y ejecutar cada archivo
psql "postgresql://postgres:[PASSWORD_NUEVO]@db.[PROJECT_ID].supabase.co:5432/postgres" -f data_01_roles.sql
psql "postgresql://postgres:[PASSWORD_NUEVO]@db.[PROJECT_ID].supabase.co:5432/postgres" -f data_02_modules.sql
# ... y así sucesivamente con TODOS los archivos
```

**Verificación después de cada import:**
```sql
-- Contar registros importados
SELECT 'roles' as tabla, count(*) FROM roles
UNION ALL SELECT 'profiles', count(*) FROM profiles
UNION ALL SELECT 'client_fiscal_data', count(*) FROM client_fiscal_data
UNION ALL SELECT 'client_facturacion_cargas', count(*) FROM client_facturacion_cargas
-- etc.
```

**Comparar con proyecto actual** para asegurar que los números coincidan.

### 2.3. Verificar integridad referencial

```sql
-- NO deben haber registros huérfanos
SELECT
    p.id, p.email, p.role_id
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
WHERE r.id IS NULL;

SELECT
    cfd.id, cfd.user_id
FROM client_fiscal_data cfd
LEFT JOIN profiles p ON cfd.user_id = p.id
WHERE p.id IS NULL;

-- Verificar que todos los clientes tienen categoría válida
SELECT
    cfd.id, cfd.categoria_actual_id
FROM client_fiscal_data cfd
LEFT JOIN monotributo_categorias mc ON cfd.categoria_actual_id = mc.id
WHERE mc.id IS NULL;
```

**Esperado:** 0 resultados en todas las queries (no huérfanos).

---

## 📋 FASE 3: STORAGE BUCKETS

### 3.1. Crear buckets en proyecto nuevo

Ir al Dashboard → Storage → Create bucket

**Bucket 1: invoices**
- Name: `invoices`
- Public: ❌ Private
- File size limit: 10MB
- Allowed MIME types: `application/pdf`

**Bucket 2: comprobantes-cuotas** (CRÍTICO)
- Name: `comprobantes-cuotas`
- Public: ❌ Private
- File size limit: 10MB
- Allowed MIME types: `image/jpeg, image/png, image/jpg, application/pdf`

**Bucket 3: educacion-impositiva**
- Name: `educacion-impositiva`
- Public: ✅ Public
- File size limit: 10MB
- Allowed MIME types: `image/jpeg, image/png, image/jpg, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Bucket 4: buzon-adjuntos**
- Name: `buzon-adjuntos`
- Public: ❌ Private
- File size limit: 10MB
- Allowed MIME types: `application/pdf, image/jpeg, image/png, image/jpg, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel`

### 3.2. Configurar RLS Policies en buckets

Las policies están en las migraciones, pero verificar manualmente en Dashboard → Storage → Policies.

**Verificar para cada bucket:**
- ✅ Policies de SELECT (read)
- ✅ Policies de INSERT (upload)
- ✅ Policies de DELETE
- ✅ Filtros por user_id o permisos de rol

### 3.3. Migrar archivos (si hay)

Como mencionaste que hay pocos o ninguno, hacer manualmente:

```bash
# Listar archivos en proyecto actual
# Ir a Dashboard → Storage → [bucket] → Ver archivos

# Descargar archivos importantes localmente
# Subirlos manualmente al bucket correspondiente en proyecto nuevo
```

**Para migración programática (si hay muchos archivos):**
```javascript
// Script Node.js para migrar archivos entre buckets
// (Proveer script si es necesario)
```

---

## 📋 FASE 4: EDGE FUNCTIONS

### 4.1. Deploy Edge Functions al proyecto nuevo

```bash
# Asegurarte de estar linkeado al proyecto nuevo
supabase link --project-ref [PROJECT_ID_SAO_PAULO]

# Deploy create-user function
supabase functions deploy create-user

# Deploy reset-password function
supabase functions deploy reset-password
```

### 4.2. Configurar secrets (variables de entorno)

```bash
# Service Role Key (CRÍTICO para las funciones)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY_SAO_PAULO]"
```

**O manualmente en Dashboard:**
- Ir a Edge Functions → Settings → Secrets
- Agregar: `SUPABASE_SERVICE_ROLE_KEY` con el service role key del proyecto nuevo

### 4.3. Verificar Edge Functions funcionan

**Test create-user:**
```bash
curl -i --location --request POST 'https://[PROJECT_ID_SAO_PAULO].supabase.co/functions/v1/create-user' \
  --header 'Authorization: Bearer [ANON_KEY_SAO_PAULO]' \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@test.com","password":"test123","nombre":"Test","apellido":"User","role":"monotributista","cuit":"20123456789"}'
```

**Esperado:**
- Status 200 o 201
- JSON con user creado

**Test reset-password:**
```bash
curl -i --location --request POST 'https://[PROJECT_ID_SAO_PAULO].supabase.co/functions/v1/reset-password' \
  --header 'Authorization: Bearer [SERVICE_ROLE_KEY_SAO_PAULO]' \
  --header 'Content-Type: application/json' \
  --data '{"userId":"[USER_ID_EXISTENTE]","newPassword":"newpass123"}'
```

**Si fallan:** Revisar logs en Dashboard → Edge Functions → [función] → Logs.

---

## 📋 FASE 5: CONFIGURACIÓN AUTH

### 5.1. Configurar URLs de Auth

Dashboard → Authentication → URL Configuration

```
Site URL: [Tu dominio de producción o http://localhost:5173 para dev]
Redirect URLs: [Tu dominio]/*, http://localhost:5173/*
```

### 5.2. Configurar Email Templates (opcional)

Dashboard → Authentication → Email Templates

Personalizar:
- Confirm signup
- Reset password
- Magic Link

### 5.3. Verificar providers habilitados

Dashboard → Authentication → Providers

✅ Email (debe estar enabled)
Otros según necesites.

---

## 📋 FASE 6: ACTUALIZAR FRONTEND

### 6.1. Actualizar variables de entorno

**Archivo: `.env`**
```env
VITE_SUPABASE_URL=https://[PROJECT_ID_SAO_PAULO].supabase.co
VITE_SUPABASE_ANON_KEY=[ANON_KEY_SAO_PAULO]
```

### 6.2. Actualizar CLAUDE.md (documentación)

**Archivo: `CLAUDE.md`**
```markdown
## 🔑 Credenciales Supabase

URL: https://[PROJECT_ID_SAO_PAULO].supabase.co
Anon Key: [ANON_KEY_SAO_PAULO]
Región: São Paulo, Brasil
```

### 6.3. Build local y pruebas

```bash
npm run dev
```

**Verificar:**
- ✅ Login funciona
- ✅ Dashboard carga
- ✅ Datos de clientes se muestran correctamente

### 6.4. Build producción

```bash
npm run build
```

### 6.5. Deploy a Vercel (cuando estés listo)

```bash
vercel --prod
```

**IMPORTANTE:** Actualizar variables de entorno en Vercel Dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 📋 FASE 7: VERIFICACIÓN EXHAUSTIVA

### 7.1. Verificar login con diferentes roles

```sql
-- Obtener usuarios de cada rol para testing
SELECT p.email, r.name as rol
FROM profiles p
JOIN roles r ON p.role_id = r.id
ORDER BY r.name;
```

**Probar login como:**
- [ ] admin o contadora_principal
- [ ] contador_secundario
- [ ] monotributista
- [ ] responsable_inscripto (si hay)

### 7.2. Verificar permisos RLS por rol

**Como admin/contadora_principal:**
- [ ] Puede ver TODOS los clientes en lista
- [ ] Puede editar cualquier cliente
- [ ] Puede acceder a todos los módulos

**Como contador_secundario:**
- [ ] Solo ve clientes asignados (verificar en user_module_access)
- [ ] No puede ver clientes de otros contadores

**Como monotributista:**
- [ ] Solo ve sus propios datos fiscales
- [ ] Puede subir comprobantes propios
- [ ] No puede ver otros clientes

### 7.3. Verificar funcionalidades críticas

**Facturación:**
- [ ] Ver listado de cargas de un cliente
- [ ] Agregar nueva carga de facturación
- [ ] Verificar que se recalcula resumen mensual automáticamente
- [ ] Verificar que suma acumulada es correcta

**Cuotas y Estado de Pago:**
- [ ] Ver cuotas mensuales de un cliente
- [ ] Agregar/editar cuota mensual
- [ ] Verificar que se actualiza `estado_pago` automáticamente en client_fiscal_data

**Datos Fiscales:**
- [ ] Ver datos fiscales completos de un cliente
- [ ] Editar categoría de monotributo
- [ ] Verificar que se crea registro en historial_cambio_categoria

**Storage:**
- [ ] Subir comprobante de cuota
- [ ] Descargar comprobante existente
- [ ] Verificar que usuarios no pueden ver archivos de otros (RLS)

**Buzón (si lo usas):**
- [ ] Ver conversaciones
- [ ] Enviar mensaje
- [ ] Adjuntar archivo

**Edge Functions:**
- [ ] Crear usuario desde panel admin (usa create-user)
- [ ] Resetear password de un usuario (usa reset-password)

### 7.4. Verificar triggers funcionan

```sql
-- 1. Trigger recalcular resumen
-- Agregar una carga de facturación y verificar que se actualiza resumen
INSERT INTO client_facturacion_cargas (...) VALUES (...);
SELECT * FROM client_facturacion_resumen_mensual WHERE client_id = ... AND anio = ... AND mes = ...;

-- 2. Trigger estado pago
-- Modificar una cuota y verificar que se actualiza estado_pago en client_fiscal_data
UPDATE client_cuota_mensual SET estado = 'al_dia' WHERE id = ...;
SELECT estado_pago FROM client_fiscal_data WHERE user_id = ...;
```

### 7.5. Verificar integridad de datos migrados

**Comparar totales entre proyecto actual y nuevo:**

```sql
-- Ejecutar en ambos proyectos y comparar
SELECT
    (SELECT COUNT(*) FROM profiles) as total_usuarios,
    (SELECT COUNT(*) FROM client_fiscal_data) as total_clientes,
    (SELECT COUNT(*) FROM client_facturacion_cargas) as total_cargas,
    (SELECT COUNT(*) FROM client_cuota_mensual) as total_cuotas,
    (SELECT COUNT(*) FROM historial_cambio_categoria) as total_historial_cat,
    (SELECT COUNT(*) FROM buzon_mensajes) as total_mensajes;
```

**Los números DEBEN coincidir exactamente.**

---

## 📋 FASE 8: CUTOVER (CAMBIO FINAL)

### 8.1. Elegir momento de cutover

**Recomendación:** Fuera de horario laboral o fin de semana.

### 8.2. Comunicar a usuarios

- Avisar que habrá mantenimiento breve
- Solicitar que NO ingresen durante ese tiempo
- Estimar ventana de 30-60 minutos

### 8.3. Último sync de datos (si hubo actividad después del dump inicial)

```bash
# Repetir export/import de tablas que pudieron cambiar
# Especialmente: client_facturacion_cargas, client_cuota_mensual, buzon_mensajes
```

### 8.4. Deploy frontend producción con nuevas credenciales

```bash
# Actualizar .env en Vercel
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production

# Redeploy
vercel --prod
```

### 8.5. Verificar producción en vivo

- [ ] Abrir app en dominio de producción
- [ ] Login con usuario real
- [ ] Verificar que datos son correctos
- [ ] Probar funcionalidad principal (ver clientes, facturación)

### 8.6. Monitoring post-cutover

**Primeras 24 horas:**
- Revisar logs de errores en Supabase Dashboard
- Revisar logs de Vercel
- Estar atento a reportes de usuarios

---

## 🔄 PLAN DE ROLLBACK (SI ALGO SALE MAL)

### Rollback inmediato (si falla en testing)

1. NO actualizar variables de entorno en producción
2. Mantener proyecto actual funcionando
3. Revisar problema en proyecto nuevo
4. Repetir migración cuando esté resuelto

### Rollback en producción (si ya se deployó)

1. **Revertir variables de entorno en Vercel:**
   ```env
   VITE_SUPABASE_URL=https://hymhyqwylgjmqbvuyutd.supabase.co
   VITE_SUPABASE_ANON_KEY=[ANON_KEY_ORIGINAL]
   ```

2. **Redeploy frontend:**
   ```bash
   vercel --prod
   ```

3. **Comunicar a usuarios:** "Volvimos a la versión anterior por precaución"

4. **Investigar problema en proyecto nuevo sin prisa**

---

## ✅ CHECKLIST FINAL DE VERIFICACIÓN

Antes de considerar la migración completa:

### Schema y Funciones
- [ ] 32 tablas creadas correctamente
- [ ] 20+ funciones PostgreSQL existen
- [ ] RLS habilitado en TODAS las tablas
- [ ] Triggers activos y funcionando
- [ ] Índices creados correctamente

### Datos
- [ ] Todos los usuarios migrados (comparar totales)
- [ ] Todos los clientes con datos fiscales completos
- [ ] Facturación histórica completa
- [ ] Cuotas mensuales completas
- [ ] Historial de cambios migrado
- [ ] No hay registros huérfanos (FK intactas)

### Storage
- [ ] 4 buckets creados con configuración correcta
- [ ] RLS policies en buckets configuradas
- [ ] Archivos importantes migrados (si había)

### Edge Functions
- [ ] create-user deployada y funciona
- [ ] reset-password deployada y funciona
- [ ] Secrets configurados correctamente

### Auth
- [ ] Site URL configurada
- [ ] Redirect URLs configuradas
- [ ] Login funciona con usuarios migrados

### Frontend
- [ ] Variables de entorno actualizadas
- [ ] Build exitoso sin errores
- [ ] Deploy a producción exitoso

### Testing Funcional
- [ ] Login con diferentes roles funciona
- [ ] RLS filtra datos correctamente según rol
- [ ] CRUD de clientes funciona
- [ ] Facturación muestra datos correctos
- [ ] Triggers se ejecutan correctamente
- [ ] Upload/download de archivos funciona
- [ ] Edge functions se ejecutan correctamente

### Performance y Monitoring
- [ ] Queries responden rápido (latencia desde Argentina a São Paulo)
- [ ] No hay errores en logs de Supabase
- [ ] No hay errores en logs de Vercel
- [ ] Usuarios reportan funcionamiento normal

---

## 📊 ARCHIVOS GENERADOS DURANTE LA MIGRACIÓN

Al finalizar, tendrás:

```
/backups/
├── backup_schema_20260113.sql          # Schema completo proyecto actual
├── backup_data_20260113.sql            # Datos completos proyecto actual
├── data_01_roles.sql                   # Dump individual de roles
├── data_02_modules.sql                 # Dump individual de modules
├── ... (26 archivos de dumps individuales)
├── CREDENCIALES_PROYECTO_ACTUAL.txt    # Info proyecto USA
└── CREDENCIALES_PROYECTO_NUEVO.txt     # Info proyecto São Paulo
```

---

## 🎯 RESULTADO ESPERADO

Al finalizar esta migración:

✅ Proyecto funcionando 100% en región São Paulo
✅ Latencia mejorada para usuarios en Argentina/Brasil
✅ CERO pérdida de datos
✅ CERO interrupción de servicio (cutover breve)
✅ Rollback disponible en caso necesario
✅ Documentación completa del proceso

---

## ⏱️ TIEMPO ESTIMADO

- **FASE 0 (Preparación):** 30 minutos
- **FASE 1 (Schema):** 15 minutos
- **FASE 2 (Datos):** 30 minutos
- **FASE 3 (Storage):** 20 minutos
- **FASE 4 (Edge Functions):** 15 minutos
- **FASE 5 (Auth):** 10 minutos
- **FASE 6 (Frontend):** 20 minutos
- **FASE 7 (Verificación):** 60 minutos
- **FASE 8 (Cutover):** 30 minutos

**TOTAL:** ~4 horas (incluyendo verificaciones exhaustivas)

Con 1-20 usuarios y pocos archivos, podés hacer todo en una tarde/noche.

---

## 📝 NOTAS IMPORTANTES

1. **Passwords de usuarios:** Los passwords están hasheados en `auth.users`, se migran automáticamente. Los usuarios podrán hacer login con sus passwords actuales.

2. **Service Role Key:** Es diferente entre proyectos. Recordar actualizar en Edge Functions y en cualquier script backend.

3. **Session tokens:** Los tokens de sesión actuales dejarán de funcionar después del cutover. Los usuarios deberán hacer login nuevamente.

4. **Timezone:** El proyecto usa UTC-3 (Argentina). Verificar que las timestamps se muestran correctamente.

5. **Realtime subscriptions:** Si usás realtime, verificar que las suscripciones funcionan en el nuevo proyecto.

6. **Webhooks:** Si tenés webhooks configurados, actualizarlos con las nuevas URLs.

---

## 🆘 SOPORTE

Si encontrás problemas durante la migración:

1. **Revisar logs:** Dashboard → Logs (Database, API, Auth, Storage)
2. **Revisar documentación:** https://supabase.com/docs/guides/cli/local-development
3. **Supabase Discord:** https://discord.supabase.com/
4. **GitHub Issues:** Si es un bug de Supabase CLI

**En caso de emergencia:** Ejecutar rollback y contactarme con el error específico.
