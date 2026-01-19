# Guía de Desarrollo

## Sistema de Registro

### Registro de Usuarios Gratuitos (Sin Confirmación de Email)

El sistema usa una **Edge Function con Admin API** para crear usuarios pre-confirmados automáticamente. Esto significa:

✅ **No necesitas desactivar la confirmación de email en Supabase**
✅ **Los usuarios gratuitos se crean activos al instante**
✅ **Mantiene la seguridad usando SERVICE_ROLE_KEY solo en servidor**

#### Cómo Funciona

1. El frontend llama a `authService.signUpFree()`
2. Se invoca la Edge Function `register-free-user`
3. La Edge Function usa `auth.admin.createUser()` con `email_confirm: true`
4. El usuario se crea pre-confirmado (sin necesidad de email)
5. Se hace auto-login y devuelve la sesión al cliente

#### Ventajas de Este Enfoque

- **Seguridad**: SERVICE_ROLE_KEY nunca se expone al frontend
- **UX**: Registro instantáneo, sin esperar emails
- **Flexibilidad**: Configuración global de Supabase no afecta a usuarios gratuitos
- **Mantenibilidad**: Un solo lugar donde se crea usuarios gratuitos

#### Testing Manual de Usuarios (Opcional)

Si necesitás confirmar usuarios manualmente creados por otros métodos:

1. Ve a **Authentication** → **Users** en el dashboard de Supabase
2. Encuentra el usuario que registraste
3. Haz click en el usuario
4. Busca el botón **"Confirm user"** y hacé click
5. Ahora el usuario podrá iniciar sesión

---

## Tipos de Usuarios

### Usuarios Premium (en tabla `profiles`)
- **admin**: Acceso total
- **contadora_principal**: Acceso total como admin
- **contador_secundario**: Solo clientes asignados
- **monotributista**: Cliente - dashboard personal
- **responsable_inscripto**: Cliente RI
- **desarrollo**: Acceso total para desarrollo
- **comunicadora**: Acceso total

### Usuarios Gratuitos (en tabla `usuarios_free`)
- **operador_gastos**: Usuario gratuito con acceso a herramientas
  - Mis Finanzas (personal)
  - Panel Económico
  - Caja Diaria
  - Educación Impositiva
- **operador_gastos_empleado**: Empleado de un usuario gratuito
  - Ve la Caja Diaria del dueño
  - Ve su propia sección Mis Finanzas
  - Permisos configurables por el dueño

---

## Registro de Usuarios

### Registro Gratuito
- URL: `/registro`
- Se crea usuario en `auth.users`
- Trigger automático crea perfil en `usuarios_free`
- Asigna rol `operador_gastos`
- Redirige a Dashboard personalizado

### Creación de Empleados
- Solo disponible para usuarios `operador_gastos` (dueños)
- Desde Caja Diaria → Configuración → Tab "Empleados"
- Se crea usuario con rol `operador_gastos_empleado`
- Se vincula en tabla `caja_empleados`
- Permisos configurables:
  - Anular movimientos
  - Eliminar arqueos
  - Editar saldo inicial
  - Agregar categorías
  - Agregar métodos de pago
  - Editar cierre de caja
  - Reabrir día

---

## Troubleshooting

### "Email o contraseña incorrectos"
- Verificá que las credenciales sean correctas
- Revisá la consola del navegador para ver el error exacto
- Si el usuario se registró antes de la implementación de la Edge Function, puede que necesite confirmación manual

### "Error al crear la cuenta"
- Verificá que la Edge Function `register-free-user` esté desplegada
- Revisá los logs de la Edge Function en el dashboard de Supabase
- Verificá que el email no esté ya registrado

### Usuario no puede acceder al Dashboard
- Verificá que el usuario tenga un rol asignado
- Usuarios gratuitos deben estar en `usuarios_free`
- Usuarios premium deben estar en `profiles`

### Edge Function no responde
- Verificá que esté desplegada: `npx supabase functions deploy register-free-user`
- Revisá los logs: Dashboard → Edge Functions → register-free-user → Logs
- Verificá las variables de entorno en el dashboard

---

## Testing de Flujos

### Test: Registro Gratuito
1. Ir a `/registro`
2. Completar formulario (email, contraseña, nombre, apellido, whatsapp, origen)
3. Click en "Crear cuenta"
4. El usuario se crea **pre-confirmado** automáticamente
5. Login automático inmediato (sin confirmación de email)
6. Verificar redirección a DashboardGratuito con saludo personalizado
7. Verificar acceso a todas las herramientas desde las cards

### Test: Login Usuario Gratuito
1. Ir a `/login`
2. Ingresar credenciales de usuario gratuito
3. Verificar redirección a Dashboard Gratuito
4. Verificar acceso a herramientas desde las cards

### Test: Crear Empleado
1. Login como usuario gratuito (dueño)
2. Ir a Caja Diaria
3. Click en ⚙️ Configuración
4. Tab "Empleados"
5. "Agregar empleado"
6. Completar datos del empleado
7. Configurar permisos
8. Verificar que el empleado puede loguearse

---

## Variables de Entorno

Asegurate de tener estas variables en tu `.env`:

```env
VITE_SUPABASE_URL=https://nhwiezngaprzoqcvutbx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Migraciones
npx supabase db push

# Ver logs de Supabase (si usas CLI local)
npx supabase start
npx supabase db reset --local
```

---

## Soporte

Si tenés problemas, revisá:
1. Consola del navegador (F12) para errores de JavaScript
2. Network tab para ver respuestas de API
3. Logs de Supabase en el dashboard
4. Este documento para configuraciones comunes
