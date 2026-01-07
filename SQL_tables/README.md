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

2025-01-07 - Agregada tabla client_notas_internas para notas internas de contadora
