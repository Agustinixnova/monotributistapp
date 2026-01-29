# Facturación Electrónica - Módulo Agenda & Turnos

## Estado: IMPLEMENTADO

Fecha de documentación: 29-01-2026

---

## Descripción General

Integración de facturación electrónica AFIP dentro del módulo de Agenda & Turnos.
Permite facturar los cobros de turnos completados.

---

## Ubicación en la App

```
Agenda & Turnos
  └── Cobros (pestaña existente)
        └── Facturación (nueva sub-pestaña)
```

---

## Estructura de la Vista

### Filtros Superiores
- **Período**: Selector de mes/año (default: mes actual)
- **Buscar**: Por nombre de cliente

### Secciones de Pagos

#### 1. Pagos Electrónicos (Transferencia, MercadoPago, QR)
- Se pueden facturar
- Tabla con checkbox para selección múltiple

#### 2. Pagos en Efectivo
- Se pueden facturar
- Tabla con checkbox para selección múltiple

#### 3. Canje / Gratis / Otro
- Solo informativo
- NO se facturan
- Sin checkbox ni acciones

---

## Columnas de la Tabla

| Columna | Descripción |
|---------|-------------|
| ☐ | Checkbox para selección (solo secciones facturables) |
| Fecha | Fecha del turno |
| Cliente | Nombre del cliente |
| Servicio(s) | Lista de servicios del turno |
| Medio de Pago | Transferencia, MP, QR, Efectivo, etc. |
| Monto | Importe total del turno (NO desglosado por seña/cobro) |
| Estado | Badge: "Sin facturar" (rojo) / "Facturado" (verde) |
| Acciones | Botón [Facturar] o [Ver PDF] si ya está facturado |

---

## Totales por Sección

Mostrar al pie de cada sección:
```
Total Electrónicos: $150.000 | Sin facturar: $45.000 | Facturado: $105.000
```

---

## Acciones de Facturación

### 1. Facturar Individual
- Botón [Facturar] en cada fila
- Genera 1 Factura C para ese turno

### 2. Facturar Seleccionados (Lote)
- Checkbox múltiple + botón [Facturar seleccionados]
- **Lógica de agrupación:**
  - Clientes con DNI/CUIT registrado → Se agrupan en 1 sola factura
  - Consumidor Final (sin datos) → 1 factura por cada turno

### 3. Facturar Todo el Mes
- Botón rápido para facturar todos los pendientes del período
- Aplica la misma lógica de agrupación por cliente

---

## Lógica de Agrupación para Lotes

```javascript
// Ejemplo: Selecciono 10 turnos
// - 3 turnos de "Juan Pérez" (DNI: 12345678)
// - 3 turnos de "María García" (DNI: 87654321)
// - 4 turnos de "Consumidor Final" (sin datos)

// Resultado:
// - 1 Factura C para Juan Pérez ($suma de 3 turnos)
// - 1 Factura C para María García ($suma de 3 turnos)
// - 4 Facturas C individuales para cada Consumidor Final
```

---

## Datos para la Factura

### Del Turno
- `fecha` → fecha_servicio_desde y fecha_servicio_hasta
- `servicios[]` → descripción de la factura
- `total` → importe_total

### Del Cliente (agenda_clientes)
- `nombre` → receptor_nombre
- `dni` → receptor_nro_doc (tipo 96)
- `cuit` → receptor_nro_doc (tipo 80)
- Si no tiene datos → Consumidor Final (tipo 99, nro 0)

### De la Config AFIP (agenda_config_afip)
- `cuit` → CUIT del emisor
- `razon_social` → Nombre del emisor
- `punto_venta` → Punto de venta
- `logo_url` → Logo para el PDF

---

## Componentes a Crear

```
src/modules/agenda-turnos/components/facturacion/
├── README.md                    # Este archivo
├── TabFacturacion.jsx           # Componente principal (sub-pestaña)
├── SeccionPagos.jsx             # Sección de pagos (electrónicos/efectivo/otros)
├── TablaTurnosPorFacturar.jsx   # Tabla con turnos
├── ModalFacturarLote.jsx        # Confirmación de facturación por lote
├── ModalFacturaEmitida.jsx      # Resultado de factura emitida (con link PDF)
└── hooks/
    └── useFacturacionTurnos.js  # Hook para lógica de facturación
```

---

## Servicios Existentes

Ya creados en `src/modules/agenda-turnos/services/`:

- `afipService.js` - Emisión de facturas AFIP
- `facturasPdfService.js` - Generación de PDFs

---

## Base de Datos

### Tablas existentes
- `agenda_config_afip` - Configuración AFIP del usuario
- `agenda_facturas` - Registro de facturas emitidas

### Relación con turnos
- `agenda_facturas.turno_id` → `agenda_turnos.id`
- Un turno puede tener 1 factura asociada

---

## Estados de Facturación

| Estado | Condición |
|--------|-----------|
| Sin facturar | turno completado + cobrado + sin factura asociada |
| Facturado | existe registro en agenda_facturas con ese turno_id |

---

## Queries Principales

### Obtener turnos por facturar del mes
```sql
SELECT
  t.id,
  t.fecha,
  t.total,
  c.nombre as cliente_nombre,
  c.dni as cliente_dni,
  c.cuit as cliente_cuit,
  tp.metodo_pago,
  f.id as factura_id
FROM agenda_turnos t
JOIN agenda_clientes c ON t.cliente_id = c.id
LEFT JOIN agenda_turno_pagos tp ON tp.turno_id = t.id
LEFT JOIN agenda_facturas f ON f.turno_id = t.id
WHERE t.duenio_id = :duenio_id
  AND t.estado = 'completado'
  AND t.fecha >= :inicio_mes
  AND t.fecha <= :fin_mes
ORDER BY t.fecha DESC
```

---

## Notas Adicionales

1. **Concepto AFIP**: Siempre "Servicios" (código 2)
2. **Tipo de Comprobante**: Factura C (código 11) para monotributistas
3. **Moneda**: Pesos argentinos (PES)
4. **IVA**: No se discrimina (monotributista)

---

## Dependencias

- `@afipsdk/afip.js` - SDK de AFIP (ya instalado)
- `jspdf` - Generación de PDFs (ya instalado)
- `qrcode` - QR para facturas (ya instalado)
- `react-easy-crop` - Recorte de logos (ya instalado)

---

## Implementación Completada

1. [x] Implementar TabFacturacion.jsx
2. [x] Implementar SeccionPagos.jsx (tabla de turnos por categoría)
3. [x] Implementar lógica de agrupación por cliente (useFacturacionTurnos.js)
4. [x] Implementar facturación por lote (ModalFacturarLote.jsx)
5. [x] Agregar sub-pestaña en Cobros (CobrosAgenda.jsx wrapper)
6. [x] Modal de resultado (ModalFacturaEmitida.jsx)
7. [ ] Testing con ambiente de producción AFIP

---

## Archivos Creados

```
src/modules/agenda-turnos/components/facturacion/
├── README.md                    # Este archivo
├── TabFacturacion.jsx           # Componente principal (sub-pestaña)
├── SeccionPagos.jsx             # Sección de pagos (electrónicos/efectivo/otros)
├── ModalFacturarLote.jsx        # Confirmación de facturación por lote
├── ModalFacturaEmitida.jsx      # Resultado de factura emitida
└── useFacturacionTurnos.js      # Hook para lógica de facturación

src/modules/agenda-turnos/components/cobros/
├── CobrosAgenda.jsx             # Wrapper con sub-pestañas (Cobros | Facturación)
└── CobrosLista.jsx              # Lista de cobros original
```

---

## Última Actualización

29-01-2026 - Implementación completa del módulo de facturación
