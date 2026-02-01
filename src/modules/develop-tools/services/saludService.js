/**
 * Servicios de verificación de salud del sistema
 */

// Usar supabaseRaw para evitar que errores de health checks se logueen
import { supabaseRaw as supabase } from '../../../lib/supabase'
import { UMBRALES, getEstado } from '../utils/umbrales'

/**
 * Verificar conexión a Supabase DB
 */
export async function checkSupabaseDB() {
  const inicio = performance.now()

  try {
    // Simple query para medir latencia
    const { error } = await supabase
      .from('roles')
      .select('id')
      .limit(1)

    const latencia = Math.round(performance.now() - inicio)

    if (error) {
      return {
        nombre: 'Supabase Database',
        estado: 'rojo',
        latencia: null,
        mensaje: error.message,
        detalles: { error: error.code }
      }
    }

    return {
      nombre: 'Supabase Database',
      estado: getEstado(latencia, UMBRALES.DB_LATENCY),
      latencia,
      mensaje: `Latencia: ${latencia}ms`,
      detalles: { latencia }
    }
  } catch (err) {
    return {
      nombre: 'Supabase Database',
      estado: 'rojo',
      latencia: null,
      mensaje: err.message || 'Error de conexión',
      detalles: { error: err.toString() }
    }
  }
}

/**
 * Verificar servicio de autenticación
 */
export async function checkSupabaseAuth() {
  const inicio = performance.now()

  try {
    const { data, error } = await supabase.auth.getSession()
    const latencia = Math.round(performance.now() - inicio)

    if (error) {
      return {
        nombre: 'Supabase Auth',
        estado: 'rojo',
        latencia,
        mensaje: error.message,
        detalles: { error }
      }
    }

    return {
      nombre: 'Supabase Auth',
      estado: getEstado(latencia, UMBRALES.DB_LATENCY),
      latencia,
      mensaje: data.session ? 'Sesión activa' : 'Sin sesión (OK)',
      detalles: {
        latencia,
        sesionActiva: !!data.session
      }
    }
  } catch (err) {
    return {
      nombre: 'Supabase Auth',
      estado: 'rojo',
      latencia: null,
      mensaje: err.message || 'Error de conexión',
      detalles: { error: err.toString() }
    }
  }
}

/**
 * Verificar API DolarApi.com
 */
export async function checkDolarApi() {
  const inicio = performance.now()

  try {
    const response = await fetch('https://dolarapi.com/v1/dolares/blue', {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5s timeout
    })

    const latencia = Math.round(performance.now() - inicio)

    if (!response.ok) {
      return {
        nombre: 'DolarApi.com',
        estado: 'rojo',
        latencia,
        mensaje: `HTTP ${response.status}`,
        detalles: { status: response.status }
      }
    }

    const data = await response.json()

    return {
      nombre: 'DolarApi.com',
      estado: getEstado(latencia, UMBRALES.API_LATENCY),
      latencia,
      mensaje: `Dólar Blue: $${data.venta}`,
      detalles: {
        latencia,
        compra: data.compra,
        venta: data.venta,
        fechaActualizacion: data.fechaActualizacion
      }
    }
  } catch (err) {
    return {
      nombre: 'DolarApi.com',
      estado: 'rojo',
      latencia: null,
      mensaje: err.name === 'TimeoutError' ? 'Timeout (>5s)' : err.message,
      detalles: { error: err.toString() }
    }
  }
}

/**
 * Verificar API ArgentinaDatos.com (feriados)
 */
export async function checkArgentinaDatosApi() {
  const inicio = performance.now()
  const year = new Date().getFullYear()

  try {
    const response = await fetch(`https://api.argentinadatos.com/v1/feriados/${year}`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    })

    const latencia = Math.round(performance.now() - inicio)

    if (!response.ok) {
      return {
        nombre: 'ArgentinaDatos.com',
        estado: 'rojo',
        latencia,
        mensaje: `HTTP ${response.status}`,
        detalles: { status: response.status }
      }
    }

    const data = await response.json()

    return {
      nombre: 'ArgentinaDatos.com',
      estado: getEstado(latencia, UMBRALES.API_LATENCY),
      latencia,
      mensaje: `${data.length} feriados cargados`,
      detalles: {
        latencia,
        cantidadFeriados: data.length
      }
    }
  } catch (err) {
    return {
      nombre: 'ArgentinaDatos.com',
      estado: 'rojo',
      latencia: null,
      mensaje: err.name === 'TimeoutError' ? 'Timeout (>5s)' : err.message,
      detalles: { error: err.toString() }
    }
  }
}

/**
 * Verificar Storage de Supabase
 * Usamos un bucket conocido para verificar que el servicio responde
 */
export async function checkSupabaseStorage() {
  const inicio = performance.now()

  try {
    // Intentar listar archivos de un bucket conocido (verificar que storage responde)
    // Buckets reales de la app
    const bucketsConocidos = [
      'educacion-impositiva',
      'buzon-adjuntos',
      'caja-qr',
      'logos-facturacion',
      'dev-archivos'
    ]
    let bucketActivo = null
    let archivosCount = 0

    for (const bucket of bucketsConocidos) {
      const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 })
      if (!error) {
        bucketActivo = bucket
        archivosCount = data?.length || 0
        break
      }
    }

    const latencia = Math.round(performance.now() - inicio)

    if (bucketActivo) {
      return {
        nombre: 'Supabase Storage',
        estado: getEstado(latencia, UMBRALES.DB_LATENCY),
        latencia,
        mensaje: `Operativo (bucket: ${bucketActivo})`,
        detalles: {
          latencia,
          bucketVerificado: bucketActivo
        }
      }
    }

    // Si ningún bucket conocido responde, intentar crear uno temporal
    return {
      nombre: 'Supabase Storage',
      estado: 'amarillo',
      latencia,
      mensaje: 'Sin buckets accesibles',
      detalles: {
        latencia,
        nota: 'No se pudo acceder a ningún bucket conocido'
      }
    }
  } catch (err) {
    return {
      nombre: 'Supabase Storage',
      estado: 'rojo',
      latencia: null,
      mensaje: err.message || 'Error de conexión',
      detalles: { error: err.toString() }
    }
  }
}

/**
 * Verificar Edge Functions
 * No hacemos fetch al endpoint base porque genera errores 404 en consola.
 * Solo reportamos si hay functions configuradas en el proyecto.
 */
export async function checkEdgeFunctions() {
  // No podemos verificar Edge Functions desde el browser sin invocarlas directamente
  // porque el endpoint base /functions/v1/ siempre devuelve 404 y genera ruido en consola.
  // Simplemente reportamos que el servicio está disponible si Supabase está configurado.

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const configurado = !!supabaseUrl

  return {
    nombre: 'Edge Functions',
    estado: configurado ? 'verde' : 'rojo',
    latencia: null,
    mensaje: configurado ? 'Supabase configurado' : 'URL no configurada',
    detalles: {
      nota: 'Las Edge Functions se verifican al invocarlas. No se puede hacer health check sin llamar a una función específica.',
      supabaseConfigurado: configurado
    }
  }
}

/**
 * Verificar Supabase Realtime
 */
export async function checkSupabaseRealtime() {
  const inicio = performance.now()

  try {
    // Crear un canal temporal para verificar conexión
    const channel = supabase.channel('health-check-' + Date.now())

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        channel.unsubscribe()
        resolve({
          nombre: 'Supabase Realtime',
          estado: 'rojo',
          latencia: null,
          mensaje: 'Timeout de conexión',
          detalles: { error: 'No se pudo conectar en 5s' }
        })
      }, 5000)

      channel
        .subscribe((status) => {
          clearTimeout(timeout)
          const latencia = Math.round(performance.now() - inicio)

          if (status === 'SUBSCRIBED') {
            channel.unsubscribe()
            resolve({
              nombre: 'Supabase Realtime',
              estado: 'verde',
              latencia,
              mensaje: 'Conexión establecida',
              detalles: { latencia, status }
            })
          } else if (status === 'CHANNEL_ERROR') {
            channel.unsubscribe()
            resolve({
              nombre: 'Supabase Realtime',
              estado: 'rojo',
              latencia,
              mensaje: 'Error de canal',
              detalles: { latencia, status }
            })
          }
        })
    })
  } catch (err) {
    return {
      nombre: 'Supabase Realtime',
      estado: 'rojo',
      latencia: null,
      mensaje: err.message || 'Error de conexión',
      detalles: { error: err.toString() }
    }
  }
}

/**
 * Verificar estado de Anthropic/Claude
 * Solo verifica que la API key esté configurada correctamente
 * (No podemos consultar el status page por CORS)
 */
export async function checkClaudeAPI() {
  // Verificar si hay una API key configurada
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  const keyConfigurada = apiKey && apiKey.startsWith('sk-ant-')

  // No intentamos fetch al status page porque tiene CORS bloqueado
  // y genera errores en la consola innecesariamente

  return {
    nombre: 'Claude API (Anthropic)',
    estado: keyConfigurada ? 'verde' : 'rojo',
    latencia: null,
    mensaje: keyConfigurada ? 'API Key configurada' : 'API Key no configurada',
    detalles: {
      keyConfigurada,
      keyPrefix: keyConfigurada ? apiKey.substring(0, 10) + '...' : null,
      statusPage: 'https://status.anthropic.com',
      nota: keyConfigurada
        ? 'Si Claude CLI tiene problemas, verificar el status page manualmente'
        : 'Agregar VITE_ANTHROPIC_API_KEY en .env'
    }
  }
}

/**
 * Verificar servicios de ARCA/AFIP para facturación electrónica
 * Verifica WSAA (autenticación) y WSFEv1 (facturación)
 */
export async function checkARCA() {
  const inicio = performance.now()

  // Endpoints de producción de ARCA/AFIP
  const endpoints = {
    wsaa: 'https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl',
    wsfe: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx?wsdl'
  }

  const resultados = {
    wsaa: { ok: false, latencia: null, error: null },
    wsfe: { ok: false, latencia: null, error: null }
  }

  try {
    // Verificar WSAA (Autenticación)
    const inicioWsaa = performance.now()
    try {
      const responseWsaa = await fetch(endpoints.wsaa, {
        method: 'GET',
        mode: 'no-cors', // AFIP no tiene CORS habilitado
        signal: AbortSignal.timeout(10000)
      })
      // Con no-cors no podemos leer el status, pero si no hay error, asumimos OK
      resultados.wsaa.ok = true
      resultados.wsaa.latencia = Math.round(performance.now() - inicioWsaa)
    } catch (err) {
      resultados.wsaa.error = err.message
      resultados.wsaa.latencia = Math.round(performance.now() - inicioWsaa)
    }

    // Verificar WSFE (Facturación)
    const inicioWsfe = performance.now()
    try {
      const responseWsfe = await fetch(endpoints.wsfe, {
        method: 'GET',
        mode: 'no-cors',
        signal: AbortSignal.timeout(10000)
      })
      resultados.wsfe.ok = true
      resultados.wsfe.latencia = Math.round(performance.now() - inicioWsfe)
    } catch (err) {
      resultados.wsfe.error = err.message
      resultados.wsfe.latencia = Math.round(performance.now() - inicioWsfe)
    }

    const latenciaTotal = Math.round(performance.now() - inicio)

    // Determinar estado general
    const ambosOk = resultados.wsaa.ok && resultados.wsfe.ok
    const algunoOk = resultados.wsaa.ok || resultados.wsfe.ok

    let estado = 'rojo'
    let mensaje = 'Servicios no disponibles'

    if (ambosOk) {
      estado = 'verde'
      mensaje = 'WSAA y WSFE operativos'
    } else if (algunoOk) {
      estado = 'amarillo'
      mensaje = resultados.wsaa.ok ? 'WSFE con problemas' : 'WSAA con problemas'
    }

    return {
      nombre: 'ARCA/AFIP (Facturación)',
      estado,
      latencia: latenciaTotal,
      mensaje,
      detalles: {
        wsaa: {
          nombre: 'WSAA (Autenticación)',
          estado: resultados.wsaa.ok ? 'OK' : 'ERROR',
          latencia: resultados.wsaa.latencia,
          error: resultados.wsaa.error
        },
        wsfe: {
          nombre: 'WSFE (Facturación)',
          estado: resultados.wsfe.ok ? 'OK' : 'ERROR',
          latencia: resultados.wsfe.latencia,
          error: resultados.wsfe.error
        },
        nota: 'Verificación básica de conectividad. Si hay problemas, revisar https://www.afip.gob.ar/ws/'
      }
    }
  } catch (err) {
    return {
      nombre: 'ARCA/AFIP (Facturación)',
      estado: 'rojo',
      latencia: null,
      mensaje: 'Error verificando servicios',
      detalles: {
        error: err.message,
        nota: 'Verificar manualmente en https://www.afip.gob.ar/ws/'
      }
    }
  }
}

/**
 * Ejecutar todos los health checks
 */
export async function checkAll() {
  const checks = await Promise.all([
    checkSupabaseDB(),
    checkSupabaseAuth(),
    checkSupabaseStorage(),
    checkSupabaseRealtime(),
    checkARCA(),
    checkDolarApi(),
    checkArgentinaDatosApi(),
    checkEdgeFunctions(),
    checkClaudeAPI()
  ])

  // Calcular estado general
  const estados = checks.map(c => c.estado)
  let estadoGeneral = 'verde'

  if (estados.includes('rojo')) {
    estadoGeneral = 'rojo'
  } else if (estados.includes('amarillo')) {
    estadoGeneral = 'amarillo'
  }

  return {
    timestamp: new Date().toISOString(),
    estadoGeneral,
    servicios: checks
  }
}
