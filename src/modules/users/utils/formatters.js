/**
 * Formateadores para el módulo de usuarios
 */

/**
 * Formatea un CUIT con guiones
 * @param {string} cuit - CUIT sin formato
 * @returns {string} CUIT formateado (XX-XXXXXXXX-X)
 */
export function formatCUIT(cuit) {
  if (!cuit) return ''
  const cleanCuit = cuit.replace(/[-\s]/g, '')
  if (cleanCuit.length !== 11) return cuit
  return `${cleanCuit.slice(0, 2)}-${cleanCuit.slice(2, 10)}-${cleanCuit.slice(10)}`
}

/**
 * Formatea un número de teléfono argentino
 * @param {string} phone
 * @returns {string}
 */
export function formatPhone(phone) {
  if (!phone) return ''
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')

  // Si tiene código de país
  if (cleanPhone.startsWith('54')) {
    const withoutCountry = cleanPhone.slice(2)
    if (withoutCountry.length === 10) {
      return `+54 ${withoutCountry.slice(0, 2)} ${withoutCountry.slice(2, 6)}-${withoutCountry.slice(6)}`
    }
  }

  // Formato local
  if (cleanPhone.length === 10) {
    return `${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`
  }

  return phone
}

/**
 * Formatea un DNI con puntos
 * @param {string} dni
 * @returns {string}
 */
export function formatDNI(dni) {
  if (!dni) return ''
  const cleanDni = dni.replace(/[\.\s]/g, '')
  return cleanDni.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Formatea una fecha para mostrar
 * @param {string|Date} date
 * @param {Object} options
 * @returns {string}
 */
export function formatDate(date, options = {}) {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date

  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
    ...options
  }

  return dateObj.toLocaleDateString('es-AR', defaultOptions)
}

/**
 * Formatea una fecha y hora
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date

  return dateObj.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires'
  })
}

/**
 * Formatea un monto como moneda argentina
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return ''

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount)
}

/**
 * Formatea el nombre completo de un usuario
 * @param {Object} user
 * @returns {string}
 */
export function formatFullName(user) {
  if (!user) return ''
  return `${user.nombre || ''} ${user.apellido || ''}`.trim()
}

/**
 * Obtiene las iniciales de un nombre
 * @param {string} nombre
 * @param {string} apellido
 * @returns {string}
 */
export function getInitials(nombre, apellido) {
  const n = nombre ? nombre.charAt(0).toUpperCase() : ''
  const a = apellido ? apellido.charAt(0).toUpperCase() : ''
  return `${n}${a}`
}

/**
 * Formatea el tipo de contribuyente para mostrar
 * @param {string} tipo
 * @returns {string}
 */
export function formatTipoContribuyente(tipo) {
  const tipos = {
    'monotributista': 'Monotributista',
    'responsable_inscripto': 'Responsable Inscripto'
  }
  return tipos[tipo] || tipo
}

/**
 * Formatea el régimen de IIBB para mostrar
 * @param {string} regimen
 * @returns {string}
 */
export function formatRegimenIIBB(regimen) {
  const regimenes = {
    'simplificado': 'Simplificado',
    'general': 'Régimen General',
    'convenio_multilateral': 'Convenio Multilateral',
    'exento': 'Exento'
  }
  return regimenes[regimen] || regimen
}

/**
 * Trunca un texto largo
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}
