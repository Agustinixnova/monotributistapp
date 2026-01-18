/**
 * Servicio de cache en localStorage para Panel Economico
 * Evita llamadas excesivas a APIs externas
 */

const CACHE_PREFIX = 'panel_economico_v3_'
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos

/**
 * Obtiene un item del cache si no ha expirado
 * @param {string} key - Clave del cache
 * @returns {Object|null} Datos del cache o null si expirado/no existe
 */
export const getFromCache = (key) => {
  try {
    const item = localStorage.getItem(`${CACHE_PREFIX}${key}`)
    if (!item) return null

    const { data, timestamp, ttl } = JSON.parse(item)
    const isExpired = Date.now() - timestamp > ttl

    if (isExpired) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`)
      return null
    }

    return { data, timestamp }
  } catch {
    return null
  }
}

/**
 * Guarda un item en cache con TTL
 * @param {string} key - Clave del cache
 * @param {any} data - Datos a guardar
 * @param {number} ttl - Tiempo de vida en ms
 */
export const setInCache = (key, data, ttl = DEFAULT_TTL) => {
  try {
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    }
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item))
  } catch (error) {
    console.warn('Error saving to cache:', error)
  }
}

/**
 * Obtiene el timestamp de cuando se guardo el cache
 * @param {string} key - Clave del cache
 * @returns {Date|null} Fecha de guardado
 */
export const getCacheTimestamp = (key) => {
  try {
    const item = localStorage.getItem(`${CACHE_PREFIX}${key}`)
    if (!item) return null
    const { timestamp } = JSON.parse(item)
    return new Date(timestamp)
  } catch {
    return null
  }
}

/**
 * Limpia todo el cache del panel economico
 */
export const clearCache = () => {
  Object.keys(localStorage)
    .filter(key => key.startsWith(CACHE_PREFIX))
    .forEach(key => localStorage.removeItem(key))
}

/**
 * Guarda valor anterior para calcular variacion
 * @param {string} key - Tipo de cotizacion (blue, oficial, etc)
 * @param {number} valor - Valor actual
 */
export const guardarValorAnterior = (key, valor) => {
  try {
    const storageKey = `${CACHE_PREFIX}anterior_${key}`
    const actual = localStorage.getItem(storageKey)

    if (actual) {
      const { valor: valorGuardado, fecha } = JSON.parse(actual)
      const hoy = new Date().toDateString()

      // Solo actualizar si es un nuevo dia
      if (fecha !== hoy) {
        localStorage.setItem(storageKey, JSON.stringify({
          valor: valorGuardado, // El anterior pasa a ser el de ayer
          valorAnterior: valor,
          fecha: hoy
        }))
      }
    } else {
      localStorage.setItem(storageKey, JSON.stringify({
        valor,
        valorAnterior: null,
        fecha: new Date().toDateString()
      }))
    }
  } catch (error) {
    console.warn('Error guardando valor anterior:', error)
  }
}

/**
 * Obtiene el valor anterior para calcular variacion
 * @param {string} key - Tipo de cotizacion
 * @returns {number|null} Valor anterior
 */
export const getValorAnterior = (key) => {
  try {
    const storageKey = `${CACHE_PREFIX}anterior_${key}`
    const item = localStorage.getItem(storageKey)
    if (!item) return null

    const { valorAnterior } = JSON.parse(item)
    return valorAnterior
  } catch {
    return null
  }
}
