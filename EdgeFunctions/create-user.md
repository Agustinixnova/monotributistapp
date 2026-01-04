# Edge Function: create-user

## Descripcion
Crea un nuevo usuario usando la Admin API de Supabase. Esto evita el rate limiting de `signUp` y permite crear usuarios sin enviar email de confirmacion.

## Endpoint
`POST /functions/v1/create-user`

## Autenticacion
Requiere header `Authorization: Bearer <token>` con un token de un usuario con rol `admin` o `contadora_principal`.

## Parametros (Body JSON)

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| email | string | Si | Email del nuevo usuario |
| password | string | Si | Contrasena (min 8 chars, 1 mayuscula, 1 minuscula, 1 numero) |
| nombre | string | Si | Nombre del usuario |
| apellido | string | Si | Apellido del usuario |
| roleId | UUID | Si | ID del rol a asignar |
| telefono | string | No | Telefono de contacto |
| whatsapp | string | No | Numero de WhatsApp |
| dni | string | No | DNI del usuario |
| assignedTo | UUID | No | ID del contador asignado |
| fiscalData | object | No | Datos fiscales del cliente |

### Estructura de fiscalData

```json
{
  "cuit": "20-12345678-9",
  "razonSocial": "Nombre comercial",
  "tipoContribuyente": "monotributista",
  "categoriaMonotributo": "A",
  "tipoActividad": "servicios",
  "domicilioFiscal": "Calle 123",
  "codigoPostal": "1234",
  "localidad": "CABA",
  "provincia": "Buenos Aires",
  "regimenIibb": "exento",
  "facturadorElectronico": "afip"
}
```

## Respuesta Exitosa (200)

```json
{
  "success": true,
  "userId": "uuid-del-nuevo-usuario",
  "message": "Usuario creado exitosamente"
}
```

## Respuesta de Error (400)

```json
{
  "success": false,
  "error": "Descripcion del error"
}
```

## Acciones que realiza

1. Verifica que el usuario autenticado tenga permisos (admin o contadora_principal)
2. Crea el usuario en auth.users usando Admin API
3. Crea el perfil en la tabla `profiles`
4. Si hay datos fiscales, los inserta en `client_fiscal_data`
5. Asigna los modulos por defecto segun el rol

## Ejemplo de uso

```javascript
const response = await supabase.functions.invoke('create-user', {
  body: {
    email: 'nuevo@ejemplo.com',
    password: 'Password123',
    nombre: 'Juan',
    apellido: 'Perez',
    roleId: 'uuid-del-rol'
  }
})
```

## Deploy

```bash
supabase functions deploy create-user
```

## Ultima actualizacion
2026-01-04 - Creacion inicial
