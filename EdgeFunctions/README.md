# Edge Functions - MonoGestion

Este directorio contiene la documentacion de las Edge Functions de Supabase.

## Funciones Disponibles

| Funcion | Descripcion | Documentacion |
|---------|-------------|---------------|
| `create-user` | Crea un usuario con perfil y datos fiscales | [create-user.md](./create-user.md) |
| `reset-password` | Resetea la contraseña de un usuario | [reset-password.md](./reset-password.md) |

## Estructura de Documentacion

Cada funcion debe tener su propio archivo `.md` con la siguiente estructura:

```markdown
# nombre_funcion

## Descripcion
Breve descripcion de lo que hace la funcion.

## Endpoint
POST /functions/v1/nombre_funcion

## Headers Requeridos
- Authorization: Bearer <token>
- Content-Type: application/json

## Parametros

| Nombre | Tipo | Requerido | Descripcion |
|--------|------|-----------|-------------|
| param1 | string | Si | Descripcion del parametro |

## Respuesta
{
  "success": true,
  "data": {}
}

## Errores

| Codigo | Descripcion |
|--------|-------------|
| 400 | Parametros invalidos |
| 401 | No autorizado |
| 500 | Error interno |

## Ejemplo de Uso
const { data, error } = await supabase.functions.invoke('nombre_funcion', {
  body: { param1: 'valor' }
})
```

## Funciones Planificadas

1. **create_user_with_profile** - Crear usuario en auth + profile en una transaccion
2. **send_notification** - Enviar notificaciones push/email
3. **sync_arca_data** - Sincronizar datos con ARCA (ex AFIP)

## Comandos Utiles

```bash
# Crear nueva funcion
npx supabase functions new nombre_funcion

# Servir localmente
npx supabase functions serve nombre_funcion

# Desplegar
npx supabase functions deploy nombre_funcion
```

## Ultima Actualizacion

2026-01-06 - Agregada funcion reset-password
