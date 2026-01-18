/**
 * Servicio para obtener cotizaciones de DolarApi.com
 * API gratuita sin necesidad de key
 */

const DOLAR_API_BASE = 'https://dolarapi.com'

/**
 * Endpoints de cotizaciones disponibles
 */
const ENDPOINTS = [
  { key: 'blue', url: '/v1/dolares/blue', moneda: 'USD' },
  { key: 'oficial', url: '/v1/dolares/oficial', moneda: 'USD' },
  { key: 'mayorista', url: '/v1/dolares/mayorista', moneda: 'USD' },
  { key: 'tarjeta', url: '/v1/dolares/tarjeta', moneda: 'USD' },
  { key: 'mep', url: '/v1/dolares/bolsa', moneda: 'USD' },
  { key: 'cripto', url: '/v1/dolares/cripto', moneda: 'USD' },
  { key: 'euro', url: '/v1/cotizaciones/eur', moneda: 'EUR' },
  { key: 'real', url: '/v1/cotizaciones/brl', moneda: 'BRL' },
]

/**
 * Obtiene una cotizacion individual
 * @param {string} url - URL del endpoint
 * @returns {Promise<Object>} Datos de cotizacion
 */
const fetchCotizacion = async (url) => {
  const response = await fetch(`${DOLAR_API_BASE}${url}`)
  if (!response.ok) {
    throw new Error(`Error ${response.status}`)
  }
  return response.json()
}

/**
 * Obtiene todas las cotizaciones disponibles
 * @returns {Promise<Object>} Objeto con todas las cotizaciones
 */
export const getCotizaciones = async () => {
  const results = await Promise.allSettled(
    ENDPOINTS.map(async ({ key, url, moneda }) => {
      const data = await fetchCotizacion(url)
      return { key, data: { ...data, monedaBase: moneda } }
    })
  )

  const cotizaciones = {}

  results.forEach((result, index) => {
    const endpoint = ENDPOINTS[index]
    if (result.status === 'fulfilled') {
      cotizaciones[result.value.key] = result.value.data
    } else {
      console.warn(`Error fetching ${endpoint.key}:`, result.reason)
      cotizaciones[endpoint.key] = null
    }
  })

  return cotizaciones
}

/**
 * Obtiene una cotizacion especifica
 * @param {string} tipo - Tipo de cotizacion (blue, oficial, etc)
 * @returns {Promise<Object>} Datos de cotizacion
 */
export const getCotizacion = async (tipo) => {
  const endpoint = ENDPOINTS.find(e => e.key === tipo)
  if (!endpoint) {
    throw new Error(`Tipo de cotizacion no valido: ${tipo}`)
  }

  return fetchCotizacion(endpoint.url)
}

/**
 * Obtiene los tipos de cotizacion disponibles
 * @returns {Array} Lista de tipos
 */
export const getTiposCotizacion = () => {
  return ENDPOINTS.map(e => ({
    key: e.key,
    moneda: e.moneda
  }))
}
