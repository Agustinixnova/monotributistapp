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
 * Genera las fechas de turnos recurrentes
 * @param {Object} opciones - Configuración de recurrencia
 * @param {string} opciones.fechaInicio - Fecha del primer turno (YYYY-MM-DD)
 * @param {string} opciones.tipo - Tipo de recurrencia (semanal, quincenal, mensual)
 * @param {number} opciones.cantidad - Cantidad de repeticiones (incluye la primera)
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

  // Determinar límite
  let maxIteraciones = cantidad || 52 // Máximo 52 repeticiones (1 año semanal)
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
export function formatearRecurrencia(tipo, cantidad, fechaFin) {
  const tipoConfig = TIPOS_RECURRENCIA.find(t => t.id === tipo)
  if (!tipoConfig) return 'Sin recurrencia'

  let texto = tipoConfig.label.toLowerCase()

  if (cantidad) {
    texto += `, ${cantidad} turnos`
  } else if (fechaFin) {
    texto += ` hasta ${fechaFin}`
  }

  return texto
}

/**
 * Prepara datos para crear múltiples turnos recurrentes
 * @param {Object} turnoBase - Datos del turno base
 * @param {Object} recurrencia - Configuración de recurrencia
 * @returns {Object[]} Array de turnos a crear
 */
export function prepararTurnosRecurrentes(turnoBase, recurrencia) {
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
    recurrencia_fin: recurrencia.fechaFin || null,
    turno_padre_id: index === 0 ? null : 'PADRE_ID' // Se reemplaza después
  }))
}
