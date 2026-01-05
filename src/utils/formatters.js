/**
 * Utilidades de formateo globales
 * Timezone: America/Argentina/Buenos_Aires (UTC-3)
 */

/**
 * Formatea una fecha en formato dd/mm/yyyy
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha formateada o string vacío si no hay fecha
 */
export function formatDate(date) {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires'
  }).format(dateObj)
}

/**
 * Formatea un monto a pesos argentinos
 * @param {number} amount - Monto a formatear
 * @returns {string} Monto formateado o '-' si es null/undefined
 */
export function formatPrice(amount) {
  if (amount === null || amount === undefined) return '-'

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
