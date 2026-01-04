# Modulo Mi Cuenta

## Descripcion

Modulo para que los clientes (monotributistas y responsables inscriptos) puedan gestionar su cuenta personal, ver y editar sus datos, y consultar el estado de su suscripcion y facturas.

## Componentes

### MiCuentaPage.jsx
Pagina principal con dos tabs:
- **Mis Datos**: Datos personales y de contacto
- **Mi Suscripcion**: Estado del plan y facturas

### MisDatos.jsx
Tab que muestra:
- **Editable**: Telefono, WhatsApp
- **Cambio de email**: Con validacion de Supabase
- **Cambio de password**: Con confirmacion
- **Solo lectura**: Nombre, Apellido, DNI, datos fiscales (CUIT, razon social, condicion IVA, categoria monotributo)

### MiSuscripcion.jsx
Tab que muestra:
- Estado de suscripcion (activa, por vencer, en gracia)
- Nombre del plan
- Fechas de inicio y vencimiento
- Dias restantes
- Alertas de vencimiento
- Lista de facturas con opcion de descarga

## Services

### cuentaService.js
- `getMyProfile()` - Obtiene perfil del usuario actual con datos fiscales
- `updateProfile({ telefono, whatsapp })` - Actualiza datos de contacto
- `updateEmail(newEmail)` - Cambia email del usuario
- `updatePassword(newPassword)` - Cambia password del usuario
- `getMySubscription()` - Obtiene suscripcion activa
- `getMyInvoices()` - Obtiene historial de facturas
- `getInvoiceDownloadUrl(invoiceId)` - Genera URL firmada para descarga

## Dependencias

- supabase (auth y cliente)
- lucide-react (iconos)
- Layout (componente de layout)

## Acceso

Este modulo solo esta disponible para los roles:
- `monotributista`
- `responsable_inscripto`

Se configura en la tabla `role_default_modules` (ver SQL_tables/10_mi_cuenta_module.sql)

## Ruta

`/mi-cuenta`

## Ultima actualizacion

2025-01-04 - Creacion del modulo
