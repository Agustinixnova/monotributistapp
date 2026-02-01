/**
 * Servicio de captura y registro de errores
 * Para usar en toda la app
 */

// IMPORTANTE: Usar supabaseRaw para evitar loops infinitos
// (el cliente normal tiene wrapper que loguea errores)
import { supabaseRaw as supabase } from '../../../lib/supabase'

// Versión de la app (actualizar en cada release)
const APP_VERSION = '1.0.0'

// Variable para evitar loops infinitos de errores
let isCapturing = false

// Última acción del usuario (se actualiza desde afuera)
let ultimaAccion = null

/**
 * Genera un hash simple del error para agrupar errores iguales
 */
function generarHash(mensaje, stack) {
  const texto = `${mensaje || ''}|${(stack || '').slice(0, 500)}`
  let hash = 0
  for (let i = 0; i < texto.length; i++) {
    const char = texto.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convertir a 32bit integer
  }
  return Math.abs(hash).toString(16)
}

/**
 * Extrae el módulo de la URL actual
 */
function extraerModulo(url) {
  try {
    const path = new URL(url).pathname
    const partes = path.split('/').filter(Boolean)
    return partes[0] || 'home'
  } catch {
    return 'desconocido'
  }
}

/**
 * Obtiene información del navegador
 */
function getNavegadorInfo() {
  const ua = navigator.userAgent
  let navegador = 'Desconocido'

  if (ua.includes('Chrome')) navegador = 'Chrome'
  else if (ua.includes('Firefox')) navegador = 'Firefox'
  else if (ua.includes('Safari')) navegador = 'Safari'
  else if (ua.includes('Edge')) navegador = 'Edge'

  return `${navegador} - ${navigator.platform}`
}

/**
 * Obtiene el viewport actual
 */
function getViewport() {
  return `${window.innerWidth}x${window.innerHeight}`
}

/**
 * Función principal para capturar errores
 * Usar en cualquier parte de la app
 *
 * @param {Error|string} error - El error o mensaje
 * @param {Object} opciones - Opciones adicionales
 * @param {string} opciones.tipo - 'javascript' | 'react' | 'supabase' | 'network' | 'manual'
 * @param {string} opciones.severidad - 'warning' | 'error' | 'fatal'
 * @param {string} opciones.componentStack - Stack de componentes React
 * @param {string} opciones.accion - Qué estaba haciendo el usuario
 * @param {Object} opciones.contexto - Datos adicionales para debugging
 * @param {Object} opciones.requestData - Payload de la request si aplica
 * @param {string} opciones.supabaseCode - Código de error de Supabase
 */
export async function captureError(error, opciones = {}) {
  // Evitar loops infinitos
  if (isCapturing) return
  isCapturing = true

  try {
    const mensaje = error?.message || error?.toString() || 'Error desconocido'
    const stackTrace = error?.stack || null
    const componentStack = opciones.componentStack || null

    const errorData = {
      p_error_hash: generarHash(mensaje, stackTrace),
      p_mensaje: mensaje.slice(0, 1000), // Limitar longitud
      p_stack_trace: stackTrace?.slice(0, 5000),
      p_component_stack: componentStack?.slice(0, 2000),
      p_url: window.location.href,
      p_navegador: getNavegadorInfo(),
      p_viewport: getViewport(),
      p_modulo: extraerModulo(window.location.href),
      p_severidad: opciones.severidad || 'error',
      p_tipo: opciones.tipo || 'javascript',
      p_accion_previa: opciones.accion || ultimaAccion,
      p_contexto: opciones.contexto || {},
      p_request_data: opciones.requestData || null,
      p_supabase_code: opciones.supabaseCode || null,
      p_version_app: APP_VERSION
    }

    // Guardar en Supabase
    const { error: dbError } = await supabase.rpc('registrar_error', errorData)

    if (dbError) {
      // Si falla guardar en Supabase, al menos loguear en consola
      console.error('[ErrorService] No se pudo guardar el error:', dbError)
      console.error('[ErrorService] Error original:', errorData)
    }
  } catch (err) {
    // Fallback: solo consola
    console.error('[ErrorService] Error en captureError:', err)
  } finally {
    isCapturing = false
  }
}

/**
 * Registra la última acción del usuario
 * Llamar desde onClick, onSubmit, etc.
 *
 * @param {string} accion - Descripción de la acción ej: "Click: Guardar Cliente"
 */
export function registrarAccion(accion) {
  ultimaAccion = accion
}

/**
 * Captura específica para errores de Supabase
 */
export async function captureSupabaseError(error, operacion, datos = null) {
  await captureError(error, {
    tipo: 'supabase',
    severidad: 'error',
    accion: operacion,
    supabaseCode: error?.code || null,
    contexto: {
      operacion,
      hint: error?.hint,
      details: error?.details
    },
    requestData: datos
  })
}

/**
 * Inicializa los listeners globales de errores
 * Llamar una sola vez en el App.jsx o main.jsx
 */
export function initErrorCapture() {
  // Capturar errores de JavaScript no manejados
  window.onerror = function (mensaje, source, lineno, colno, error) {
    captureError(error || mensaje, {
      tipo: 'javascript',
      severidad: 'error',
      contexto: {
        source,
        lineno,
        colno
      }
    })
    // Retornar false para que también se muestre en consola
    return false
  }

  // Capturar promesas rechazadas no manejadas
  window.onunhandledrejection = function (event) {
    captureError(event.reason, {
      tipo: 'javascript',
      severidad: 'error',
      accion: 'Unhandled Promise Rejection'
    })
  }

  console.log('[ErrorService] Captura de errores inicializada')
}

/**
 * Wrapper para operaciones de Supabase que captura errores automáticamente
 *
 * Uso:
 * const { data, error } = await withErrorCapture(
 *   supabase.from('clientes').select('*'),
 *   'Cargar clientes'
 * )
 */
export async function withErrorCapture(supabaseQuery, operacion) {
  try {
    const result = await supabaseQuery

    if (result.error) {
      await captureSupabaseError(result.error, operacion)
    }

    return result
  } catch (err) {
    await captureError(err, {
      tipo: 'network',
      severidad: 'error',
      accion: operacion
    })
    return { data: null, error: err }
  }
}

// Exportar todo
export default {
  captureError,
  captureSupabaseError,
  registrarAccion,
  initErrorCapture,
  withErrorCapture
}
