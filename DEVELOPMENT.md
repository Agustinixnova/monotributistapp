# Guía de Desarrollo

## Configuración de Supabase para Desarrollo Local

### Desactivar Confirmación de Email

Por defecto, Supabase requiere que los usuarios confirmen su email antes de poder iniciar sesión. Esto es ideal para producción, pero puede ser tedioso durante el desarrollo.

#### Opción 1: Desactivar Confirmación de Email (Recomendado para desarrollo)

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard/project/nhwiezngaprzoqcvutbx
2. Navega a **Authentication** → **Settings** → **Email Auth**
3. Desmarca la opción **"Enable email confirmations"**
4. Guarda los cambios

Con esto, los usuarios podrán iniciar sesión inmediatamente después de registrarse sin necesitar confirmar su email.

#### Opción 2: Confirmar Emails Manualmente (Para testing)

Si preferís mantener la confirmación habilitada:

1. Ve a **Authentication** → **Users** en el dashboard de Supabase
2. Encuentra el usuario que registraste
3. Haz click en el usuario
4. Busca el botón **"Confirm user"** y hacé click
5. Ahora el usuario podrá iniciar sesión

#### Opción 3: Usar Mailtrap o similar (Para testing de emails)

Para testear el flujo completo de confirmación de email:

1. Configurá un servicio de email de testing como [Mailtrap](https://mailtrap.io/)
2. En Supabase, ve a **Authentication** → **Settings** → **SMTP Settings**
3. Configurá los datos de Mailtrap
4. Los emails llegarán a la bandeja de Mailtrap para testing

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
- Verificá que el usuario esté confirmado (ver Opción 2 arriba)
- Verificá que las credenciales sean correctas
- Revisá la consola del navegador para ver el error exacto

### "Tu cuenta aún no está verificada"
- El usuario necesita confirmar su email
- Seguí las instrucciones de Opción 1 o 2 arriba

### Usuario no puede acceder al Dashboard
- Verificá que el usuario tenga un rol asignado
- Usuarios gratuitos deben estar en `usuarios_free`
- Usuarios premium deben estar en `profiles`

---

## Testing de Flujos

### Test: Registro Gratuito
1. Ir a `/registro`
2. Completar formulario
3. Si confirmación está habilitada: revisar mensaje de confirmación
4. Si confirmación está deshabilitada: login automático
5. Verificar redirección a Dashboard personalizado

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
