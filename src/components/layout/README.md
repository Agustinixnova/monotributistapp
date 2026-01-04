# Módulo Layout

Sistema de layout responsive para MonotributistApp.

## Componentes

### Layout
Wrapper principal que incluye Sidebar + Header + contenido.

```jsx
import { Layout } from '../components/layout'

function MiPagina() {
  return (
    <Layout title="Mi Página">
      {/* Contenido de la página */}
    </Layout>
  )
}
```

**Props:**
- `children`: Contenido de la página
- `title`: Título que se muestra en el header (default: "Dashboard")

### Sidebar
Menú de navegación lateral.

**Comportamiento:**
- **Desktop (≥1024px):** Fijo a la izquierda, siempre visible
- **Mobile (<1024px):** Drawer que se abre desde la izquierda con overlay

**Props:**
- `isOpen`: Boolean que controla si está abierto (solo afecta mobile)
- `onClose`: Función para cerrar el sidebar

### Header
Barra superior con título y acciones.

**Props:**
- `onMenuClick`: Función para abrir el sidebar (mobile)
- `title`: Título de la página actual

## Estructura de archivos

```
src/components/layout/
├── Layout.jsx      # Wrapper principal
├── Sidebar.jsx     # Navegación lateral
├── Header.jsx      # Barra superior
├── index.js        # Exports
└── README.md       # Esta documentación
```

## Menú de navegación

Los items del menú están definidos en `Sidebar.jsx`:

```js
const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Gestión de Usuarios', icon: Users, path: '/usuarios' },
  // ...
]
```

Para agregar un nuevo item, simplemente añadirlo al array.

## Estilos

- **Sidebar width:** 256px (w-64)
- **Header height:** 64px (h-16)
- **Background:** Gray-50 para el área principal
- **Cards:** White con border gray-200

## Responsive

- El sidebar usa `lg:` breakpoint (1024px)
- En mobile, el contenido ocupa todo el ancho
- En desktop, el contenido tiene `lg:pl-64` para el espacio del sidebar
