# SQL Tables - MonoGestion

Este directorio contiene todas las definiciones de tablas SQL del proyecto.

## Tablas del Sistema

| Archivo | Tabla | Descripcion |
|---------|-------|-------------|
| `01_roles.sql` | `roles` | Roles del sistema (admin, contadora_principal, etc.) |
| `02_modules.sql` | `modules` | Modulos/menu del sistema |
| `03_role_default_modules.sql` | `role_default_modules` | Asignacion de modulos por defecto a cada rol |
| `04_profiles.sql` | `profiles` | Perfiles de usuario (extiende auth.users) |
| `05_user_module_access.sql` | `user_module_access` | Accesos adicionales a modulos por usuario |
| `06_client_fiscal_data.sql` | `client_fiscal_data` | Datos fiscales de clientes |
| `07_monotributo_categorias.sql` | `monotributo_categorias` | Categorias del monotributo con valores |
| `08_seed_data.sql` | - | Datos iniciales (roles, modulos, asignaciones) |
| `09_rls_policies.sql` | - | Politicas de Row Level Security |
| `10_mi_cuenta_module.sql` | - | Modulo Mi Cuenta para clientes |
| `storage_policies.sql` | - | Politicas de Storage para bucket invoices |
| `22_notas_internas.sql` | `client_notas_internas` | Notas internas de contadora por cliente |
| `24_mi_cartera_completo.sql` | `client_*` | Modulo Mi Cartera completo (locales, grupo familiar, sugerencias) |
| `25_educacion_impositiva.sql` | `educacion_*` | Modulo Educacion Impositiva (articulos, categorias, adjuntos) |
| `26_storage_comprobantes_cuotas.sql` | `storage.objects` | Bucket para comprobantes de pago de cuotas |
| `27_client_notifications.sql` | `client_notifications` | Notificaciones personalizadas de contadores a clientes |
| `28_estado_pago_automatico.sql` | Función + Trigger | Calculo automático de estado de pago basado en cuotas mensuales |
| `29_deuda_inicial_y_periodos.sql` | Campos + Función + Trigger | Sistema de deuda inicial con períodos específicos y ajuste automático al pagar |

## Tablas del Módulo Agenda & Turnos

| Archivo | Tablas | Descripción |
|---------|--------|-------------|
| `agenda_turnos_schema.sql` | `agenda_servicios`, `agenda_servicio_profesionales`, `agenda_clientes`, `agenda_disponibilidad`, `agenda_excepciones`, `agenda_turnos`, `agenda_turno_servicios`, `agenda_turno_pagos` | Esquema completo del módulo de agenda y turnos |
| `agenda_turnos_module.sql` | - | Configuración adicional, triggers y RLS policies del módulo |
| `30_agenda_clientes_instagram_origen.sql` | `agenda_clientes` | Agrega campos instagram y origen (como nos conoció) |
| `agenda_negocio.sql` | `agenda_negocio` | Datos del negocio/emprendimiento (nombre, contacto, redes, etc.) |
| `agenda_reserva_links.sql` | `agenda_reserva_links` | Links de reserva para auto-gestión de turnos por clientes |
| `agenda_reservas_public_access.sql` | - | Permisos y RLS para acceso público sin autenticación |
| `crear_reserva_publica_function.sql` | Función RPC | Función para crear reservas desde links públicos (soporta múltiples servicios) |
| `agenda_mensajes_personalizados.sql` | - | Agrega instrucciones_previas a servicios, plantilla_recordatorio a negocio, es_domicilio a turnos |
| `agenda_modalidades_trabajo.sql` | - | Modalidades de trabajo (local/domicilio/videollamada), datos de cobro (alias, CUIT), dirección mejorada |
| `34_agenda_clientes_direccion.sql` | `agenda_clientes` | Agrega campos de dirección para clientes (direccion, piso, departamento, localidad, provincia, indicaciones_ubicacion) |
| `35_agenda_servicios_modalidades.sql` | `agenda_servicios` | Configuración de disponibilidad y precios por modalidad (local, domicilio, videollamada) |
| `36_agenda_trazabilidad_indices.sql` | Múltiples | Agrega trazabilidad (created_by, updated_by) e índices optimizados |
| `38_agenda_facturacion_afip.sql` | `agenda_config_afip`, `agenda_facturas` | Facturación electrónica AFIP (Factura C, NC, ND) |
| `39_storage_logos_facturacion.sql` | `storage.objects` | Bucket para logos de facturación con políticas RLS |
| `40_agenda_clientes_cuit.sql` | `agenda_clientes` | Campo CUIT para facturación (Consumidor Final o con CUIT) |
| `41_modulo_facturacion_afip.sql` | `modules` | Módulo premium 'facturacion-afip' (habilitación manual) |
| `facturas_pendientes.sql` | `facturas_pendientes` | Cola de facturas pendientes de emisión por fallos de conexión con ARCA |
| `agenda_espacios.sql` | `agenda_espacios` | Espacios/salones para alquilar (modo espacios) |

## Tablas del Módulo Caja Diaria

| Archivo | Tablas | Descripción |
|---------|--------|-------------|
| `20260118000000_caja_diaria.sql` | `caja_metodos_pago`, `caja_categorias`, `caja_movimientos`, `caja_arqueos`, `caja_cierres`, `caja_configuracion`, `caja_alias_pago` | Esquema base del módulo de caja diaria |
| `caja_fiados.sql` | `caja_clientes_fiado`, `caja_fiados`, `caja_pagos_fiado` | Sistema de cuentas corrientes y fiados |
| `caja_empleados_historial.sql` | `caja_empleados_historial` | Historial de cambios en empleados de caja |
| `37_caja_trazabilidad_indices.sql` | Múltiples | Agrega trazabilidad (updated_by_id) e índices optimizados |
| `caja_proveedores.sql` | `caja_proveedores`, `caja_facturas_compra` | Proveedores y facturas de compra con reporte por proveedor |

## Tablas del Módulo Dev Tools

| Archivo | Tablas | Descripción |
|---------|--------|-------------|
| `error_logs.sql` | `error_logs` | Registro de errores del frontend para debugging (con agrupación por hash, severidad, estado) |
| `audit_logs.sql` | `audit_logs` | Sistema de auditoría - registra cambios en tablas críticas (quién, qué, cuándo, antes/después) |
| `feedback.sql` | `feedback` | Feedback de usuarios (bugs, sugerencias, preguntas, comentarios) con respuesta integrada |

## Convención Multi-Tenancy

Ambos módulos (Agenda y Caja) usan el mismo patrón multi-tenancy:

```
┌─────────────────────────────────────────────────────────────────┐
│  AGENDA TURNOS                │  CAJA DIARIA                    │
├───────────────────────────────┼─────────────────────────────────┤
│  duenio_id = tenant_id        │  user_id = tenant_id            │
│  created_by                   │  created_by_id                  │
│  updated_by                   │  updated_by_id                  │
│  created_at                   │  created_at                     │
│  updated_at                   │  updated_at                     │
├───────────────────────────────┴─────────────────────────────────┤
│  Diferencia de nomenclatura:                                    │
│  - Agenda usa sufijo sin _id (created_by)                       │
│  - Caja usa sufijo con _id (created_by_id)                      │
│  El patrón es idéntico, solo cambia el nombre del campo.        │
├─────────────────────────────────────────────────────────────────┤
│  Campos de trazabilidad (significado):                          │
│  - tenant_id:   dueño del negocio (a quién pertenecen los datos)│
│  - created_by:  quién cargó el registro                         │
│  - updated_by:  quién modificó por última vez                   │
│  - created_at:  fecha de creación                               │
│  - updated_at:  fecha de última modificación                    │
└─────────────────────────────────────────────────────────────────┘
```

## Diagrama de Relaciones

```
auth.users
    |
    +---> profiles (1:1)
            |
            +---> roles (N:1)
            |       |
            |       +---> role_default_modules (1:N)
            |               |
            |               +---> modules (N:1)
            |
            +---> user_module_access (1:N)
            |       |
            |       +---> modules (N:1)
            |
            +---> client_fiscal_data (1:1)
                    |
                    +---> client_notas_internas (1:N)
                    |
                    +---> client_notifications (1:N)
            |
            +---> profiles (assigned_to, N:1)
```

## Roles del Sistema

| Nombre | Display Name | Descripcion |
|--------|--------------|-------------|
| `admin` | Administrador | Acceso total al sistema |
| `contadora_principal` | Contadora Principal | Gestion completa de clientes |
| `contador_secundario` | Contador Secundario | Solo sus clientes asignados |
| `monotributista` | Monotributista | Cliente monotributista |
| `responsable_inscripto` | Responsable Inscripto | Cliente RI |
| `operador_gastos` | Operador de Gastos | Solo modulo gastos |

## Modulos Disponibles

1. Dashboard (`/`)
2. Gestion de Usuarios (`/usuarios`)
3. Clientes (`/clientes`)
4. Facturacion (`/facturacion`)
5. Gastos (`/gastos`)
6. Mensajes (`/mensajes`)
7. Notificaciones (`/notificaciones`)
8. Biblioteca (`/biblioteca`)
9. Herramientas (`/herramientas`)
10. Configuracion (`/configuracion`)
11. Mi Cuenta (`/mi-cuenta`) - Solo para clientes

## Row Level Security (RLS)

Todas las tablas tienen RLS habilitado:

- **roles, modules, role_default_modules**: Lectura publica, modificacion solo admin
- **profiles**: Usuario ve su perfil, contadores ven sus clientes, admin ve todo
- **user_module_access**: Usuario ve sus accesos, admin/contadora_principal modifican
- **client_fiscal_data**: Mismo criterio que profiles
- **monotributo_categorias**: Lectura publica, modificacion solo admin

## Migraciones

Las migraciones se encuentran en `/supabase/migrations/`:

1. `20250104000001_create_base_tables.sql` - Creacion de tablas
2. `20250104000002_seed_data.sql` - Datos iniciales
3. `20250104000003_rls_policies.sql` - Politicas de seguridad

## Ejecutar Migraciones

```bash
npx supabase db push
```

## Ultima Actualizacion

18-02-2026 - Proveedores y facturas de compra (caja_proveedores, caja_facturas_compra) con reporte por proveedor
01-02-2026 - Modos de agenda (personal/equipo/espacios) con tabla agenda_espacios para alquiler de salones
01-02-2026 - Sistema de auditoría (audit_logs) con triggers automáticos en tablas críticas
01-02-2026 - Panel de Errores con captura automática de errores JS, React y Supabase
29-01-2026 - Módulo premium 'facturacion-afip' (se habilita manualmente a usuarios que pagan suscripción)
29-01-2026 - Campo CUIT en clientes para facturación (Consumidor Final o con CUIT)
29-01-2026 - Storage bucket para logos de facturación con generación de PDFs
29-01-2026 - Facturación electrónica AFIP (Factura C, NC, ND) para módulo agenda
29-01-2026 - Trazabilidad (updated_by_id) e índices optimizados para caja diaria
29-01-2026 - Trazabilidad (created_by, updated_by) e índices optimizados para agenda
29-01-2026 - Modalidades de trabajo (local/domicilio/videollamada), datos de cobro (alias, CUIT), dirección clientes
28-01-2026 - Sistema de mensajes personalizados de WhatsApp (plantillas, instrucciones por servicio, domicilio)
28-01-2026 - Función crear_reserva_publica actualizada para soportar múltiples servicios
28-01-2026 - Agregada tabla agenda_reserva_links para links de reserva auto-gestionados
24-01-2026 - Agregados campos instagram y origen a agenda_clientes
24-01-2026 - Agregadas tablas del módulo Agenda & Turnos
11-01-2026 - Agregada función y trigger para calcular automáticamente estado_pago_monotributo
10-01-2026 - Agregada tabla client_notifications para notificaciones personalizadas a clientes
07-01-2026 - Agregado modulo Educacion Impositiva (articulos, categorias, storage)
