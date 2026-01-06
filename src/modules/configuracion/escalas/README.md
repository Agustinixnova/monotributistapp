# Modulo Escalas Monotributo

## Descripcion

Submodulo dentro de Configuracion para gestionar las categorias del Monotributo argentino (A-K), sus valores vigentes, y la configuracion de alertas del sistema.

## Estructura

```
escalas/
├── components/
│   ├── EscalasPage.jsx       # Pagina principal con tabs
│   ├── TablaCategorias.jsx   # Tabla de las 11 categorias vigentes
│   ├── FormCategoria.jsx     # Modal para editar UNA categoria
│   ├── ConfigAlertas.jsx     # Configuracion de umbrales de alertas
│   └── HistorialEscalas.jsx  # Lista de escalas anteriores
├── hooks/
│   ├── useCategorias.js      # CRUD de categorias
│   └── useAlertasConfig.js   # CRUD de configuracion de alertas
├── services/
│   └── escalasService.js     # Llamadas a Supabase
├── utils/
│   └── escalasUtils.js       # Helpers, constantes y validadores
└── README.md
```

## Componentes

### EscalasPage.jsx
Pagina principal con navegacion por tabs:
- **Categorias Vigentes**: Tabla con las 11 categorias actuales
- **Alertas**: Configuracion de umbrales de alertas
- **Historial**: Escalas anteriores archivadas

### TablaCategorias.jsx
Muestra las categorias vigentes (donde `vigente_hasta IS NULL`) con:
- Categoria (A-K)
- Tope facturacion anual
- Cuota servicios
- Cuota productos
- Acciones (editar)

### FormCategoria.jsx
Modal para editar una categoria individual con todos los campos:
- Tope facturacion anual
- Cuotas (servicios/productos)
- Impuesto integrado
- Aportes SIPA y obra social
- Parametros adicionales (superficie, energia, alquiler, precio unitario)

### ConfigAlertas.jsx
Formulario para configurar umbrales de alertas:
- % alerta recategorizacion (50-99%, default 80%)
- % alerta exclusion (70-99%, default 90%)
- Dias anticipacion vencimiento cuota (1-15, default 5)
- Dias anticipacion recategorizacion (5-30, default 15)

### HistorialEscalas.jsx
Lista de escalas anteriores con detalle expandible.

## Hooks

### useCategorias
- `categorias`: Array de categorias vigentes
- `historial`: Array de periodos historicos
- `loading`, `error`, `saving`: Estados
- `fechaVigencia`: Fecha desde la cual rigen las categorias
- `updateCategoria(id, data)`: Actualizar una categoria
- `cargarNuevaEscala(categorias, vigente_desde)`: Cargar escala completa
- `getCategoriasPorPeriodo(desde, hasta)`: Obtener categorias de un periodo

### useAlertasConfig
- `config`: Objeto con la configuracion de alertas
- `loading`, `error`, `saving`: Estados
- `updateConfig(newConfig)`: Actualizar configuracion

## Services

### escalasService
- `getCategoriasVigentes()`: Categorias donde vigente_hasta IS NULL
- `getHistorialEscalas()`: Escalas archivadas agrupadas por periodo
- `updateCategoria(id, data)`: Actualizar una categoria
- `cargarNuevaEscala(categorias, fecha)`: Archivar vigentes e insertar nuevas
- `getCategoriasPorPeriodo(desde, hasta)`: Categorias de un periodo especifico
- `getAlertasConfig()`: Configuracion de alertas
- `updateAlertasConfig(config)`: Actualizar configuracion

## Tablas de Base de Datos

### monotributo_categorias (existente)
Almacena las 11 categorias con sus valores por periodo.

### alertas_config (nueva)
Configuracion global de alertas. Solo puede haber una fila (singleton).

Ver `SQL_tables/13_alertas_config.sql` para el esquema completo.

## Permisos

| Rol | Ver | Editar |
|-----|-----|--------|
| admin | Si | Si |
| contadora_principal | Si | Si |
| contador_secundario | Si | No |

## Rutas

- `/configuracion/escalas` - Pagina principal del modulo

## Dependencias

- `react-router-dom` - Navegacion
- `lucide-react` - Iconos
- `supabase` - Cliente de base de datos

## Ultima actualizacion

Enero 2026 - Creacion del modulo
