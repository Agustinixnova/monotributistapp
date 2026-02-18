/**
 * Utilidades de fecha para Dev Tools
 * Todas las fechas se muestran en timezone Argentina (UTC-3)
 * Formato: DD/MM/AAAA HH:mm
 */

const TIMEZONE_ARGENTINA = 'America/Argentina/Buenos_Aires'

/**
 * Formatea una fecha ISO a formato argentino con timezone UTC-3
 * @param {string|Date} fecha - Fecha ISO o Date object
 * @param {boolean} incluirHora - Si incluir hora (default: true)
 * @returns {string} Fecha formateada DD/MM/AAAA HH:mm
 */
export function formatearFechaArg(fecha, incluirHora = true) {
  if (!fecha) return 'N/A'

  try {
    const date = new Date(fecha)

    if (isNaN(date.getTime())) return 'Fecha inválida'

    const options = {
      timeZone: TIMEZONE_ARGENTINA,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(incluirHora && {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }

    return date.toLocaleString('es-AR', options)
  } catch (err) {
    console.error('Error formateando fecha:', err)
    return 'Error'
  }
}

/**
 * Formatea una fecha ISO a formato corto DD/MM/AAAA
 * @param {string|Date} fecha - Fecha ISO o Date object
 * @returns {string} Fecha formateada DD/MM/AAAA
 */
export function formatearFechaCorta(fecha) {
  return formatearFechaArg(fecha, false)
}

/**
 * Formatea una fecha ISO a formato completo con segundos
 * @param {string|Date} fecha - Fecha ISO o Date object
 * @returns {string} Fecha formateada DD/MM/AAAA HH:mm:ss
 */
export function formatearFechaCompleta(fecha) {
  if (!fecha) return 'N/A'

  try {
    const date = new Date(fecha)

    if (isNaN(date.getTime())) return 'Fecha inválida'

    return date.toLocaleString('es-AR', {
      timeZone: TIMEZONE_ARGENTINA,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  } catch (err) {
    return 'Error'
  }
}

/**
 * Formatea tiempo relativo (hace X minutos/horas/días)
 * @param {string|Date} fecha - Fecha ISO o Date object
 * @returns {string} Tiempo relativo
 */
export function formatearTiempoRelativo(fecha) {
  if (!fecha) return 'N/A'

  try {
    const date = new Date(fecha)
    const ahora = new Date()
    const diffMs = ahora - date
    const diffMin = Math.floor(diffMs / 60000)
    const diffHoras = Math.floor(diffMin / 60)
    const diffDias = Math.floor(diffHoras / 24)

    if (diffMin < 1) return 'Ahora'
    if (diffMin < 60) return `Hace ${diffMin} min`
    if (diffHoras < 24) return `Hace ${diffHoras}h`
    if (diffDias < 7) return `Hace ${diffDias}d`

    return formatearFechaCorta(fecha)
  } catch (err) {
    return 'Error'
  }
}
