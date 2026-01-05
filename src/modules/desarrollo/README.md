# Módulo Desarrollo

## Descripción
Sistema interno para las 3 socias (dev, contadora, comunicadora) para gestionar ideas de funcionalidades y reportar bugs/errores de la aplicación.

## Características principales

### Tablero de Ideas (Kanban)
- 5 etapas: Idea → Completar info → En desarrollo → Para revisar → Publicado
- Cada idea tiene secciones por rol:
  - **Info básica**: todos pueden editar
  - **Fiscal**: solo la contadora
  - **UX/Textos**: solo la comunicadora
  - **Notas técnicas**: solo dev (oculto para otros)
  - **Checklist**: visible solo en etapa "revisar"

### Sistema de Reportes
- 3 tipos: Falla grave, Error, Sugerencia
- 4 estados: Abierto → En curso → Para probar → Resuelto
- Sistema de chat para seguimiento
- Adjuntos de archivos

## Estructura

```
desarrollo/
├── components/
│   ├── tablero/
│   │   ├── Tablero.jsx           # Kanban de 5 columnas
│   │   ├── Columna.jsx           # Una columna del kanban
│   │   └── TarjetaIdea.jsx       # Card de idea
│   ├── ideas/
│   │   ├── ModalIdea.jsx         # Ver/editar idea completa
│   │   └── FormIdea.jsx          # Crear nueva idea
│   ├── reportes/
│   │   ├── ListaReportes.jsx     # Lista con filtros
│   │   ├── TarjetaReporte.jsx    # Card de reporte
│   │   ├── ChatReporte.jsx       # Vista de chat
│   │   ├── FormReporte.jsx       # Crear reporte
│   │   └── FiltrosReporte.jsx    # Filtros estado/tipo
│   └── compartidos/
│       ├── Badge.jsx             # Badge de color
│       ├── Avatar.jsx            # Avatar de usuario
│       ├── SelectorModulo.jsx    # Dropdown módulos
│       ├── SubidorArchivos.jsx   # Input de archivos
│       └── ListaArchivos.jsx     # Mostrar archivos adjuntos
├── hooks/
│   ├── useSocios.js              # Gestión de rol de socio
│   ├── useIdeas.js               # CRUD de ideas
│   └── useReportes.js            # CRUD de reportes
├── services/
│   ├── sociosService.js          # API de socios
│   ├── ideasService.js           # API de ideas
│   ├── reportesService.js        # API de reportes
│   └── archivosService.js        # API de archivos
└── utils/
    ├── config.js                 # Configuración (etapas, tipos, estados)
    └── permisos.js               # Sistema de permisos por rol
```

## Tablas de Base de Datos

Ver `SQL_tables/12_modulo_desarrollo.sql`:
- `dev_ideas` - Ideas del tablero
- `dev_ideas_comentarios` - Comentarios en ideas
- `dev_reportes` - Reportes de bugs
- `dev_reportes_mensajes` - Mensajes del chat de reportes
- `dev_archivos` - Archivos adjuntos

## Permisos por Rol

| Sección | Dev | Contadora | Comunicadora |
|---------|-----|-----------|--------------|
| Info idea | ✅ | ✅ | ✅ |
| Fiscal | ❌ | ✅ | ❌ |
| UX/Textos | ❌ | ❌ | ✅ |
| Notas técnicas | ✅ | ❌ | ❌ |
| Checklist | ✅ | ✅ | ✅ |
| Crear reportes | ❌ | ✅ | ✅ |
| Cambiar estado reporte | ✅ | ❌ | ❌ |

## Rutas

- `/desarrollo` → Redirige a `/desarrollo/ideas`
- `/desarrollo/ideas` → Tablero Kanban
- `/desarrollo/reportes` → Lista de reportes
- `/desarrollo/reportes/:id` → Chat de un reporte

## Requisitos previos

1. Ejecutar SQL: `SQL_tables/12_modulo_desarrollo.sql`
2. Crear storage bucket: `dev-archivos`
3. Asignar `socios_rol` a los usuarios (dev, contadora, comunicadora)

## Última actualización
2026-01-04 - Creación inicial del módulo
