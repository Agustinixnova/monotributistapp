/**
 * Servicio para obtener datos de ArgentinaDatos.com
 * API gratuita con indicadores economicos de Argentina
 */

const ARGENTINA_DATOS_BASE = 'https://api.argentinadatos.com'

/**
 * Obtiene la inflacion mensual historica
 * @returns {Promise<Array>} Array de { fecha, valor }
 */
export const getInflacionMensual = async () => {
  const response = await fetch(`${ARGENTINA_DATOS_BASE}/v1/finanzas/indices/inflacion`)
  if (!response.ok) throw new Error('Error fetching inflacion mensual')
  return response.json()
}

/**
 * Obtiene la inflacion interanual historica
 * @returns {Promise<Array>} Array de { fecha, valor }
 */
export const getInflacionInteranual = async () => {
  const response = await fetch(`${ARGENTINA_DATOS_BASE}/v1/finanzas/indices/inflacionInteranual`)
  if (!response.ok) throw new Error('Error fetching inflacion interanual')
  return response.json()
}

/**
 * Obtiene el indice UVA actual e historico
 * @returns {Promise<Array>} Array de { fecha, valor }
 */
export const getUVA = async () => {
  const response = await fetch(`${ARGENTINA_DATOS_BASE}/v1/finanzas/indices/uva`)
  if (!response.ok) throw new Error('Error fetching UVA')
  return response.json()
}

/**
 * Obtiene el riesgo pais actual
 * @returns {Promise<Object>} { fecha, valor }
 */
export const getRiesgoPais = async () => {
  const response = await fetch(`${ARGENTINA_DATOS_BASE}/v1/finanzas/indices/riesgo-pais/ultimo`)
  if (!response.ok) throw new Error('Error fetching riesgo pais')
  return response.json()
}

/**
 * Obtiene tasas de plazo fijo por entidad bancaria
 * @returns {Promise<Array>} Array de tasas por entidad { entidad, logo, tnaClientes, tnaNoClientes }
 */
export const getTasasPlazoFijo = async () => {
  const response = await fetch(`${ARGENTINA_DATOS_BASE}/v1/finanzas/tasas/plazoFijo`)
  if (!response.ok) throw new Error('Error fetching tasas')
  return response.json()
}

/**
 * Obtiene los feriados de un año
 * @param {number} año - Año a consultar
 * @returns {Promise<Array>} Array de feriados
 */
export const getFeriados = async (año = new Date().getFullYear()) => {
  const response = await fetch(`${ARGENTINA_DATOS_BASE}/v1/feriados/${año}`)
  if (!response.ok) throw new Error('Error fetching feriados')
  return response.json()
}

/**
 * Obtiene el historico de cotizaciones del dolar
 * @param {string} casa - Tipo de dolar (blue, oficial, etc)
 * @returns {Promise<Array>} Array de { fecha, compra, venta }
 */
export const getHistoricoDolar = async (casa = 'blue') => {
  const response = await fetch(`${ARGENTINA_DATOS_BASE}/v1/cotizaciones/dolares/${casa}`)
  if (!response.ok) throw new Error('Error fetching historico dolar')
  return response.json()
}

/**
 * Obtiene los ultimos N dias del historico
 * @param {string} casa - Tipo de dolar
 * @param {number} dias - Cantidad de dias
 * @returns {Promise<Array>} Ultimos N registros
 */
export const getHistoricoDolarUltimosDias = async (casa = 'blue', dias = 30) => {
  const data = await getHistoricoDolar(casa)
  // La API devuelve ordenado por fecha asc, tomamos los ultimos N
  return data.slice(-dias)
}
