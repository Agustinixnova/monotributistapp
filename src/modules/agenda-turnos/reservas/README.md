# Módulo de Reservas por Link

## Descripción

Sistema de auto-gestión de turnos para clientes a través de links personalizados enviados por WhatsApp. Permite al profesional generar un link único para cada cliente con slots de tiempo pre-seleccionados, donde el cliente puede reservar su turno sin necesidad de crear una cuenta.

---

## Flujo General

### 1. Profesional genera link

```
Profesional → Selecciona cliente → Selecciona servicios a ofrecer →
Define rango de fechas → Marca slots disponibles → Agrega mensaje (opcional) →
Genera link → Copia y envía por WhatsApp
```

### 2. Cliente reserva

```
Cliente abre link → Ve su nombre y mensaje del profesional →
Ve servicios disponibles con precios → Selecciona servicio(s) →
Ve slots disponibles en tiempo real → Confirma →
Turno queda "pendiente_confirmacion" → Ve pantalla de confirmación
```

### 3. Profesional confirma

```
Recibe notificación → Abre turno pendiente →
Si requiere seña: la cobra → Confirma turno →
Turno pasa a "pendiente" (activo)
```

---

## Estados del Turno

```
┌─────────────────────────┐
│ pendiente_confirmacion  │  ← Reservado por cliente via link
└───────────┬─────────────┘
            │ Profesional confirma
            ▼
┌─────────────────────────┐
│       pendiente         │  ← Confirmado, esperando el día
└───────────┬─────────────┘
            │ Cliente asiste
            ▼
┌─────────────────────────┐
│       completado        │  ← Servicio realizado
└─────────────────────────┘

En cualquier punto puede pasar a:
- cancelado
- no_asistio (solo desde pendiente)
```

---

## Especificaciones Técnicas

### Tabla: `agenda_reserva_links`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | PK |
| `token` | string (unique) | Token único para el link (ej: abc123xyz) |
| `profesional_id` | uuid | FK → auth.users (quien genera el link) |
| `cliente_id` | uuid | FK → agenda_clientes (cliente seleccionado) |
| `servicios_ids` | uuid[] | Array de IDs de servicios habilitados |
| `fecha_desde` | date | Inicio del rango de fechas disponibles |
| `fecha_hasta` | date | Fin del rango de fechas disponibles |
| `slots_disponibles` | jsonb | Slots específicos marcados por el profesional |
| `mensaje_personalizado` | text | Mensaje opcional del profesional |
| `created_at` | timestamptz | Fecha de creación |
| `expires_at` | timestamptz | Fecha de expiración (created_at + 48hs) |
| `estado` | string | 'activo', 'usado', 'expirado' |
| `turno_id` | uuid | FK → agenda_turnos (turno creado si se usó) |

### Estructura de `slots_disponibles` (JSONB)

```json
{
  "2025-01-29": ["08:00", "08:30", "09:00", "15:00", "15:30", "16:00"],
  "2025-01-30": ["10:00", "10:30", "11:00", "14:00", "14:30"],
  "2025-01-31": ["09:00", "09:30", "10:00", "10:30"]
}
```

El profesional marca específicamente qué horarios ofrecer de cada día.

---

## Cálculo de Slots Disponibles

El sistema muestra al profesional los slots considerando:

1. **Disponibilidad configurada**: Horarios de trabajo del profesional
2. **Turnos existentes**: Excluye horarios ya ocupados
3. **Selección manual**: El profesional marca cuáles de los disponibles ofrecer

### Ejemplo:

```
Configuración: Martes 08:00 - 20:00
Turnos existentes: 08:00-10:00, 10:30-12:00
Slots libres: 10:00, 12:00, 12:30, 13:00... hasta 19:30

Profesional marca: 15:00, 15:30, 16:00, 16:30, 17:00
→ Solo esos aparecen en el link del cliente
```

---

## Múltiples Servicios

Cuando el cliente selecciona múltiples servicios:

1. Se suman las duraciones (ej: Corte 45min + Barba 30min = 75min)
2. Se filtran los slots donde cabe el tiempo total sin superposición
3. Se valida contra turnos existentes en tiempo real

### Ejemplo:

```
Cliente selecciona: Corte (45min) + Barba (30min) = 75min total
Slot disponible: 15:00
→ Se verifica que 15:00 - 16:15 esté libre
→ Si hay turno a las 16:00, este slot NO aparece disponible
```

---

## URL del Link

```
https://tudominio.com/reservar/{token}
```

Ejemplo: `https://mimonotributo.com/reservar/abc123xyz789`

**Nota**: Cada link pertenece al profesional que lo generó. El turno se crea asociado a ese profesional.

---

## Expiración del Link

- **Duración**: 48 horas desde la creación
- **Link expirado**: Muestra mensaje amigable
  ```
  "Este link ha expirado.
   Contactate para recibir un nuevo link."
  ```
- **Link usado**: Muestra mensaje
  ```
  "Ya reservaste un turno con este link.
   [Ver detalles de tu reserva]"
  ```

---

## Notificaciones al Profesional

Cuando un cliente reserva via link:

1. **Campana de notificaciones** - Icono con badge de número
2. **Badge en módulo** - "X turnos pendientes de confirmación"
3. **Alerta en calendario** - Color/icono distinto para estos turnos
4. **Push notification** - Notificación al dispositivo

---

## Pantalla de Confirmación (Cliente)

Después de reservar, el cliente ve:

```
✓ Tu turno fue reservado

Fecha: Miércoles 29 de Enero, 2025
Hora: 15:00 hs
Servicio(s): Corte de pelo, Barba
Duración estimada: 1h 15min
Precio aproximado: $8.500

[Datos del local - A CONFIGURAR]
- Nombre del negocio
- Dirección
- WhatsApp de contacto

⚠️ Ante cualquier cambio o cancelación,
   por favor comunicarse con anticipación.

[Agregar a Google Calendar]
```

---

## Reglas de Negocio

1. **Un link = Una reserva**: Después de usar el link, queda marcado como "usado"
2. **Múltiples links por cliente**: Permitido (cada link es independiente)
3. **El cliente NO puede cancelar**: Debe comunicarse con el profesional
4. **Slots en tiempo real**: Si otro reserva un slot, desaparece para todos
5. **Servicios con seña**: Se pueden reservar, la seña se cobra al confirmar

---

## Estructura de Carpetas (Implementado)

```
src/modules/agenda-turnos/
├── components/
│   └── reservas/
│       ├── ModalGenerarLink.jsx      # Modal para crear link (IMPLEMENTADO)
│       ├── SelectorSlots.jsx         # Selector de slots disponibles (IMPLEMENTADO)
│       └── ListaReservaLinks.jsx     # Lista de links existentes (IMPLEMENTADO)
│
├── hooks/
│   └── useReservaLinks.js            # CRUD de links de reserva (IMPLEMENTADO)
│
├── services/
│   └── reservaLinksService.js        # Operaciones con Supabase (IMPLEMENTADO)
│
├── utils/
│   └── tokenGenerator.js             # Generación de tokens únicos (IMPLEMENTADO)
│
├── pages/
│   └── ReservarPage.jsx              # Página pública de reserva (IMPLEMENTADO)
│
└── reservas/
    └── README.md                     # Esta documentación
```

---

## Página Pública de Reserva

Ubicación: `src/pages/ReservarPage.jsx` (fuera del módulo, es pública)

Ruta: `/reservar/:token`

**Características:**
- No requiere autenticación
- Diseño mobile-first
- Carga datos del link por token
- Valida expiración y estado
- Muestra servicios y slots en tiempo real
- Confirma reserva y muestra pantalla de éxito

---

## Estado de Implementación

### Completado
- [x] Crear tabla `agenda_reserva_links` en Supabase
- [x] Implementar componentes del profesional (ModalGenerarLink, SelectorSlots, ListaReservaLinks)
- [x] Crear página pública de reserva (ReservarPage.jsx)
- [x] Agregar estado `pendiente_confirmacion` a turnos
- [x] Configuración de datos del local/negocio (ConfigNegocio, agenda_negocio)
- [x] Agregar nuevo estado a ESTADOS_TURNO en formatters.js
- [x] Servicio de links de reserva (reservaLinksService.js)
- [x] Hook useReservaLinks.js
- [x] Utilidad tokenGenerator.js

### Pendientes
- [ ] Sistema de notificaciones (campana, badge, push)
- [ ] Filtro en calendario para ver turnos pendientes de confirmación
- [ ] Agregar a Google Calendar desde página de confirmación

---

## Dependencias

Este módulo depende de:
- `agenda_turnos` - Tabla de turnos
- `agenda_clientes` - Tabla de clientes
- `agenda_servicios` - Tabla de servicios
- `agenda_disponibilidad` - Configuración de horarios
- Sistema de notificaciones (a implementar)

---

## Última actualización

Fecha: 28 de Enero, 2026
Estado: Implementación inicial completada - Funcionalidad core operativa
