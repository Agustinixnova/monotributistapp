# Módulo Develop Tools

## Descripción
Herramientas de desarrollo y mantenimiento del sistema. Solo visible para el usuario administrador de desarrollo (agustin@ixnova.com.ar).

## Acceso
- Botón con icono de llave inglesa (naranja) a la izquierda de la campana de notificaciones
- Solo visible cuando el usuario logueado es `agustin@ixnova.com.ar`

## Estructura
```
develop-tools/
├── components/
│   ├── DevToolsModal.jsx      # Modal principal con tabs
│   ├── PanelSalud.jsx         # Panel de salud del sistema
│   ├── PanelErrores.jsx       # Panel de errores capturados
│   ├── TarjetaServicio.jsx    # Tarjeta individual de servicio
│   └── index.js
├── hooks/
│   ├── useSaludSistema.js     # Hook para gestionar health checks
│   └── index.js
├── services/
│   ├── saludService.js        # Funciones de verificación de salud
│   └── errorService.js        # Captura y registro de errores
├── utils/
│   └── umbrales.js            # Definición de umbrales verde/amarillo/rojo
└── README.md
```

---

## Herramienta 1: Salud del Sistema

### Servicios monitoreados
1. **Supabase Database** - Ping y latencia
2. **Supabase Auth** - Servicio de autenticación
3. **Supabase Storage** - Buckets disponibles
4. **Supabase Realtime** - Conexión websocket
5. **ARCA/AFIP** - WSAA (autenticación) y WSFE (facturación)
6. **DolarApi.com** - API de cotización del dólar
7. **ArgentinaDatos.com** - API de feriados
8. **Edge Functions** - Estado del servicio
9. **Claude API** - API de Anthropic (verificación de key)

### Umbrales
- **Latencia DB**: 🟢 ≤100ms | 🟡 ≤500ms | 🔴 >500ms
- **Latencia API**: 🟢 ≤1s | 🟡 ≤3s | 🔴 >3s
- **Storage**: 🟢 ≤70% | 🟡 ≤90% | 🔴 >90%

### Funcionalidades
- Vista con tarjetas tipo semáforo
- Resumen rápido (X operativos, Y alertas, Z errores)
- Detalles expandibles por servicio
- Botón "Refrescar todo"
- Auto-refresh cada 60 segundos (opcional)

---

## Herramienta 2: Panel de Errores

### Descripción
Captura automática de errores del frontend para debugging y monitoreo.

### Tipos de errores capturados
- **JavaScript**: `window.onerror`, promesas rechazadas
- **React**: ErrorBoundary con component stack
- **Supabase**: Errores de queries/mutations (con wrapper)
- **Network**: Errores de fetch/conexión
- **Manual**: Errores capturados con `captureError()`

### Información capturada por error
| Campo | Descripción |
|-------|-------------|
| mensaje | Mensaje del error |
| stack_trace | Stack trace completo |
| component_stack | Stack de componentes React |
| usuario_id/email | Quién tuvo el error |
| url | URL donde ocurrió |
| navegador | User agent |
| viewport | Tamaño de pantalla |
| modulo | Módulo de la app (extraído de URL) |
| severidad | warning / error / fatal |
| tipo | javascript / react / supabase / network / manual |
| accion_previa | Qué hizo el usuario antes |
| contexto | JSON con datos adicionales |
| supabase_code | Código de error de Supabase |
| ocurrencias | Cantidad de veces que ocurrió |

### Estados de un error
- **nuevo**: Recién capturado, sin revisar
- **visto**: Ya lo revisaste
- **resuelto**: Bug arreglado
- **ignorado**: No es un problema real

### Funcionalidades del panel
- Lista de errores con filtros (estado, severidad, módulo, período)
- Vista de detalle con toda la información
- Agrupación automática de errores iguales (por hash)
- Contador de ocurrencias
- Botón "Copiar para Claude" (genera markdown formateado)
- Botón para limpiar errores viejos (+30 días)

### Uso en el código

```javascript
// Captura automática (ya configurada en main.jsx)
// Los errores de window.onerror y promesas se capturan solos

// Captura manual
import { captureError, registrarAccion, captureSupabaseError } from '@/modules/develop-tools/services/errorService'

// Registrar qué está haciendo el usuario (opcional, mejora el contexto)
registrarAccion('Click: Guardar Cliente')

// Capturar error manualmente
try {
  // código que puede fallar
} catch (error) {
  captureError(error, {
    tipo: 'manual',
    severidad: 'error',
    accion: 'Guardando cliente',
    contexto: { clienteId: 123 }
  })
}

// Capturar error de Supabase
const { data, error } = await supabase.from('clientes').select('*')
if (error) {
  captureSupabaseError(error, 'Cargar lista de clientes')
}

// O usar el wrapper que captura automáticamente
import { withErrorCapture } from '@/modules/develop-tools/services/errorService'

const { data, error } = await withErrorCapture(
  supabase.from('clientes').select('*'),
  'Cargar clientes'
)
```

### ErrorBoundary
```jsx
import ErrorBoundary from '@/components/common/ErrorBoundary'

// Envolver componentes que pueden fallar
<ErrorBoundary>
  <ComponenteRiesgoso />
</ErrorBoundary>

// Con fallback personalizado
<ErrorBoundary fallback={<p>Algo salió mal</p>}>
  <ComponenteRiesgoso />
</ErrorBoundary>
```

---

## Tabla SQL

Ver `SQL_tables/error_logs.sql` para el esquema completo.

Funciones RPC disponibles:
- `registrar_error(...)` - Inserta o incrementa contador de error existente
- `limpiar_errores_viejos(dias)` - Elimina errores resueltos/ignorados antiguos

---

## Seguridad
Este módulo está protegido por verificación de email en el frontend.
El email autorizado está definido en:
- `src/components/layout/Header.jsx` → constante `DEV_USER_EMAIL`

---

## Próximas herramientas
- [ ] SQL Runner
- [ ] Logs de actividad
- [ ] Simulador de roles
- [ ] Test de notificaciones

---

## Última actualización
2026-02-01 - Panel de Errores con captura automática y manual
2026-02-01 - Creación inicial con Salud del Sistema
