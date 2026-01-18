/**
 * Funciones de formateo para el Panel Economico
 */

/**
 * Formatea un numero como moneda argentina
 * @param {number} valor - Valor a formatear
 * @param {number} decimales - Cantidad de decimales
 * @returns {string} Valor formateado (ej: "$1.234.567")
 */
export const formatearMoneda = (valor, decimales = 0) => {
  if (valor === null || valor === undefined || isNaN(valor)) return '-'

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor)
}

/**
 * Formatea un numero sin simbolo de moneda (para mostrar en cards)
 * @param {number} valor - Valor a formatear
 * @param {number} decimales - Cantidad de decimales
 * @returns {string} Valor formateado (ej: "1.234.567")
 */
export const formatearNumero = (valor, decimales = 0) => {
  if (valor === null || valor === undefined || isNaN(valor)) return '-'

  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor)
}

/**
 * Formatea un porcentaje con signo
 * @param {number} valor - Valor en porcentaje
 * @param {number} decimales - Cantidad de decimales
 * @param {boolean} conSigno - Mostrar + para valores positivos
 * @returns {string} Porcentaje formateado (ej: "+2.5%")
 */
export const formatearPorcentaje = (valor, decimales = 1, conSigno = true) => {
  if (valor === null || valor === undefined || isNaN(valor)) return '-'

  const signo = conSigno && valor > 0 ? '+' : ''
  return `${signo}${valor.toFixed(decimales)}%`
}

/**
 * Formatea una fecha segun el formato especificado
 * @param {string|Date} fecha - Fecha a formatear (YYYY-MM-DD o Date)
 * @param {string} formato - Tipo de formato
 * @returns {string} Fecha formateada
 */
export const formatearFecha = (fecha, formato = 'corto') => {
  if (!fecha) return '-'

  let date
  if (typeof fecha === 'string') {
    // Parsear fecha string de forma segura
    // Formato esperado: YYYY-MM-DD o YYYY-MM-DDTHH:MM:SS
    const fechaLimpia = fecha.substring(0, 10) // Tomar solo YYYY-MM-DD
    const [year, month, day] = fechaLimpia.split('-').map(Number)
    if (!year || !month || !day) return '-'
    date = new Date(year, month - 1, day)
  } else {
    date = fecha
  }

  if (isNaN(date.getTime())) return '-'

  const opciones = {
    corto: { day: '2-digit', month: '2-digit' },
    medio: { day: '2-digit', month: '2-digit', year: 'numeric' },
    largo: { day: 'numeric', month: 'long', year: 'numeric' },
    hora: { hour: '2-digit', minute: '2-digit' },
    completo: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' },
    mesAnio: { month: 'long', year: 'numeric' },
    diaMes: { day: 'numeric', month: 'short' },
  }

  const resultado = date.toLocaleDateString('es-AR', opciones[formato] || opciones.corto)

  // Capitalizar si es formato que incluye mes en texto
  if (['largo', 'mesAnio', 'diaMes'].includes(formato)) {
    return resultado.charAt(0).toUpperCase() + resultado.slice(1)
  }

  return resultado
}

/**
 * Formatea tiempo relativo (hace X minutos/horas)
 * @param {string|Date} fecha - Fecha a comparar
 * @returns {string} Tiempo relativo (ej: "Hace 5 min")
 */
export const formatearTiempoRelativo = (fecha) => {
  if (!fecha) return '-'

  const ahora = new Date()
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha
  const diffMs = ahora - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHoras = Math.floor(diffMins / 60)
  const diffDias = Math.floor(diffHoras / 24)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHoras < 24) return `Hace ${diffHoras}h`
  if (diffDias === 1) return 'Ayer'
  if (diffDias < 7) return `Hace ${diffDias} dias`

  return formatearFecha(fecha, 'corto')
}

/**
 * Formatea variacion con flecha y color
 * @param {number} actual - Valor actual
 * @param {number} anterior - Valor anterior
 * @returns {Object} { texto, direccion, porcentaje }
 */
export const formatearVariacion = (actual, anterior) => {
  if (!anterior || anterior === 0 || !actual) {
    return { texto: '-', direccion: 'igual', porcentaje: 0 }
  }

  const diferencia = actual - anterior
  const porcentaje = ((diferencia / anterior) * 100)

  if (Math.abs(porcentaje) < 0.01) {
    return { texto: '0%', direccion: 'igual', porcentaje: 0 }
  }

  const signo = porcentaje > 0 ? '+' : ''
  const texto = `${signo}${porcentaje.toFixed(1)}%`

  return {
    texto,
    direccion: porcentaje > 0 ? 'sube' : 'baja',
    porcentaje
  }
}

/**
 * Formatea riesgo pais
 * @param {number} valor - Valor del riesgo pais
 * @returns {string} Formateado (ej: "1.850 pts")
 */
export const formatearRiesgoPais = (valor) => {
  if (!valor) return '-'
  return `${formatearNumero(valor, 0)} pts`
}

/**
 * Parsea un string de moneda a numero
 * @param {string} valor - Valor con formato (ej: "$1.234")
 * @returns {number} Numero parseado
 */
export const parsearMoneda = (valor) => {
  if (!valor) return 0
  // Remover $, puntos de miles y reemplazar coma decimal por punto
  const limpio = valor.toString()
    .replace(/\$/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .trim()
  return parseFloat(limpio) || 0
}
