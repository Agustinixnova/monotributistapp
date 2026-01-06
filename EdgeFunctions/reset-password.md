# Edge Function: reset-password

## Descripcion
Resetea la contraseña de un usuario usando la Admin API de Supabase. Solo usuarios con roles de acceso total pueden ejecutar esta funcion.

## Endpoint
`POST /functions/v1/reset-password`

## Autenticacion
Requiere header `Authorization: Bearer <token>` con un token de un usuario con rol:
- `admin`
- `contadora_principal`
- `desarrollo`
- `comunicadora`

## Parametros (Body JSON)

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| userId | UUID | Si | ID del usuario al que resetear la contraseña |
| newPassword | string | Si | Nueva contraseña (minimo 6 caracteres) |

## Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

## Respuestas de Error

### 400 - Bad Request
```json
{
  "success": false,
  "error": "Faltan campos requeridos: userId, newPassword"
}
```

### 401 - No autorizado
```json
{
  "success": false,
  "error": "No autorizado"
}
```

### 403 - Sin permisos
```json
{
  "success": false,
  "error": "No tenés permisos para realizar esta acción"
}
```

### 404 - Usuario no encontrado
```json
{
  "success": false,
  "error": "Usuario no encontrado"
}
```

## Acciones que realiza

1. Verifica que la request tenga un token valido
2. Verifica que el usuario autenticado tenga un rol con permisos (admin, contadora_principal, desarrollo, comunicadora)
3. Valida que la nueva contraseña tenga al menos 6 caracteres
4. Verifica que el usuario objetivo existe
5. Actualiza la contraseña usando `auth.admin.updateUserById`
6. Registra la accion en los logs

## Ejemplo de uso

```javascript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/reset-password`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      userId: 'uuid-del-usuario',
      newPassword: 'NuevaContraseña123'
    })
  }
)
```

## Servicio en frontend

```javascript
import { resetUserPassword } from '@/modules/users/services/userService'

await resetUserPassword(userId, 'NuevaContraseña123')
```

## Deploy

```bash
supabase functions deploy reset-password
```

## Ultima actualizacion
2026-01-06 - Creacion inicial
