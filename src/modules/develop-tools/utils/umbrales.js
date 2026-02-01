/**
 * Umbrales para determinar el estado de salud de cada servicio
 * 🟢 Verde = OK | 🟡 Amarillo = Warning | 🔴 Rojo = Error
 */

export const UMBRALES = {
  // Latencia de base de datos (ms)
  DB_LATENCY: {
    VERDE: 100,    // <= 100ms
    AMARILLO: 500, // <= 500ms
    // > 500ms = ROJO
  },

  // Latencia de APIs externas (ms)
  API_LATENCY: {
    VERDE: 1000,   // <= 1s
    AMARILLO: 3000, // <= 3s
    // > 3s = ROJO
  },

  // Uso de storage (porcentaje)
  STORAGE_USAGE: {
    VERDE: 70,     // <= 70%
    AMARILLO: 90,  // <= 90%
    // > 90% = ROJO
  },

  // Tiempo desde última invocación de Edge Function (horas)
  EDGE_FUNCTION_LAST_CALL: {
    VERDE: 24,     // <= 24 horas
    AMARILLO: 72,  // <= 72 horas (3 días)
    // > 72 horas = ROJO (posiblemente no se está usando)
  }
}

/**
 * Determina el estado según el valor y los umbrales
 * @param {number} valor - Valor a evaluar
 * @param {object} umbral - Objeto con VERDE y AMARILLO
 * @param {boolean} invertido - Si true, valores más bajos son peores (ej: uptime)
 * @returns {'verde' | 'amarillo' | 'rojo'}
 */
export function getEstado(valor, umbral, invertido = false) {
  if (valor === null || valor === undefined) return 'rojo'

  if (invertido) {
    if (valor >= umbral.VERDE) return 'verde'
    if (valor >= umbral.AMARILLO) return 'amarillo'
    return 'rojo'
  } else {
    if (valor <= umbral.VERDE) return 'verde'
    if (valor <= umbral.AMARILLO) return 'amarillo'
    return 'rojo'
  }
}

/**
 * Colores para cada estado
 */
export const COLORES = {
  verde: {
    bg: 'bg-green-500/20',
    border: 'border-green-500',
    text: 'text-green-400',
    icon: 'text-green-500',
    dot: 'bg-green-500'
  },
  amarillo: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500',
    text: 'text-yellow-400',
    icon: 'text-yellow-500',
    dot: 'bg-yellow-500'
  },
  rojo: {
    bg: 'bg-red-500/20',
    border: 'border-red-500',
    text: 'text-red-400',
    icon: 'text-red-500',
    dot: 'bg-red-500'
  }
}

/**
 * Textos para cada estado
 */
export const TEXTOS_ESTADO = {
  verde: 'Operativo',
  amarillo: 'Degradado',
  rojo: 'Error'
}
