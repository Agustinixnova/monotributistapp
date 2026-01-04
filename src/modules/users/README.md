# Módulo Users - Gestión de Usuarios

Módulo para la administración de usuarios, roles y accesos del sistema MonoGestión.

## Descripción

Este módulo permite:
- Alta, baja y modificación de usuarios
- Gestión de roles y permisos
- Asignación de módulos por rol y por usuario
- Gestión de datos fiscales de clientes

## Estructura

```
users/
├── components/
│   ├── UserCard.jsx          # Card de usuario (mobile)
│   ├── UserList.jsx          # Tabla/lista de usuarios
│   ├── UserFilters.jsx       # Filtros de búsqueda
│   ├── UserForm.jsx          # Formulario wizard de usuario
│   ├── RoleSelector.jsx      # Selector de rol con descripción
│   ├── FiscalDataForm.jsx    # Formulario de datos fiscales
│   ├── ModuleAccessManager.jsx # Gestión de acceso a módulos
│   ├── RoleList.jsx          # Lista de roles
│   ├── RoleForm.jsx          # Formulario de rol
│   ├── AssignCounterModal.jsx # Modal para asignar contador
│   ├── UserInvoiceModal.jsx  # Modal para cargar facturas de usuario
│   └── index.js
├── hooks/
│   ├── useUsers.js           # CRUD de usuarios
│   ├── useRoles.js           # CRUD de roles
│   ├── useModules.js         # Listar/sincronizar módulos
│   ├── useModuleAccess.js    # Gestión de accesos por usuario
│   ├── useSidebarModules.js  # Módulos del sidebar del usuario actual
│   └── index.js
├── services/
│   ├── userService.js        # Operaciones con usuarios
│   ├── roleService.js        # Operaciones con roles
│   ├── moduleService.js      # Operaciones con módulos
│   ├── fiscalDataService.js  # Operaciones con datos fiscales
│   └── index.js
├── pages/
│   ├── UsersPage.jsx         # Página principal de usuarios
│   ├── RolesPage.jsx         # Página de gestión de roles
│   └── index.js
├── utils/
│   ├── validators.js         # Validadores (CUIT, email, etc.)
│   ├── formatters.js         # Formateadores (CUIT, teléfono, etc.)
│   └── index.js
└── README.md
```

## Componentes

### UserForm (Wizard)
Formulario de alta/edición de usuarios en 4 pasos:
1. **Datos Personales**: nombre, apellido, email, contraseña, teléfono, DNI
2. **Rol y Asignación**: selección de rol, contador asignado
3. **Datos Fiscales**: CUIT, categoría, domicilio (solo para clientes)
4. **Módulos Extra**: accesos adicionales a módulos

### UserList
- Vista responsive: tabla en desktop, cards en mobile
- Columnas: Usuario, Contacto, Rol, CUIT, Contador, Plan/Suscripcion, Estado, Creado
- Acciones: editar, activar/desactivar, ver detalles, cargar factura

### UserInvoiceModal
- Crea registro de factura para un usuario
- Permite subir PDF (drag & drop)
- Campos: monto, descripcion, periodo

### RoleForm
- Crear/editar roles
- Asignar módulos por defecto

## Hooks

### useUsers(filters)
```javascript
const {
  users,
  loading,
  error,
  createUser,
  updateUser,
  toggleActive,
  updateFilters
} = useUsers({ isActive: true })
```

### useSidebarModules()
```javascript
const {
  modules,        // Módulos accesibles por el usuario
  loading,
  hasAccessToModule  // (slug) => boolean
} = useSidebarModules()
```

## Services

### userService.createUser(userData)
Crea usuario en auth.users + profile + fiscal_data + asigna módulos

### roleService.updateRole(id, roleData)
Actualiza rol y sus módulos por defecto

## Utils

### validateCUIT(cuit)
Valida CUIT argentino con algoritmo oficial

### formatCUIT(cuit)
Formatea: `20123456789` → `20-12345678-9`

## Dependencias

- `@supabase/supabase-js` - Cliente de Supabase
- `lucide-react` - Iconos
- `react-router-dom` - Navegación

## Rutas

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/usuarios` | UsersPage | Lista de usuarios |
| `/usuarios/roles` | RolesPage | Gestión de roles |

## Validaciones

- **CUIT**: Algoritmo oficial argentino
- **Email**: Formato estándar
- **Teléfono**: 8-13 dígitos
- **Contraseña**: Mínimo 8 caracteres, mayúscula, minúscula, número
- **DNI**: 7-8 dígitos

## Ultima Actualizacion

2025-01-04 - Creacion del modulo completo
2025-01-04 - Agregado columna Plan/Suscripcion y modal de facturas
