# Modulo Mi Cartera

Gestion de cartera de clientes (monotributistas y responsables inscriptos).

## Funcionalidades

### Para la Contadora
- Lista de clientes con filtros y busqueda
- Ficha completa del cliente con edicion inline
- Auditoria de todos los cambios
- Gestion de locales comerciales
- Gestion de grupo familiar (obra social)
- Panel de sugerencias pendientes de clientes

### Para el Cliente
- Vista reducida de sus datos (sin info sensible)
- Puede sugerir correcciones en sus datos
- Ve el estado de sus sugerencias

## Permisos

| Rol | Ve | Edita | Sugerencias |
|-----|----|----|-------------|
| admin | Todos | Si | Procesa todas |
| contadora_principal | Todos | Si | Procesa todas |
| contador_secundario | Solo asignados | Si | Procesa sus clientes |
| monotributista | Solo su ficha | No | Puede sugerir |

## Estructura

```
mi-cartera/
├── components/
│   ├── FichaCliente.jsx              # Ficha completa (contadora)
│   ├── FichaClienteReducida.jsx      # Ficha reducida (cliente)
│   ├── FichaSeccion.jsx              # Seccion editable generica
│   ├── FichaSeccionLocales.jsx       # Gestion de locales
│   ├── FichaSeccionGrupoFamiliar.jsx # Gestion grupo familiar
│   ├── FichaHistorialCategorias.jsx  # Timeline categorias
│   ├── FichaAuditoria.jsx            # Historial de cambios
│   ├── ListaCartera.jsx              # Lista tabla/cards
│   ├── TarjetaCliente.jsx            # Card para mobile
│   ├── FiltrosCartera.jsx            # Panel de filtros
│   ├── ModalSugerirCambio.jsx        # Modal sugerir (cliente)
│   ├── MisSugerencias.jsx            # Lista sugerencias cliente
│   ├── PanelSugerenciasPendientes.jsx # Panel contadora
│   ├── TarjetaSugerencia.jsx         # Card de sugerencia
│   └── ModalProcesarSugerencia.jsx   # Aceptar/rechazar
├── hooks/
│   ├── useCartera.js                 # Lista clientes
│   ├── useClienteDetalle.js          # Detalle + edicion
│   └── useSugerencias.js             # Hooks sugerencias
├── services/
│   ├── carteraService.js             # CRUD cartera
│   ├── localesService.js             # CRUD locales
│   ├── grupoFamiliarService.js       # CRUD grupo familiar
│   └── sugerenciasService.js         # Sugerencias
├── utils/
│   └── camposSugeribles.js           # Config campos sugeribles
├── pages/
│   ├── MiCarteraPage.jsx             # /mi-cartera
│   └── ClienteDetallePage.jsx        # /mi-cartera/:clientId
└── README.md
```

## Tablas SQL relacionadas

- `client_fiscal_data` - Datos fiscales principales
- `client_locales` - Locales comerciales
- `client_grupo_familiar` - Integrantes obra social
- `client_audit_log` - Auditoria de cambios
- `client_sugerencias_cambio` - Sugerencias de clientes
- `vista_cartera_clientes` - Vista optimizada

## Componentes Principales

### FichaCliente
Ficha completa del cliente para la contadora. Incluye:
- Header con datos basicos y acciones rapidas
- Historial de categorias (timeline)
- Seccion datos fiscales (editable)
- Seccion situacion laboral (editable)
- Seccion locales comerciales (CRUD)
- Seccion obra social (editable)
- Seccion grupo familiar (CRUD)
- Seccion pago monotributo
- Seccion accesos ARCA
- Seccion domicilio fiscal
- Seccion ingresos brutos
- Notas internas
- Historial de auditoria

### FichaClienteReducida
Vista para el cliente de sus propios datos. Caracteristicas:
- Solo muestra campos permitidos
- Oculta informacion sensible
- Boton "Sugerir cambio" en cada campo editable
- Integracion con ModalSugerirCambio

### Sistema de Sugerencias
Flujo:
1. Cliente ve dato incorrecto
2. Toca boton "Sugerir cambio"
3. Completa formulario con valor correcto
4. Contadora recibe notificacion
5. Contadora acepta, modifica o rechaza
6. Cliente recibe notificacion del resultado
7. Si se acepta, se aplica el cambio automaticamente

## Hooks

### useCartera
```javascript
const { clientes, loading, filters, stats, updateFilters, refetch } = useCartera()
```

### useClienteDetalle
```javascript
const {
  cliente, auditoria, loading, saving,
  actualizarCampo, agregarLocal, eliminarLocal,
  agregarIntegrante, eliminarIntegrante
} = useClienteDetalle(clientId)
```

### useSugerencias
```javascript
// Para clientes
const { sugerencias, pendientes, procesadas, enviarSugerencia } = useMisSugerencias()

// Para contadoras
const { sugerencias, aceptar, rechazar, procesando } = useSugerenciasPendientes()
```

## Integracion

### En Mi Cuenta (clientes)
El modulo se integra en MiCuentaPage agregando dos tabs:
- "Datos Fiscales" - FichaClienteReducida
- "Sugerencias" - MisSugerencias

### En Dashboard (contadoras)
Se puede agregar el PanelSugerenciasPendientes para ver sugerencias pendientes directamente en el dashboard.

## Ultima actualizacion
2025-01-07 - Implementacion completa del modulo segun 13.md
