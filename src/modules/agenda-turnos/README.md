# Módulo: Agenda & Turnos

## Descripción General

Módulo de gestión de turnos y agenda para micro-emprendedores de servicios:
- Nails / Lashes
- Barberías
- Estéticas
- Masajistas
- Consultorios pequeños
- Fotógrafos
- Profesores particulares

**Objetivo**: Que el usuario pueda organizar su día, evitar superposiciones, registrar clientes, cobrar señas, ver facturación y mantener historial.

---

## Usuarios del Módulo

| Rol | Acceso |
|-----|--------|
| `operador_gastos` (dueño) | Acceso completo: agenda propia, empleados, clientes, servicios, configuración |
| `operador_gastos_empleado` | Acceso limitado: su propia agenda, clientes del dueño + propios, crear turnos |

### Modelo de empleados con agenda

- Cada empleado puede tener su **propia disponibilidad horaria** (diferente al dueño)
- Empleados pueden tener **clientes propios** (para trabajo particular fuera del local)
- Empleados acceden a **clientes globales del dueño** para turnos en el local

---

## Funcionalidades Core

### 1. Calendario Central

**Vistas:**
- **Semana** (vista principal) - overview de toda la semana
- **Día** - detalle de un día específico
- **Mes** - vista general mensual

**Características:**
- Bloques horarios configurables
- Colores por tipo de servicio
- Filtro por profesional (dueño/empleados)
- Drag & drop para mover turnos
- Indicador visual de estados

### 2. Estados de Turno

| Estado | Color | Descripción |
|--------|-------|-------------|
| `pendiente` | Amarillo | Reservado, sin confirmar |
| `confirmado` | Verde | Cliente confirmó asistencia |
| `en_curso` | Azul | Turno en progreso |
| `completado` | Gris/Check | Turno finalizado y cobrado |
| `cancelado` | Negro | Cancelado (con/sin seña) |
| `no_asistio` | Rojo | Cliente no se presentó |

**Transiciones válidas:**
```
pendiente → confirmado → en_curso → completado
pendiente → cancelado
confirmado → cancelado
confirmado → no_asistio
en_curso → completado
```

### 3. Servicios (Catálogo)

Cada servicio tiene:
- Nombre
- Duración base (minutos) - puede ser flexible
- Precio base
- Costo estimado (opcional)
- Requiere seña (sí/no)
- Porcentaje de seña
- Color identificador
- Profesionales que lo ofrecen
- Activo/inactivo

**Ejemplo:**
```
"Lifting de pestañas"
- Duración: 60 min (flexible: 45-90)
- Precio: $18.000
- Seña: 30% ($5.400)
- Color: Rosa
- Profesionales: María, Laura
```

### 4. Clientes

**Ficha básica:**
- Nombre
- Teléfono
- WhatsApp
- Email (opcional)
- Notas
- Fecha de alta

**Datos calculados (historial):**
- Total de turnos
- Turnos completados
- Cancelaciones / No asistencias
- Total gastado
- Última visita
- Servicios más frecuentes

**Propiedad de clientes:**
- Clientes del dueño → accesibles por empleados del local
- Clientes propios del empleado → solo del empleado

### 5. Turnos

**Datos del turno:**
- Fecha y hora inicio
- Fecha y hora fin (calculada o manual)
- Profesional asignado
- Cliente
- Servicios (uno o varios)
- Estado
- Notas internas
- Recordatorio enviado (sí/no)

**Duración:**
- Se calcula sumando duración de servicios
- Puede ajustarse manualmente (duración flexible)

### 6. Pagos y Señas

**Por turno:**
- Monto total (suma de servicios)
- Seña cobrada
- Método de pago seña
- Fecha cobro seña
- Saldo pendiente
- Pago final
- Método de pago final

**Integración con Caja Diaria:**
```
1. Cliente reserva turno con seña → movimiento en caja (fecha de reserva)
2. Cliente asiste y paga resto → movimiento en caja (fecha del turno)
```

**Cancelaciones:**
- Opción 1: Transferir seña a nuevo turno
- Opción 2: Dueño se queda con la seña (no hay movimiento adicional)
- Opción 3: Devolver seña (movimiento negativo en caja)

### 7. Disponibilidad Horaria

**Configurable por profesional:**
- Días de trabajo
- Horario por día (inicio/fin)
- Horario de almuerzo/break
- Excepciones (feriados, vacaciones)

**Ejemplo:**
```
Dueño (María):
  Lun-Vie: 08:00 - 18:00 (almuerzo 13:00-14:00)
  Sáb: 09:00 - 13:00

Empleada (Laura - manicurista):
  Mar-Jue: 08:00 - 12:00

Empleada (Carla - pestañas):
  Lun, Vie: 13:00 - 18:00
```

### 8. Recordatorios

**MVP:** Link a WhatsApp pre-armado
- Botón "Enviar recordatorio" abre WhatsApp con mensaje predefinido
- Mensaje configurable por el usuario
- Se marca como "recordatorio enviado"

**Futuro:**
- WhatsApp Business API (automático)
- Notificaciones push (app nativa)
- Email

### 9. Turnos Recurrentes

- "Viene todos los martes a las 10"
- Crear serie de turnos automáticamente
- Opciones: semanal, quincenal, mensual
- Fecha fin de recurrencia

### 10. Estadísticas

- Turnos por día/semana/mes
- Ingresos por período
- Servicios más solicitados
- Clientes más frecuentes
- Tasa de cancelación/no asistencia
- Comparativo con período anterior

---

## Diseño de Base de Datos

### Tablas Principales

```sql
-- Servicios del catálogo
agenda_servicios (
  id UUID PK,
  duenio_id UUID FK → usuarios_free,
  nombre VARCHAR,
  duracion_minutos INT,
  duracion_minima INT,
  duracion_maxima INT,
  precio DECIMAL,
  costo_estimado DECIMAL,
  requiere_sena BOOLEAN,
  porcentaje_sena INT,
  color VARCHAR,
  activo BOOLEAN,
  created_at, updated_at
)

-- Qué profesionales ofrecen qué servicios
agenda_servicio_profesionales (
  id UUID PK,
  servicio_id UUID FK,
  profesional_id UUID FK → usuarios_free,
  precio_override DECIMAL NULL, -- si tiene precio diferente
  activo BOOLEAN
)

-- Clientes de agenda
agenda_clientes (
  id UUID PK,
  duenio_id UUID FK → usuarios_free, -- dueño del cliente
  creado_por UUID FK → usuarios_free, -- quien lo creó (puede ser empleado)
  nombre VARCHAR,
  telefono VARCHAR,
  whatsapp VARCHAR,
  email VARCHAR,
  notas TEXT,
  es_cliente_empleado BOOLEAN, -- true = cliente particular del empleado
  activo BOOLEAN,
  created_at, updated_at
)

-- Disponibilidad horaria por profesional
agenda_disponibilidad (
  id UUID PK,
  profesional_id UUID FK → usuarios_free,
  dia_semana INT, -- 0=dom, 1=lun, etc
  hora_inicio TIME,
  hora_fin TIME,
  activo BOOLEAN
)

-- Excepciones de disponibilidad (feriados, vacaciones, etc)
agenda_excepciones (
  id UUID PK,
  profesional_id UUID FK → usuarios_free,
  fecha DATE,
  todo_el_dia BOOLEAN,
  hora_inicio TIME,
  hora_fin TIME,
  motivo VARCHAR,
  tipo ENUM('bloqueo', 'horario_especial')
)

-- Turnos
agenda_turnos (
  id UUID PK,
  duenio_id UUID FK → usuarios_free, -- dueño del negocio
  profesional_id UUID FK → usuarios_free, -- quien atiende
  cliente_id UUID FK → agenda_clientes,
  fecha DATE,
  hora_inicio TIME,
  hora_fin TIME,
  duracion_real INT, -- minutos reales (puede diferir de servicios)
  estado ENUM('pendiente','confirmado','en_curso','completado','cancelado','no_asistio'),
  notas TEXT,
  recordatorio_enviado BOOLEAN,
  fecha_recordatorio TIMESTAMP,
  -- Recurrencia
  es_recurrente BOOLEAN,
  recurrencia_tipo ENUM('semanal','quincenal','mensual'),
  recurrencia_fin DATE,
  turno_padre_id UUID FK → agenda_turnos, -- si es parte de serie
  created_at, updated_at
)

-- Servicios incluidos en cada turno
agenda_turno_servicios (
  id UUID PK,
  turno_id UUID FK,
  servicio_id UUID FK,
  precio DECIMAL, -- precio al momento (puede diferir del catálogo)
  duracion INT -- duración asignada
)

-- Pagos del turno
agenda_turno_pagos (
  id UUID PK,
  turno_id UUID FK,
  tipo ENUM('sena', 'pago_final', 'devolucion'),
  monto DECIMAL,
  metodo_pago_id UUID FK → caja_metodos_pago,
  fecha_pago DATE,
  registrado_en_caja BOOLEAN,
  caja_movimiento_id UUID FK → caja_movimientos, -- referencia al movimiento
  notas TEXT,
  created_at
)
```

### Índices Importantes

```sql
-- Búsqueda de turnos por fecha y profesional
CREATE INDEX idx_turnos_fecha_prof ON agenda_turnos(fecha, profesional_id);

-- Búsqueda de clientes
CREATE INDEX idx_clientes_duenio ON agenda_clientes(duenio_id);
CREATE INDEX idx_clientes_nombre ON agenda_clientes(nombre);

-- Disponibilidad
CREATE INDEX idx_disponibilidad_prof ON agenda_disponibilidad(profesional_id, dia_semana);
```

---

## Fases de Implementación

### FASE 1: MVP Core ✅
**Objetivo:** Poder crear y gestionar turnos básicos

- [x] Estructura de carpetas del módulo
- [x] Tablas SQL básicas (servicios, clientes, turnos)
- [x] CRUD de Servicios
- [x] CRUD de Clientes (básico)
- [x] Calendario vista día
- [x] Crear turno (un servicio, sin seña)
- [x] Estados: pendiente → confirmado → completado/cancelado
- [x] Navegación entre días

**Entregable:** Usuario puede crear servicios, clientes y agendar turnos en vista día.

### FASE 2: Calendario Completo ✅
**Objetivo:** Vista semanal y mejor UX

- [x] Vista semana (principal)
- [x] Vista mes
- [x] Colores por servicio
- [x] Turno rápido (crear en 3 clicks)
- [x] Múltiples servicios por turno
- [x] Duración flexible
- [ ] Filtro por profesional (pendiente para Fase 4)

**Entregable:** Calendario completo con todas las vistas.

### FASE 3: Pagos y Caja ✅
**Objetivo:** Gestión de señas e integración con Caja Diaria

- [x] Señas por turno
- [x] Métodos de pago (reusar de caja)
- [x] Integración automática con Caja Diaria
- [x] Gestión de cancelaciones con seña (devolución)
- [x] Saldo pendiente y pago final
- [x] Modal de detalle de turno con pagos

**Entregable:** Flujo completo de cobro conectado a caja.

### FASE 4: Multi-profesional ✅
**Objetivo:** Soporte para dueño + empleados

- [x] Disponibilidad horaria configurable
- [x] Excepciones (días bloqueados)
- [x] Agenda por empleado (filtro por profesional)
- [x] Selector de profesional en calendario
- [x] Tab de configuración "Horarios"
- [x] Servicios por profesional (con precios especiales por profesional)
- [x] Clientes propios vs globales (empleados pueden tener clientes particulares)

**Entregable:** Negocio con múltiples profesionales funcionando.

### FASE 5: Engagement ✅
**Objetivo:** Fidelización y profesionalización

- [x] Recordatorios WhatsApp (link pre-armado)
- [x] Historial completo del cliente
- [x] Estadísticas básicas (turnos, ingresos, distribución semanal)
- [x] Tab de estadísticas en página principal
- [x] Turnos recurrentes (semanal, quincenal, mensual)
- [x] Drag & drop en calendario (vista semana)

**Entregable:** Herramienta profesional completa.

### FASE 6+: Crecimiento (Futuro)
- Link público de reservas
- QR para local
- Lista de espera
- Reprogramar turnos
- Paquetes de servicios
- Membresías
- Multi-sucursal

---

## Estructura de Carpetas

```
src/modules/agenda-turnos/
├── components/
│   ├── calendario/
│   │   ├── CalendarioDia.jsx
│   │   ├── CalendarioSemana.jsx
│   │   ├── CalendarioMes.jsx
│   │   ├── TurnoCard.jsx
│   │   └── TurnoRapido.jsx
│   ├── turnos/
│   │   ├── ModalTurno.jsx
│   │   ├── FormTurno.jsx
│   │   └── EstadoTurnoBadge.jsx
│   ├── servicios/
│   │   ├── ListaServicios.jsx
│   │   ├── ModalServicio.jsx
│   │   ├── ServicioCard.jsx
│   │   └── AsignarProfesionales.jsx
│   ├── clientes/
│   │   ├── ListaClientes.jsx
│   │   ├── ModalCliente.jsx
│   │   ├── ClienteCard.jsx
│   │   └── HistorialCliente.jsx
│   ├── disponibilidad/
│   │   ├── ConfigDisponibilidad.jsx
│   │   └── HorarioSemanal.jsx
│   └── estadisticas/
│       └── DashboardAgenda.jsx
├── hooks/
│   ├── useServicios.js
│   ├── useClientes.js
│   ├── useTurnos.js
│   ├── useDisponibilidad.js
│   └── useDragDrop.js
├── services/
│   ├── serviciosService.js
│   ├── clientesService.js
│   ├── turnosService.js
│   └── disponibilidadService.js
├── utils/
│   ├── calendarioUtils.js
│   ├── horariosUtils.js
│   └── formatters.js
├── pages/
│   └── AgendaTurnosPage.jsx
└── README.md (este archivo)
```

---

## Flujo de Usuario Principal

```
1. Usuario abre módulo Agenda
2. Ve calendario semanal con sus turnos
3. Click en horario vacío → "Turno rápido" o "Nuevo turno"
4. Selecciona cliente (existente o nuevo)
5. Selecciona servicio(s)
6. Ve horarios disponibles
7. Confirma turno
8. (Opcional) Cobra seña → va a Caja Diaria
9. Turno aparece en calendario
10. (Opcional) Envía recordatorio por WhatsApp
11. Cliente asiste → marca "en curso"
12. Finaliza → marca "completado" → cobra resto → va a Caja Diaria
```

---

## Integración con Caja Diaria

### Categorías automáticas

Se crearán categorías en Caja Diaria:
- "Seña de turno" (entrada)
- "Cobro de turno" (entrada)
- "Devolución de seña" (salida)

### Movimientos automáticos

Cuando se registra un pago en Agenda:
1. Se crea movimiento en `caja_movimientos`
2. Se guarda referencia en `agenda_turno_pagos.caja_movimiento_id`
3. Descripción incluye: cliente + servicio(s)

### Ejemplo de movimiento:

```
Tipo: Entrada
Categoría: Seña de turno
Descripción: "Seña - María González - Lifting pestañas"
Monto: $5.400
Método: Transferencia
```

---

## Notas de Diseño UI/UX

### Mobile First
- El calendario debe ser usable en móvil
- Turno rápido accesible con pulgar
- Gestos: swipe para cambiar día/semana

### Colores de servicios
- Paleta predefinida (10-15 colores)
- Usuario elige al crear servicio
- Consistencia visual en calendario

### Estados visuales
- Badges claros con iconos
- No depender solo del color (accesibilidad)

### Feedback inmediato
- Toast al crear/modificar turno
- Animaciones sutiles
- Loading states

---

## Última actualización
Enero 2025 - Fase 4/5 completadas: servicios por profesional, clientes propios vs globales, drag & drop en calendario
