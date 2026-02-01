/**
 * Utilidades para turnos recurrentes
 */

/**
 * Tipos de recurrencia disponibles
 */
export const TIPOS_RECURRENCIA = [
  { id: 'semanal', label: 'Semanal', descripcion: 'Cada semana', dias: 7 },
  { id: 'quincenal', label: 'Quincenal', descripcion: 'Cada 2 semanas', dias: 14 },
  { id: 'mensual', label: 'Mensual', descripcion: 'Cada mes', dias: null }
]

/**
 * Cantidad de turnos para series indeterminadas (6 meses aprox)
 */
export const TURNOS_INDETERMINADO = 26

/**
 * Cantidad mínima de turnos pendientes antes de auto-extender
 */
export const TURNOS_MINIMOS_PARA_EXTENSION = 8

/**
 * Cantidad de turnos a agregar al extender una serie
 */
export const TURNOS_EXTENSION = 12

/**
 * Genera las fechas de turnos recurrentes
 * @param {Object} opciones - Configuración de recurrencia
 * @param {string} opciones.fechaInicio - Fecha del primer turno (YYYY-MM-DD)
 * @param {string} opciones.tipo - Tipo de recurrencia (semanal, quincenal, mensual)
 * @param {number|string} opciones.cantidad - Cantidad de repeticiones (incluye la primera), o 'indeterminado' para 6 meses
 * @param {string} opciones.fechaFin - Fecha límite (opcional, alternativa a cantidad)
 * @returns {string[]} Array de fechas en formato YYYY-MM-DD
 */
export function generarFechasRecurrentes(opciones) {
  const { fechaInicio, tipo, cantidad, fechaFin } = opciones

  if (!fechaInicio || !tipo) return [fechaInicio]

  const fechas = []
  let fechaActual = new Date(fechaInicio + 'T12:00:00')
  const tipoConfig = TIPOS_RECURRENCIA.find(t => t.id === tipo)

  if (!tipoConfig) return [fechaInicio]

  // Determinar límite - si es 'indeterminado', usar 26 turnos (6 meses aprox)
  let maxIteraciones = cantidad === 'indeterminado' ? TURNOS_INDETERMINADO : (cantidad || 52)
  const fechaLimite = fechaFin ? new Date(fechaFin + 'T12:00:00') : null

  for (let i = 0; i < maxIteraciones; i++) {
    // Si hay fecha límite, verificar
    if (fechaLimite && fechaActual > fechaLimite) {
      break
    }

    // Agregar fecha actual
    fechas.push(fechaActual.toISOString().split('T')[0])

    // Calcular siguiente fecha
    if (tipo === 'mensual') {
      // Mensual: mismo día del mes siguiente
      const diaOriginal = new Date(fechaInicio + 'T12:00:00').getDate()
      fechaActual.setMonth(fechaActual.getMonth() + 1)

      // Ajustar si el día no existe en el mes (ej: 31 en febrero)
      const diasEnMes = new Date(
        fechaActual.getFullYear(),
        fechaActual.getMonth() + 1,
        0
      ).getDate()

      if (diaOriginal > diasEnMes) {
        fechaActual.setDate(diasEnMes)
      } else {
        fechaActual.setDate(diaOriginal)
      }
    } else {
      // Semanal o quincenal: sumar días
      fechaActual.setDate(fechaActual.getDate() + tipoConfig.dias)
    }
  }

  return fechas
}

/**
 * Calcula la fecha de fin sugerida basada en cantidad de repeticiones
 * @param {string} fechaInicio - Fecha inicio
 * @param {string} tipo - Tipo de recurrencia
 * @param {number} cantidad - Cantidad de repeticiones
 * @returns {string} Fecha de fin sugerida
 */
export function calcularFechaFinSugerida(fechaInicio, tipo, cantidad) {
  const fechas = generarFechasRecurrentes({ fechaInicio, tipo, cantidad })
  return fechas[fechas.length - 1] || fechaInicio
}

/**
 * Formatea descripción de recurrencia
 */
export function formatearRecurrencia(tipo, cantidad, fechaFin, esIndeterminado = false) {
  const tipoConfig = TIPOS_RECURRENCIA.find(t => t.id === tipo)
  if (!tipoConfig) return 'Sin recurrencia'

  let texto = tipoConfig.label.toLowerCase()

  if (esIndeterminado || cantidad === 'indeterminado') {
    texto += ', sin fecha fin'
  } else if (cantidad) {
    texto += `, ${cantidad} turnos`
  } else if (fechaFin) {
    texto += ` hasta ${fechaFin}`
  }

  return texto
}

/**
 * Verifica si un turno pertenece a una serie indeterminada
 */
export function esSerieIndeterminada(turno) {
  return turno?.es_indeterminado === true
}

/**
 * Prepara datos para crear múltiples turnos recurrentes
 * @param {Object} turnoBase - Datos del turno base
 * @param {Object} recurrencia - Configuración de recurrencia
 * @returns {Object[]} Array de turnos a crear
 */
export function prepararTurnosRecurrentes(turnoBase, recurrencia) {
  const esIndeterminado = recurrencia.cantidad === 'indeterminado'

  const fechas = generarFechasRecurrentes({
    fechaInicio: turnoBase.fecha,
    tipo: recurrencia.tipo,
    cantidad: recurrencia.cantidad,
    fechaFin: recurrencia.fechaFin
  })

  return fechas.map((fecha, index) => ({
    ...turnoBase,
    fecha,
    es_recurrente: true,
    recurrencia_tipo: recurrencia.tipo,
    recurrencia_fin: esIndeterminado ? null : (recurrencia.fechaFin || null),
    es_indeterminado: esIndeterminado,
    turno_padre_id: index === 0 ? null : 'PADRE_ID' // Se reemplaza después
  }))
}

/**
 * Campos que se propagan al editar un turno recurrente con propagación
 */
export const CAMPOS_PROPAGABLES = [
  'hora_inicio',
  'hora_fin',
  'notas',
  'modalidad',
  'link_videollamada'
]

/**
 * Recalcula las fechas futuras cuando cambia el día de la semana
 * @param {string} fechaOriginal - Fecha original del turno (YYYY-MM-DD)
 * @param {string} fechaNueva - Nueva fecha seleccionada (YYYY-MM-DD)
 * @param {string[]} fechasFuturas - Fechas de los turnos futuros
 * @param {string} tipoRecurrencia - Tipo de recurrencia (semanal, quincenal, mensual)
 * @returns {Object[]} Array con { fechaOriginal, fechaNueva } para cada turno
 */
export function recalcularFechasFuturas(fechaOriginal, fechaNueva, fechasFuturas, tipoRecurrencia) {
  const fechaOrig = new Date(fechaOriginal + 'T12:00:00')
  const fechaNuev = new Date(fechaNueva + 'T12:00:00')

  // Calcular diferencia de días
  const diffDias = Math.round((fechaNuev - fechaOrig) / (1000 * 60 * 60 * 24))

  // Si no hay diferencia, no recalcular
  if (diffDias === 0) return fechasFuturas.map(f => ({ fechaOriginal: f, fechaNueva: f }))

  return fechasFuturas.map(fechaFutura => {
    const fecha = new Date(fechaFutura + 'T12:00:00')
    fecha.setDate(fecha.getDate() + diffDias)
    return {
      fechaOriginal: fechaFutura,
      fechaNueva: fecha.toISOString().split('T')[0]
    }
  })
}
