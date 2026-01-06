# Modulo Escalas Monotributo

## Descripcion

Submodulo dentro de Configuracion para gestionar las categorias del Monotributo argentino (A-K), sus valores vigentes segun ARCA, y la configuracion de alertas del sistema.

## Estructura

```
escalas/
├── components/
│   ├── EscalasPage.jsx       # Pagina principal con tabs
│   ├── TablaCategorias.jsx   # Tabla de las 11 categorias vigentes
│   ├── DetalleCategoria.jsx  # Vista expandida mobile
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

## Campos de la Tabla ARCA

Cada categoria (A-K) tiene los siguientes campos segun la tabla oficial de ARCA:

### Limites de la Categoria

| Campo | Descripcion | Tipo |
|-------|-------------|------|
| `tope_facturacion_anual` | Ingresos Brutos Anuales maximos | Moneda |
| `superficie_maxima` | Superficie Afectada maxima | m2 |
| `energia_maxima` | Energia Electrica consumida anualmente | kW |
| `alquiler_maximo` | Alquileres Devengados Anuales maximos | Moneda |
| `precio_unitario_maximo` | Precio Unitario Maximo para venta de cosas muebles | Moneda |

### Impuesto Integrado

| Campo | Descripcion | Tipo |
|-------|-------------|------|
| `impuesto_integrado_servicios` | Impuesto Integrado - Locaciones y prestaciones de servicios | Moneda |
| `impuesto_integrado_productos` | Impuesto Integrado - Venta de cosas muebles | Moneda |

### Aportes

| Campo | Descripcion | Tipo |
|-------|-------------|------|
| `aporte_sipa` | Aporte al SIPA (Sistema Integrado Previsional Argentino) | Moneda |
| `aporte_obra_social` | Aporte Obra Social | Moneda |

### Totales (Calculados)

| Campo | Descripcion | Formula |
|-------|-------------|---------|
| `cuota_total_servicios` | Cuota mensual total para servicios | Imp.Int.Serv + SIPA + Obra Social |
| `cuota_total_productos` | Cuota mensual total para productos | Imp.Int.Prod + SIPA + Obra Social |

## Categorias Solo Productos

Las categorias **I, J y K** son exclusivamente para venta de productos. No pueden usarse para prestacion de servicios.

## Componentes

### EscalasPage.jsx
Pagina principal con navegacion por tabs:
- **Categorias Vigentes**: Tabla con las 11 categorias actuales
- **Alertas**: Configuracion de umbrales de alertas
- **Historial**: Escalas anteriores archivadas

### TablaCategorias.jsx
Vista responsive de las categorias:
- **Mobile**: Tabla simplificada con filas expandibles que muestran todos los detalles
- **Desktop**: Tabla completa con todas las columnas ARCA agrupadas

### DetalleCategoria.jsx
Vista expandida para mobile que muestra todos los campos de una categoria en formato card vertical.

### FormCategoria.jsx
Modal para editar una categoria individual, organizado en 4 secciones:
1. **Limites de la Categoria**: Tope facturacion, superficie, energia, alquileres, precio unitario
2. **Impuesto Integrado**: Servicios y productos
3. **Aportes**: SIPA y obra social
4. **Totales**: Calculados automaticamente

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

## Como Actualizar Escalas

Cuando ARCA publica nuevos valores (generalmente en febrero y agosto):

1. Acceder a `/configuracion/escalas`
2. Clic en "Cargar nueva escala"
3. Ingresar la fecha de vigencia (desde cuando rigen)
4. Completar los valores para cada categoria
5. Los totales se calculan automaticamente
6. Guardar - las escalas anteriores se archivan automaticamente

### Actualizacion via SQL

Tambien se puede actualizar directamente en la base de datos:

```sql
-- 1. Archivar escalas vigentes
UPDATE public.monotributo_categorias
SET vigente_hasta = '2025-07-31'
WHERE vigente_hasta IS NULL;

-- 2. Insertar nuevas escalas
INSERT INTO public.monotributo_categorias (
    categoria, tope_facturacion_anual, superficie_maxima, energia_maxima,
    alquiler_maximo, precio_unitario_maximo,
    impuesto_integrado_servicios, impuesto_integrado_productos,
    aporte_sipa, aporte_obra_social,
    cuota_total_servicios, cuota_total_productos,
    vigente_desde
) VALUES
('A', 8992597.87, 30, 3330, 2091301.83, 536767.47, 4182.60, 4182.60, 13663.17, 19239.97, 37085.74, 37085.74, '2025-08-01'),
-- ... resto de categorias
```

## Referencias ARCA

### Quienes NO ingresan impuesto integrado

- Trabajadores independientes promovidos
- Asociados a cooperativas cuando sus ingresos brutos no superen la suma maxima establecida para la categoria A
- Sujetos que adhieran exclusivamente como locadores de bienes inmuebles (maximo 2 inmuebles)
- Inscriptos en el Registro Nacional de Efectores cuando sus ingresos brutos no superen categoria A
- Quienes desarrollen exclusivamente actividades primarias (tabaco, cana de azucar, yerba mate o te) hasta categoria D

### Superficie Afectada

Este parametro no debera considerarse en ciudades de menos de 40.000 habitantes (excepto algunas excepciones)

### Exceptuados de ingresar aportes SIPA y obra social

- Quienes se encuentran obligados por otros regimenes previsionales
- Los menores de 18 anos
- Los contribuyentes que adhirieron al monotributo por locacion de bienes muebles y/o inmuebles
- Las sucesiones indivisas
- Quienes se jubilaron por leyes anteriores al 07/1994

### Obra Social

Afiliacion individual a obra social, sin adherentes. Por cada adherente, ademas, debera ingresarse ese mismo importe.

## Tablas de Base de Datos

### monotributo_categorias
Almacena las 11 categorias con sus valores por periodo.
Ver `SQL_tables/07_monotributo_categorias.sql` para el esquema.

### alertas_config
Configuracion global de alertas. Solo puede haber una fila (singleton).
Ver `SQL_tables/13_alertas_config.sql` para el esquema.

## Permisos

| Rol | Ver | Editar |
|-----|-----|--------|
| admin | Si | Si |
| contadora_principal | Si | Si |
| comunicadora | Si | Si |
| desarrollo | Si | Si |
| contador_secundario | Si | No |
| monotributista | Si | No |

## Rutas

- `/configuracion/escalas` - Pagina principal del modulo

## Dependencias

- `react-router-dom` - Navegacion
- `lucide-react` - Iconos (Scale, Bell, History, Edit2, Plus, Calendar, ChevronRight, Info, Calculator, X, Save, AlertCircle)
- `supabase` - Cliente de base de datos

## Valores Vigentes (Agosto 2025)

| Cat | Ingresos Brutos | Cuota Servicios | Cuota Productos |
|-----|-----------------|-----------------|-----------------|
| A | $8.992.597,87 | $37.085,74 | $37.085,74 |
| B | $13.175.201,52 | $42.216,41 | $42.216,41 |
| C | $18.473.166,15 | $49.435,58 | $48.320,22 |
| D | $22.934.610,05 | $63.357,80 | $61.824,18 |
| E | $26.977.793,60 | $89.714,31 | $81.070,26 |
| F | $33.809.379,57 | $112.906,59 | $97.291,54 |
| G | $40.431.835,35 | $172.457,38 | $118.920,05 |
| H | $61.344.853,64 | $391.400,62 | $238.038,48 |
| I | $68.664.410,05 | - | $355.672,64 |
| J | $78.632.948,76 | - | $434.895,92 |
| K | $94.805.682,90 | - | $525.732,01 |

## Ultima actualizacion

Enero 2026 - Tabla completa con todos los campos ARCA, vista responsive mobile/desktop
