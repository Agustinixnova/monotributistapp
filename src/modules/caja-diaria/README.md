# Módulo: Caja Diaria

## Descripción

Sistema para registrar entradas y salidas de dinero diarias. Permite llevar un control simple de caja como un cuaderno digitalizado, con funcionalidades de split de pagos y cierre de caja.

**Filosofía:** Máximo 3 toques para registrar un movimiento. Ultra simple, mobile-first.

## Características Principales

1. **Registrar movimientos** (entradas y salidas)
2. **Split de pagos** (una venta puede ser parte efectivo, parte Mercado Pago)
3. **Categorías configurables** por el usuario
4. **Métodos de pago configurables** (diferenciando efectivo vs digital)
5. **Cierre de caja diario** con arqueo
6. **Historial** de días anteriores
7. **Sistema de Fiados** - Gestión de ventas a crédito con clientes
8. **Cobranzas** - Cobro de deudas con registro automático en caja

## Estructura del Módulo

```
caja-diaria/
├── components/
│   ├── CajaDiariaPage.jsx          # Página principal
│   ├── ResumenDia.jsx              # Card de totales del día
│   ├── ResumenEfectivo.jsx         # Card efectivo en caja
│   ├── BotonesAccion.jsx           # Botones Entrada/Salida
│   ├── ModalMovimiento.jsx         # Modal para nuevo movimiento
│   ├── SelectorCategoria.jsx       # Grid de categorías
│   ├── InputsPago.jsx              # Inputs de montos por método
│   ├── InputMonto.jsx              # Input con formato (1.000)
│   ├── ListaMovimientos.jsx        # Lista de movimientos del día
│   ├── MovimientoItem.jsx          # Item individual de movimiento
│   ├── DetalleMetodosPago.jsx      # Pills de métodos usados
│   ├── ModalCierreCaja.jsx         # Modal de cierre de caja
│   ├── ModalRegistrarFiado.jsx     # Modal para registrar venta fiada
│   ├── ModalSelectorCliente.jsx    # Selector de cliente fiado
│   ├── ModalAvisoLimite.jsx        # Aviso de límite de crédito superado
│   ├── ModalClienteFiado.jsx       # CRUD de cliente fiado
│   ├── ModalCobranzas.jsx          # Lista de clientes con deuda
│   └── ModalDetalleDeuda.jsx       # Detalle y cobro de deuda
├── hooks/
│   ├── useCajaDiaria.js            # Hook principal (orquestador)
│   ├── useMovimientos.js           # CRUD movimientos
│   ├── useResumenDia.js            # Totales del día
│   ├── useCierreCaja.js            # Lógica de cierre
│   ├── useMetodosPago.js           # CRUD métodos de pago
│   ├── useCategorias.js            # CRUD categorías
│   ├── useClientesFiado.js         # CRUD clientes fiado
│   └── useCobranzas.js             # Gestión de cobranzas
├── services/
│   ├── movimientosService.js       # Supabase movimientos
│   ├── cierresService.js           # Supabase cierres
│   ├── metodosPagoService.js       # Supabase métodos de pago
│   ├── categoriasService.js        # Supabase categorías
│   ├── clientesFiadoService.js     # Supabase clientes fiado
│   ├── fiadosService.js            # Supabase ventas fiadas
│   └── cobranzasService.js         # Supabase cobranzas
├── utils/
│   ├── formatters.js               # Formateo moneda/hora/fecha
│   ├── calculosCaja.js             # Cálculos de totales
│   └── coloresConfig.js            # Colores e iconos
└── README.md
```

## Base de Datos

### Tablas

- **caja_metodos_pago**: Métodos de pago (sistema + personalizados)
- **caja_categorias**: Categorías de movimientos (sistema + personalizadas)
- **caja_movimientos**: Movimientos de caja
- **caja_movimientos_pagos**: Detalle de split de pagos
- **caja_cierres**: Cierres de caja diarios
- **caja_clientes_fiado**: Clientes que pueden comprar fiado
- **caja_fiados**: Ventas a crédito (deudas)
- **caja_pagos_fiado**: Cobranzas de deudas

### Funciones RPC

- **caja_resumen_dia(p_user_id, p_fecha)**: Retorna resumen del día (totales de entrada, salida, efectivo, digital)
- **caja_totales_por_metodo(p_user_id, p_fecha)**: Retorna totales agrupados por método de pago
- **caja_cliente_deuda(p_cliente_id)**: Retorna deuda total de un cliente
- **caja_clientes_con_deuda(p_user_id)**: Lista clientes con saldo pendiente > 0
- **caja_cliente_historial(p_cliente_id)**: Historial de fiados y pagos de un cliente
- **caja_registrar_pago_fiado(...)**: Registra pago y actualiza fiados (FIFO)

Ver migraciones completas en:
- `supabase/migrations/20260118000000_caja_diaria.sql`
- `supabase/migrations/20260119270000_caja_fiados.sql`

## Componentes Clave

### InputMonto

Input especial para montos con formateo en tiempo real:
- Formatea mientras escribes: `1000` → `1.000`
- Usa `inputMode="numeric"` para teclado numérico en mobile
- **NO usa autofocus** (problemas con iOS/Safari)

```jsx
<InputMonto
  value={monto}
  onChange={(valor) => setMonto(valor)}
  placeholder="0"
  className="w-full px-3 py-2 border rounded-lg"
/>
```

### ModalMovimiento

Modal para crear entradas y salidas con:
- Selector de categoría (grid de botones)
- Inputs de pago por cada método (split de pagos)
- Campo descripción opcional
- Validación automática

### ModalCierreCaja

Modal para cerrar caja al final del día:
- Muestra efectivo esperado
- Permite ingresar efectivo real
- Calcula diferencia automáticamente
- Solicita motivo si hay diferencia
- Muestra resumen de medios digitales

## Uso del Hook Principal

```javascript
import { useCajaDiaria } from '../hooks/useCajaDiaria'

function MiComponente() {
  const {
    fecha,               // Fecha actual seleccionada
    cambiarFecha,        // Cambiar de fecha
    irAHoy,             // Volver a hoy
    movimientos,        // { movimientos, loading, crear, anular, ... }
    resumen,            // { resumen, totalesPorMetodo, loading, ... }
    cierre,             // { cierre, saldoInicial, guardarCierre, estaCerrado, ... }
    metodosPago,        // { metodos, loading, crear, actualizar, eliminar, ... }
    categorias,         // { categorias, loading, crear, actualizar, eliminar, ... }
    loading,            // Loading general
    error,              // Error general
    refreshAll          // Refrescar todo
  } = useCajaDiaria()

  // Ejemplo: crear movimiento
  const handleCrearEntrada = async () => {
    await movimientos.crear({
      tipo: 'entrada',
      categoria_id: 'uuid-categoria',
      descripcion: 'Venta de producto',
      pagos: [
        { metodo_pago_id: 'uuid-efectivo', monto: 10000 },
        { metodo_pago_id: 'uuid-mp', monto: 5000 }
      ]
    })
    await refreshAll()
  }

  return <div>...</div>
}
```

## UX/UI Guidelines

1. **Mobile-first**: Botones grandes y táctiles
2. **Sin autofocus**: iOS/Safari rompe el scroll
3. **Formateo en tiempo real**: `1000` → `1.000` mientras escribes
4. **inputMode="numeric"**: Teclado numérico en celulares
5. **Colores claros**:
   - Verde para entradas (`bg-emerald-500`)
   - Rojo para salidas (`bg-red-500`)
   - Violeta para acciones (`bg-violet-600`)
6. **Anular vs borrar**: Nunca borrar, siempre anular para auditoría
7. **Cierre de caja**: Una vez cerrado, no se puede editar ese día

## Métodos de Pago Predeterminados

El sistema incluye estos métodos por defecto:
- 💵 Efectivo (es_efectivo: true)
- 📱 Mercado Pago (es_efectivo: false)
- 💳 Tarjeta (es_efectivo: false)
- 📲 QR (es_efectivo: false)
- 🏦 Transferencia (es_efectivo: false)
- 📦 Otros (es_efectivo: false)

Los usuarios pueden crear métodos personalizados.

## Categorías Predeterminadas

### Entradas
- 🏪 Venta offline
- 🛒 Venta online
- 💰 Cobro de deuda
- 📥 Ingreso varios

### Salidas
- 📦 Pago proveedor
- 🧾 Pago servicios
- 👤 Retiro de caja
- 💼 Pago sueldos
- 📤 Gasto varios

### Ambos (entrada o salida)
- 🔄 Ajuste de caja

Los usuarios pueden crear categorías personalizadas.

## Dependencias

- React 19
- Supabase Client
- Lucide React (iconos)
- Tailwind CSS

## Rutas

- **Principal**: `/herramientas/caja-diaria`

## Permisos

El módulo está disponible para los siguientes roles:
- admin
- contadora_principal
- contador_secundario
- monotributista
- responsable_inscripto
- comunicadora
- desarrollo

## Migración

Para aplicar las tablas y configuración inicial:

```bash
# Aplicar migración
supabase db push

# O desde SQL editor de Supabase:
# Ejecutar: supabase/migrations/20260118000000_caja_diaria.sql
```

La migración incluye:
- Creación de todas las tablas
- Políticas RLS
- Funciones RPC
- Datos seed (métodos y categorías del sistema)
- Registro del módulo en la tabla `modules`

## Última actualización

**Fecha:** 2026-01-19
**Cambios realizados:**
- Sistema de Fiados completo:
  - Gestión de clientes fiado (CRUD)
  - Límite de crédito opcional por cliente
  - Registro de ventas fiadas (no afecta caja del día)
  - Sistema de cobranzas con registro automático en caja
  - Saldado de fiados FIFO al cobrar
  - Historial de fiados y pagos por cliente
- Botón de cobranzas en header con badge de clientes con deuda
- Tab "Clientes Fiado" en configuración
- Categoría especial "Fiado" que abre flujo de fiados

**Fecha:** 2026-01-18
**Cambios anteriores:**
- Creación completa del módulo Caja Diaria
- Implementación de split de pagos
- Sistema de cierre de caja
- Métodos y categorías configurables
- Integración en la aplicación
