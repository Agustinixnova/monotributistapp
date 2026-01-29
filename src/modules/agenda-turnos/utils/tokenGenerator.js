/**
 * Utilidad para generar tokens seguros para links de reserva
 */

/**
 * Genera un token aleatorio seguro de la longitud especificada
 * @param {number} length - Longitud del token (default: 32)
 * @returns {string} Token aleatorio en base64url
 */
export function generateToken(length = 32) {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  // Convertir a base64url (seguro para URLs)
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

/**
 * Genera un token corto y legible para compartir
 * Formato: XXXX-XXXX-XXXX (12 caracteres alfanuméricos)
 * @returns {string} Token formateado
 */
export function generateShortToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sin I, O, 0, 1 para evitar confusión
  const array = new Uint8Array(12)
  crypto.getRandomValues(array)

  let token = ''
  for (let i = 0; i < 12; i++) {
    token += chars[array[i] % chars.length]
    if ((i + 1) % 4 === 0 && i < 11) {
      token += '-'
    }
  }

  return token
}

/**
 * Valida que un token tenga el formato correcto
 * @param {string} token - Token a validar
 * @returns {boolean} true si el token es válido
 */
export function isValidToken(token) {
  if (!token || typeof token !== 'string') return false

  // Token largo (hex)
  if (/^[a-f0-9]{32,64}$/i.test(token)) return true

  // Token corto (XXXX-XXXX-XXXX)
  if (/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(token)) return true

  return false
}

export default {
  generateToken,
  generateShortToken,
  isValidToken
}
