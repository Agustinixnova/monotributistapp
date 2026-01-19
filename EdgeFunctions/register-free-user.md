# Edge Function: register-free-user

## Propósito
Crear usuarios gratuitos pre-confirmados usando la Admin API de Supabase, evitando el problema de email confirmation.

## Seguridad
- Usa `SERVICE_ROLE_KEY` de forma segura (solo en servidor)
- Nunca expone la key al frontend
- Crea usuarios con `email_confirm: true` (activos al instante)

## Parámetros (Body JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `email` | string | ✅ Sí | Email del usuario |
| `password` | string | ✅ Sí | Contraseña (min 6 caracteres) |
| `nombre` | string | ✅ Sí | Nombre del usuario |
| `apellido` | string | ✅ Sí | Apellido del usuario |
| `whatsapp` | string | ❌ No | Número de WhatsApp |
| `origen` | string | ❌ No | Origen del registro (default: 'otros') |
| `origenDetalle` | string | ❌ No | Detalle del origen |

## Respuesta Exitosa (200)

```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    ...
  },
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1234567890
  },
  "message": "Cuenta creada exitosamente"
}
```

## Respuesta de Error (400/500)

```json
{
  "error": "Mensaje de error"
}
```

## Flujo de Ejecución

1. Validar campos requeridos
2. Crear usuario con Admin API (`email_confirm: true`)
3. Trigger `on_auth_user_created_free` crea perfil en `usuarios_free`
4. Hacer login automático para obtener sesión
5. Devolver usuario + sesión al cliente

## Uso desde Frontend

```javascript
import { authService } from './auth/services/authService'

const { data, error } = await authService.signUpFree({
  email: 'usuario@ejemplo.com',
  password: 'contraseña123',
  nombre: 'Juan',
  apellido: 'Pérez',
  whatsapp: '+54911223344',
  origen: 'instagram'
})

if (error) {
  console.error(error.message)
} else {
  // Usuario creado y logueado automáticamente
  console.log(data.user)
}
```

## Variables de Entorno Requeridas

La Edge Function usa estas variables (configuradas automáticamente por Supabase):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (solo disponible en Edge Functions)
- `SUPABASE_ANON_KEY`

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Faltan campos requeridos" | Falta email, password, nombre o apellido | Enviar todos los campos requeridos |
| "User already registered" | Email ya existe | Usar otro email o hacer login |
| "Password should be at least 6 characters" | Contraseña muy corta | Usar contraseña de 6+ caracteres |
| "Usuario creado pero no se pudo iniciar sesión" | Error en auto-login | Usuario existe, hacer login manual |

## Ventajas sobre auth.signUp()

| Característica | auth.signUp() | Admin API (esta función) |
|----------------|---------------|--------------------------|
| Email confirmation | Depende de config | ❌ Nunca requiere |
| Usuario activo | Depende de config | ✅ Siempre al instante |
| Control | Limitado | ✅ Total |
| Seguridad | ✅ Alta | ✅ Alta |

## Última actualización
2026-01-19 - Implementación inicial con Admin API
