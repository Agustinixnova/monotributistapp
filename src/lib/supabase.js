import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cliente original de Supabase
const supabaseOriginal = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Función para registrar errores de Supabase automáticamente
 * Se importa lazy para evitar dependencias circulares
 */
let captureSupabaseErrorFn = null

async function logSupabaseError(error, context = {}) {
  try {
    // Importar lazy la primera vez
    if (!captureSupabaseErrorFn) {
      const module = await import('../modules/develop-tools/services/errorService')
      captureSupabaseErrorFn = module.captureSupabaseError
    }

    // Capturar el error
    await captureSupabaseErrorFn(error, context.operacion || 'Operación Supabase', context.datos)
  } catch (err) {
    // Si falla el logging, al menos mostrar en consola
    console.error('[Supabase Error Logger] Error al registrar:', err)
  }
}

/**
 * Crea un proxy recursivo que intercepta todos los métodos del query builder
 * y captura errores cuando se resuelve la promesa
 */
function createQueryProxy(queryBuilder, tableName) {
  if (!queryBuilder || typeof queryBuilder !== 'object') {
    return queryBuilder
  }

  return new Proxy(queryBuilder, {
    get(target, prop) {
      const value = target[prop]

      // Interceptar .then() para capturar errores
      if (prop === 'then') {
        return function (onFulfilled, onRejected) {
          return value.call(target,
            (result) => {
              // Si hay error en la respuesta, loguearlo
              if (result && result.error) {
                logSupabaseError(result.error, {
                  operacion: `Query: ${tableName}`,
                  datos: { tabla: tableName, code: result.error.code }
                })
              }
              return onFulfilled ? onFulfilled(result) : result
            },
            (error) => {
              // Error de red o similar
              logSupabaseError(error, {
                operacion: `Query: ${tableName}`,
                datos: { tabla: tableName }
              })
              return onRejected ? onRejected(error) : Promise.reject(error)
            }
          )
        }
      }

      // Si es una función (select, eq, insert, etc.), wrappear el resultado
      if (typeof value === 'function') {
        return function (...args) {
          const result = value.apply(target, args)
          // Si el resultado es un objeto (query builder), seguir wrapeando
          if (result && typeof result === 'object' && typeof result.then === 'function') {
            return createQueryProxy(result, tableName)
          }
          return result
        }
      }

      return value
    }
  })
}

/**
 * Proxy para interceptar llamadas a supabase.from() y supabase.rpc()
 * Mantiene todo lo demás intacto (auth, storage, etc.)
 */
const supabaseProxy = new Proxy(supabaseOriginal, {
  get(target, prop) {
    const value = target[prop]

    // Interceptar .from()
    if (prop === 'from') {
      return function (tableName) {
        const queryBuilder = target.from(tableName)
        return createQueryProxy(queryBuilder, tableName)
      }
    }

    // Interceptar .rpc()
    if (prop === 'rpc') {
      return function (fnName, params) {
        const queryBuilder = target.rpc(fnName, params)
        return createQueryProxy(queryBuilder, `rpc:${fnName}`)
      }
    }

    // Para todo lo demás (auth, storage, channel, etc.), devolver el original
    if (typeof value === 'function') {
      return value.bind(target)
    }

    return value
  }
})

// Exportar el proxy como el cliente principal
export const supabase = supabaseProxy

// También exportar el original por si se necesita sin logging
export const supabaseRaw = supabaseOriginal
