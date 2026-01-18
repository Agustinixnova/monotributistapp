/**
 * Configuración de colores para caja diaria
 */

/**
 * Colores para tipos de movimiento
 */
export const COLORES_TIPO = {
  entrada: {
    bg: 'bg-emerald-500',
    bgLight: 'bg-emerald-50',
    bgHover: 'hover:bg-emerald-100',
    text: 'text-emerald-700',
    textDark: 'text-emerald-900',
    border: 'border-emerald-300',
    ring: 'ring-emerald-500',
  },
  salida: {
    bg: 'bg-red-500',
    bgLight: 'bg-red-50',
    bgHover: 'hover:bg-red-100',
    text: 'text-red-700',
    textDark: 'text-red-900',
    border: 'border-red-300',
    ring: 'ring-red-500',
  }
}

/**
 * Colores para estados de cierre
 */
export const COLORES_CIERRE = {
  sinDiferencia: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: 'text-emerald-600'
  },
  conDiferencia: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: 'text-amber-600'
  },
  diferenciaMayor: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: 'text-red-600'
  }
}

/**
 * Obtener color según tipo de movimiento
 */
export const getColorTipo = (tipo) => {
  return COLORES_TIPO[tipo] || COLORES_TIPO.entrada
}

/**
 * Obtener color según diferencia de cierre
 */
export const getColorDiferencia = (diferencia) => {
  const diff = Math.abs(parseFloat(diferencia || 0))
  if (diff === 0) return COLORES_CIERRE.sinDiferencia
  if (diff > 1000) return COLORES_CIERRE.diferenciaMayor
  return COLORES_CIERRE.conDiferencia
}

/**
 * Color principal de la app (violeta)
 */
export const COLOR_PRIMARY = {
  bg: 'bg-violet-600',
  bgHover: 'hover:bg-violet-700',
  bgLight: 'bg-violet-50',
  text: 'text-violet-600',
  textDark: 'text-violet-900',
  border: 'border-violet-300',
  ring: 'ring-violet-500',
}
