/**
 * Servicio de Logging de APIs Externas
 * Captura requests/responses a ARCA, AFIP y otras APIs
 */

import { supabaseRaw as supabase } from '../../../lib/supabase'

/**
 * Registrar una llamada a API externa
 *
 * @param {Object} params
 * @param {string} params.api - Nombre de la API (arca, afip, whatsapp, etc.)
 * @param {string} params.endpoint - URL o nombre del endpoint
 * @param {string} params.metodo - HTTP method (GET, POST, etc.)
 * @param {Object} [params.requestHeaders] - Headers enviados
 * @param {Object} [params.requestBody] - Body enviado
 * @param {number} [params.statusCode] - Código de respuesta HTTP
 * @param {Object} [params.responseBody] - Body recibido
 * @param {Object} [params.responseHeaders] - Headers recibidos
 * @param {number} [params.duracionMs] - Tiempo de respuesta en ms
 * @param {boolean} [params.exitoso] - Si la llamada fue exitosa
 * @param {string} [params.errorMensaje] - Mensaje de error si falló
 * @param {string} [params.errorCodigo] - Código de error si falló
 * @param {string} [params.modulo] - Módulo desde donde se llamó
 * @param {string} [params.accion] - Acción que disparó la llamada
 * @param {Object} [params.contexto] - Contexto adicional
 */
export async function registrarApiLog({
  api,
  endpoint,
  metodo,
  requestHeaders = null,
  requestBody = null,
  statusCode = null,
  responseBody = null,
  responseHeaders = null,
  duracionMs = null,
  exitoso = true,
  errorMensaje = null,
  errorCodigo = null,
  modulo = null,
  accion = null,
  contexto = null
}) {
  try {
    // Sanitizar datos sensibles
    const sanitizedRequestBody = sanitizarDatos(requestBody)
    const sanitizedResponseBody = sanitizarDatos(responseBody)
    const sanitizedRequestHeaders = sanitizarHeaders(requestHeaders)

    const { error } = await supabase.rpc('registrar_api_log', {
      p_api: api,
      p_endpoint: endpoint,
      p_metodo: metodo,
      p_request_headers: sanitizedRequestHeaders,
      p_request_body: sanitizedRequestBody,
      p_status_code: statusCode,
      p_response_body: sanitizedResponseBody,
      p_response_headers: responseHeaders,
      p_duracion_ms: duracionMs,
      p_exitoso: exitoso,
      p_error_mensaje: errorMensaje,
      p_error_codigo: errorCodigo,
      p_modulo: modulo,
      p_accion: accion,
      p_contexto: contexto
    })

    if (error) {
      console.error('[ApiLog] Error registrando:', error)
    }
  } catch (err) {
    console.error('[ApiLog] Error:', err)
  }
}

/**
 * Wrapper para hacer llamadas a APIs externas con logging automático
 *
 * @example
 * const response = await apiCallWithLogging({
 *   api: 'arca',
 *   endpoint: '/fe/v1/comprobantes',
 *   metodo: 'POST',
 *   modulo: 'agenda-turnos',
 *   accion: 'emitir_factura',
 *   contexto: { turnoId: '123' },
 *   fetcher: async () => {
 *     return await fetch(url, { method: 'POST', body: JSON.stringify(data) })
 *   }
 * })
 */
export async function apiCallWithLogging({
  api,
  endpoint,
  metodo,
  requestHeaders = null,
  requestBody = null,
  modulo = null,
  accion = null,
  contexto = null,
  fetcher
}) {
  const startTime = Date.now()
  let response = null
  let responseBody = null
  let error = null

  try {
    response = await fetcher()

    // Intentar parsear el response body
    try {
      responseBody = await response.clone().json()
    } catch {
      try {
        responseBody = await response.clone().text()
      } catch {
        responseBody = null
      }
    }

    const duracionMs = Date.now() - startTime
    const exitoso = response.ok

    // Registrar el log
    await registrarApiLog({
      api,
      endpoint,
      metodo,
      requestHeaders,
      requestBody,
      statusCode: response.status,
      responseBody,
      duracionMs,
      exitoso,
      errorMensaje: !exitoso ? (responseBody?.error || responseBody?.message || `HTTP ${response.status}`) : null,
      errorCodigo: !exitoso ? (responseBody?.code || response.status.toString()) : null,
      modulo,
      accion,
      contexto
    })

    return { response, data: responseBody, ok: response.ok }
  } catch (err) {
    const duracionMs = Date.now() - startTime

    // Registrar el error
    await registrarApiLog({
      api,
      endpoint,
      metodo,
      requestHeaders,
      requestBody,
      statusCode: 0,
      responseBody: null,
      duracionMs,
      exitoso: false,
      errorMensaje: err.message,
      errorCodigo: err.code || 'NETWORK_ERROR',
      modulo,
      accion,
      contexto
    })

    throw err
  }
}

/**
 * Sanitizar datos para no guardar info sensible
 */
function sanitizarDatos(data) {
  if (!data) return null
  if (typeof data !== 'object') return data

  const sensitiveKeys = [
    'password', 'contraseña', 'clave', 'secret', 'token',
    'authorization', 'api_key', 'apikey', 'private_key',
    'clave_fiscal', 'certificado', 'cert', 'key'
  ]

  const sanitized = JSON.parse(JSON.stringify(data))

  function sanitizeRecursive(obj) {
    if (!obj || typeof obj !== 'object') return

    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase()
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        obj[key] = '[REDACTED]'
      } else if (typeof obj[key] === 'object') {
        sanitizeRecursive(obj[key])
      }
    }
  }

  sanitizeRecursive(sanitized)
  return sanitized
}

/**
 * Sanitizar headers para no guardar auth tokens
 */
function sanitizarHeaders(headers) {
  if (!headers) return null

  const sanitized = { ...headers }
  const sensitiveHeaders = ['authorization', 'x-api-key', 'api-key', 'token']

  for (const key of Object.keys(sanitized)) {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]'
    }
  }

  return sanitized
}

/**
 * APIs conocidas para el dropdown de filtros
 */
export const APIS_CONOCIDAS = {
  arca: { nombre: 'ARCA/AFIP', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  afip: { nombre: 'AFIP WS', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  whatsapp: { nombre: 'WhatsApp', color: 'text-green-400', bg: 'bg-green-500/20' },
  email: { nombre: 'Email', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  other: { nombre: 'Otro', color: 'text-gray-400', bg: 'bg-gray-500/20' }
}
