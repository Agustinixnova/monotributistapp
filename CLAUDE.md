# CLAUDE.md - Instrucciones del Proyecto MonoGestión

## 📋 Información del Proyecto

**Nombre:** MonoGestión - App de Gestión de Monotributistas  
**Descripción:** Aplicación para contadores que gestionan clientes monotributistas y responsables inscriptos en Argentina.  
**Estado:** En desarrollo (Fase 0 - Fundamentos)

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión/Detalle |
|------------|-----------------|
| **Frontend** | Vite + React + TypeScript |
| **Estilos** | Tailwind CSS v3 |
| **Backend/DB** | Supabase |
| **Deploy** | Vercel |
| **Control de versiones** | GitHub |
| **Iconos** | Lucide React (NO emojis) |
| **IDE** | Cursor + Claude CLI |

---

## 🔑 Credenciales Supabase

```
URL: https://hymhyqwylgjmqbvuyutd.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bWh5cXd5bGdqbXFidnV5dXRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0OTY3MzEsImV4cCI6MjA4MzA3MjczMX0.VX4j-SPrgD5FqlmbOj2S_eJ9BvI-2aJ8waovMOcPFSA
```

---

## 📁 Estructura de Carpetas

```
proyecto/
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes UI reutilizables
│   │   ├── layout/          # Sidebar, Header, Layout
│   │   └── common/          # Componentes compartidos
│   ├── modules/
│   │   ├── [nombre-modulo]/
│   │   │   ├── components/  # Componentes del módulo
│   │   │   ├── hooks/       # Hooks del módulo
│   │   │   ├── services/    # Llamadas a Supabase
│   │   │   ├── utils/       # Funciones utilitarias
│   │   │   └── README.md    # Documentación del módulo
│   │   └── ...
│   ├── hooks/               # Hooks globales
│   ├── services/            # Servicios globales (supabase client)
│   ├── utils/               # Utilidades globales
│   ├── types/               # TypeScript types
│   ├── routes/              # Configuración de rutas
│   ├── config/              # Configuración general
│   └── styles/              # Estilos globales
├── SQL_tables/              # ⚠️ IMPORTANTE: Todas las tablas SQL
│   └── README.md            # Índice de tablas
├── EdgeFunctions/           # ⚠️ IMPORTANTE: Edge functions documentadas
│   └── README.md            # Índice de funciones
└── supabase/
    └── functions/           # Edge functions de Supabase
```

---

## ⚠️ REGLAS CRÍTICAS

### 1. Estructura de Módulos
Cada módulo DEBE tener:
- `components/` - Componentes React del módulo
- `hooks/` - Custom hooks del módulo
- `services/` - Funciones que interactúan con Supabase
- `utils/` - Funciones auxiliares
- `README.md` - Documentación del módulo

### 2. Documentación SQL
- **TODAS** las tablas SQL deben estar en `SQL_tables/`
- Cada tabla en su archivo: `SQL_tables/[nombre_tabla].sql`
- Actualizar `SQL_tables/README.md` al crear/modificar tablas
- Incluir: CREATE, índices, triggers, RLS policies

### 3. Edge Functions
- Documentar en `EdgeFunctions/`
- Cada función en: `EdgeFunctions/[nombre_funcion].md`
- Incluir: propósito, parámetros, respuesta, ejemplo de uso

### 4. README de Módulos
Al crear o modificar un módulo:
```markdown
# Módulo [Nombre]

## Descripción
[Qué hace este módulo]

## Componentes
- `ComponenteX.tsx` - [Descripción]

## Hooks
- `useHookX.ts` - [Descripción]

## Services
- `servicioX.ts` - [Descripción]

## Dependencias
- [Lista de dependencias del módulo]

## Última actualización
[Fecha] - [Cambios realizados]
```

---

## 📱 Diseño Mobile-First

- **Prioridad:** 100% mobile con excelente UX
- **Desktop:** Adaptable, especialmente notebooks 14"
- **Breakpoints Tailwind:**
  - `sm:` 640px
  - `md:` 768px
  - `lg:` 1024px
  - `xl:` 1280px

---

## 👥 Sistema de Roles

| Rol | Descripción |
|-----|-------------|
| `admin` | Acceso total, configuración del sistema |
| `contadora_principal` | Gestión de todos los clientes, asignaciones |
| `contador_secundario` | Solo clientes asignados |
| `monotributista` | Cliente - dashboard personal |
| `responsable_inscripto` | Cliente RI - módulos específicos |
| `operador_gastos` | Solo módulo de gastos |

---

## 🗄️ Tablas Principales de Base de Datos

1. **roles** - Roles del sistema
2. **profiles** - Perfiles de usuario (extiende auth.users)
3. **modules** - Módulos/menú del sistema
4. **role_permissions** - Permisos por rol
5. **client_fiscal_data** - Datos fiscales de clientes
6. **monotributo_categorias** - Categorías A-K con valores

Ver `SQL_tables/README.md` para esquema completo.

---

## 🎯 Funcionalidades Core

1. Dashboard de "salud del monotributo" (semáforo)
2. Alertas de recategorización y exclusión
3. Contador regresivo de fechas clave
4. Registro de facturación
5. Simulador de recategorización
6. Chat contadora-cliente
7. Documentos compartidos
8. Sistema de notificaciones

---

## 🚀 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Deploy (Vercel)
vercel --prod

# Supabase CLI
supabase start
supabase db push
supabase functions serve
```

---

## 📝 Convenciones de Código

- **Componentes:** PascalCase (`UserProfile.tsx`)
- **Hooks:** camelCase con prefijo use (`useAuth.ts`)
- **Services:** camelCase (`userService.ts`)
- **Utils:** camelCase (`formatDate.ts`)
- **Tipos:** PascalCase (`UserType.ts`)

---

## 🔄 Flujo de Trabajo

1. Crear/modificar código
2. Si hay cambios en tablas → actualizar `SQL_tables/`
3. Si hay edge functions → documentar en `EdgeFunctions/`
4. Actualizar README del módulo afectado
5. Commit con mensaje descriptivo
6. Push a GitHub
7. Deploy automático en Vercel

---

## 📞 Contacto Proyecto

App desarrollada para estudio contable.  
Clientes: Monotributistas y Responsables Inscriptos de Argentina.
