/**
 * Utilidades de fecha/hora para Caja Diaria
 * Todas las funciones usan timezone UTC-3 (Argentina)
 */

const TIMEZONE = 'America/Argentina/Buenos_Aires'

/**
 * Obtiene la fecha actual en Argentina en formato YYYY-MM-DD
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function getFechaHoyArgentina() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  return formatter.format(new Date())
}

/**
 * Obtiene el timestamp actual en formato ISO pero en hora Argentina
 * @returns {string} Timestamp ISO con hora de Argentina
 */
export function getTimestampArgentina() {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

  const parts = formatter.formatToParts(now)
  const get = (type) => parts.find(p => p.type === type)?.value || '00'

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`
}

/**
 * Obtiene la fecha de ayer en Argentina en formato YYYY-MM-DD
 * @param {string} fecha - Fecha base en formato YYYY-MM-DD (opcional, default: hoy)
 * @returns {string} Fecha de ayer en formato YYYY-MM-DD
 */
export function getFechaAyerArgentina(fecha = null) {
  // Crear fecha a medianoche en Argentina
  const baseDate = fecha
    ? parseFechaArgentina(fecha)
    : new Date()

  // Obtener componentes en timezone Argentina
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  // Restar un día (86400000 ms)
  const ayer = new Date(baseDate.getTime() - 86400000)
  return formatter.format(ayer)
}

/**
 * Parsea una fecha string YYYY-MM-DD considerando timezone Argentina
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @returns {Date} Objeto Date
 */
export function parseFechaArgentina(fechaStr) {
  // Crear fecha a medianoche en Argentina (UTC-3 = +03:00 en invierno)
  // Usar hora 12:00 para evitar problemas de cambio de día por DST
  return new Date(fechaStr + 'T12:00:00-03:00')
}

/**
 * Formatea una fecha para mostrar al usuario (DD/MM/YYYY)
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD o ISO
 * @returns {string} Fecha formateada DD/MM/YYYY
 */
export function formatFechaDisplay(fechaStr) {
  if (!fechaStr) return ''

  const date = fechaStr.includes('T')
    ? new Date(fechaStr)
    : parseFechaArgentina(fechaStr)

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

/**
 * Formatea una fecha para mostrar con nombre del mes
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada (ej: "15 de enero de 2026")
 */
export function formatFechaLarga(fechaStr) {
  if (!fechaStr) return ''

  const date = parseFechaArgentina(fechaStr)

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

/**
 * Formatea fecha y hora para mostrar al usuario
 * @param {string} timestampStr - Timestamp ISO
 * @returns {string} Fecha y hora formateada
 */
export function formatFechaHoraDisplay(timestampStr) {
  if (!timestampStr) return ''

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestampStr))
}

/**
 * Obtiene solo la hora de un timestamp
 * @param {string} timestampStr - Timestamp ISO
 * @returns {string} Hora formateada HH:MM
 */
export function formatHoraDisplay(timestampStr) {
  if (!timestampStr) return ''

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestampStr))
}

/**
 * Verifica si una fecha es hoy en Argentina
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @returns {boolean}
 */
export function esHoyArgentina(fechaStr) {
  return fechaStr === getFechaHoyArgentina()
}

/**
 * Obtiene el nombre del día de la semana
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @returns {string} Nombre del día (ej: "lunes")
 */
export function getNombreDia(fechaStr) {
  const date = parseFechaArgentina(fechaStr)

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIMEZONE,
    weekday: 'long'
  }).format(date)
}

/**
 * Obtiene la hora actual de Argentina en formato HH:MM:SS
 * @returns {string} Hora en formato HH:MM:SS
 */
export function getHoraArgentina() {
  return new Date().toLocaleTimeString('es-AR', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}
