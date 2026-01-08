# Modulo Educacion Impositiva

## Descripcion

Modulo de contenido educativo sobre monotributo, impuestos y obligaciones fiscales. Permite crear, editar y publicar articulos con un editor WYSIWYG rico en funcionalidades. Los usuarios autorizados pueden administrar categorias y organizar el contenido.

## Funcionalidades

- **Visualizacion de articulos**: Lista de articulos publicados con filtros por categoria y busqueda
- **Lectura de articulos**: Vista completa con estimacion de tiempo de lectura
- **Editor TipTap**: Editor WYSIWYG con formato de texto, imagenes y videos de YouTube
- **Gestion de categorias**: CRUD completo con iconos y colores personalizables
- **Ordenamiento drag & drop**: Reordenar articulos arrastrando
- **Estados de publicacion**: Borrador y publicado
- **Articulos destacados**: Marcar articulos como destacados
- **Busqueda en tiempo real**: Busqueda con debounce y resultados instantaneos

## Estructura

```
educacion-impositiva/
├── components/
│   ├── TipTapEditor.jsx       # Editor WYSIWYG y visor de contenido
│   ├── TipTapToolbar.jsx      # Barra de herramientas del editor
│   ├── ImageUploader.jsx      # Subir/insertar imagenes
│   ├── VideoEmbed.jsx         # Insertar videos de YouTube
│   ├── ArticuloCard.jsx       # Tarjeta de preview de articulo
│   ├── ArticuloViewer.jsx     # Vista completa de articulo
│   ├── ArticulosList.jsx      # Lista con filtros y busqueda
│   ├── CategoryFilter.jsx     # Filtro de categorias
│   ├── SearchBar.jsx          # Barra de busqueda con autocompletado
│   ├── ArticulosManager.jsx   # Panel de administracion
│   ├── ArticuloEditor.jsx     # Formulario de creacion/edicion
│   ├── CategoriasList.jsx     # Lista de categorias admin
│   ├── CategoriaForm.jsx      # Formulario de categoria
│   ├── SortableArticleList.jsx # Lista con drag & drop
│   └── index.js
├── hooks/
│   ├── useArticulos.js        # CRUD de articulos
│   ├── useArticulo.js         # Obtener articulo individual
│   ├── useCategorias.js       # CRUD de categorias
│   ├── useArticuloSearch.js   # Busqueda con debounce
│   ├── useCanEditEducacion.js # Verificar permisos de edicion
│   └── index.js
├── pages/
│   ├── EducacionPage.jsx      # Pagina principal
│   ├── EducacionArticuloPage.jsx # Vista de articulo
│   ├── EducacionAdminPage.jsx # Panel de administracion
│   └── index.js
├── services/
│   ├── articulosService.js    # Operaciones de articulos
│   ├── categoriasService.js   # Operaciones de categorias
│   ├── educacionStorageService.js # Subida de archivos
│   └── index.js
├── utils/
│   ├── permisos.js            # Roles con acceso a edicion
│   ├── formatters.js          # Formateo de fechas y texto
│   └── index.js
└── README.md
```

## Componentes

### Editor

- **TipTapEditor**: Editor WYSIWYG basado en TipTap con soporte para:
  - Formato basico (negrita, cursiva, subrayado, tachado)
  - Encabezados (H1, H2, H3)
  - Listas (ordenadas y no ordenadas)
  - Enlaces
  - Imagenes (subida a Supabase Storage o URL)
  - Videos de YouTube
  - Alineacion de texto

- **TipTapViewer**: Renderiza el contenido JSON de TipTap en modo solo lectura

### Visualizacion

- **ArticuloCard**: Tarjeta de preview con titulo, resumen, categoria, tiempo de lectura
- **ArticuloViewer**: Vista completa con metadata, autor, fecha de publicacion
- **ArticulosList**: Lista con filtros por categoria y busqueda
- **SearchBar**: Busqueda con resultados en dropdown

### Administracion

- **ArticulosManager**: Panel principal con estadisticas, filtros y lista sorteable
- **ArticuloEditor**: Formulario completo para crear/editar articulos
- **SortableArticleList**: Lista con drag & drop usando @dnd-kit
- **CategoriasList**: Gestion de categorias
- **CategoriaForm**: Modal para crear/editar categorias

## Hooks

| Hook | Descripcion |
|------|-------------|
| `useArticulos` | Lista articulos con filtros, CRUD completo |
| `useArticulo` | Obtiene un articulo por ID |
| `useArticuloBySlug` | Obtiene un articulo por slug |
| `useCategorias` | Lista y CRUD de categorias |
| `useArticuloSearch` | Busqueda con debounce de 300ms |
| `useCanEditEducacion` | Verifica si el usuario puede editar |

## Services

| Service | Funciones |
|---------|-----------|
| `articulosService` | `getArticulos`, `getArticuloBySlug`, `crearArticulo`, `actualizarArticulo`, `eliminarArticulo`, `cambiarEstadoArticulo`, `toggleDestacado`, `reordenarArticulos`, `buscarArticulos` |
| `categoriasService` | `getCategorias`, `crearCategoria`, `actualizarCategoria`, `eliminarCategoria` |
| `educacionStorageService` | `subirImagen`, `eliminarImagen` |

## Rutas

| Ruta | Pagina | Descripcion |
|------|--------|-------------|
| `/educacion` | EducacionPage | Lista de articulos publicados |
| `/educacion/:slug` | EducacionArticuloPage | Vista de articulo individual |
| `/educacion/admin` | EducacionAdminPage | Panel de administracion |
| `/educacion/admin/nuevo` | EducacionEditorPage | Crear nuevo articulo |
| `/educacion/admin/editar/:id` | EducacionEditorPage | Editar articulo existente |

## Permisos

Los siguientes roles pueden editar articulos y categorias:
- `admin`
- `contadora_principal`
- `comunicadora`
- `desarrollo`

Todos los usuarios autenticados pueden ver articulos publicados.

## Base de Datos

Ver `SQL_tables/25_educacion_impositiva.sql` para el esquema completo.

### Tablas

- **educacion_categorias**: Categorias de articulos
- **educacion_articulos**: Articulos con contenido JSONB
- **educacion_adjuntos**: Archivos adjuntos (imagenes)

### Storage

Bucket: `educacion-archivos`
- Imagenes de articulos en `/articulos/{articulo_id}/`
- Acceso publico para lectura

## Dependencias

```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-link": "^2.x",
  "@tiptap/extension-image": "^2.x",
  "@tiptap/extension-youtube": "^2.x",
  "@tiptap/extension-underline": "^2.x",
  "@tiptap/extension-text-align": "^2.x",
  "@tiptap/extension-placeholder": "^2.x",
  "@dnd-kit/core": "^6.x",
  "@dnd-kit/sortable": "^8.x",
  "@dnd-kit/utilities": "^3.x"
}
```

## Formato de Fechas

- Formato: `DD-MM-AAAA` (ej: 07-01-2026)
- Timezone: UTC-3 (Argentina)

## Ultima actualizacion

07-01-2026 - Creacion inicial del modulo
