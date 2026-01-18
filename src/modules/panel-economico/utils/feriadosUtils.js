/**
 * Utilidades para manejo de feriados y dias habiles
 */

/**
 * Tipos de feriados y su configuracion
 */
export const TIPOS_FERIADO = {
  inamovible: {
    label: 'Inamovible',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgLight: 'bg-red-50'
  },
  trasladable: {
    label: 'Trasladable',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    bgLight: 'bg-emerald-50'
  },
  puente: {
    label: 'Puente turistico',
    color: 'bg-amber-500',
    textColor: 'text-amber-600',
    bgLight: 'bg-amber-50'
  },
  'no laborable': {
    label: 'No laborable',
    color: 'bg-gray-500',
    textColor: 'text-gray-600',
    bgLight: 'bg-gray-50'
  }
}

/**
 * Obtiene la configuracion de un tipo de feriado
 * @param {string} tipo - Tipo de feriado
 * @returns {Object} Configuracion del tipo
 */
export const getConfigTipoFeriado = (tipo) => {
  return TIPOS_FERIADO[tipo?.toLowerCase()] || TIPOS_FERIADO.inamovible
}

/**
 * Verifica si una fecha es feriado
 * @param {Date|string} fecha - Fecha a verificar
 * @param {Array} feriados - Lista de feriados
 * @returns {Object|null} Feriado si coincide, null si no
 */
export const esFeriado = (fecha, feriados) => {
  if (!feriados || feriados.length === 0) return null

  const fechaStr = typeof fecha === 'string'
    ? fecha.substring(0, 10)
    : fecha.toISOString().substring(0, 10)

  return feriados.find(f => f.fecha === fechaStr) || null
}

/**
 * Verifica si una fecha es fin de semana
 * @param {Date} fecha - Fecha a verificar
 * @returns {boolean} true si es sabado o domingo
 */
export const esFinDeSemana = (fecha) => {
  const dia = fecha.getDay()
  return dia === 0 || dia === 6 // Domingo = 0, Sabado = 6
}

/**
 * Verifica si una fecha es dia habil (no feriado ni fin de semana)
 * @param {Date} fecha - Fecha a verificar
 * @param {Array} feriados - Lista de feriados
 * @returns {boolean} true si es dia habil
 */
export const esDiaHabil = (fecha, feriados) => {
  if (esFinDeSemana(fecha)) return false
  if (esFeriado(fecha, feriados)) return false
  return true
}

/**
 * Obtiene el proximo dia habil a partir de una fecha
 * @param {Date} fecha - Fecha inicial
 * @param {Array} feriados - Lista de feriados
 * @returns {Date} Proximo dia habil
 */
export const getProximoDiaHabil = (fecha, feriados) => {
  let diaActual = new Date(fecha)

  // Buscar hasta encontrar un dia habil (max 30 iteraciones por seguridad)
  for (let i = 0; i < 30; i++) {
    if (esDiaHabil(diaActual, feriados)) {
      return diaActual
    }
    diaActual.setDate(diaActual.getDate() + 1)
  }

  return fecha // Fallback
}

/**
 * Filtra los proximos feriados a partir de hoy
 * @param {Array} feriados - Lista de feriados del año
 * @param {number} cantidad - Cantidad de feriados a retornar
 * @returns {Array} Proximos feriados
 */
export const getProximosFeriados = (feriados, cantidad = 5) => {
  if (!feriados || feriados.length === 0) return []

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  return feriados
    .filter(f => new Date(f.fecha + 'T00:00:00') >= hoy)
    .slice(0, cantidad)
}

/**
 * Calcula informacion de vencimiento del monotributo (dia 20)
 * @param {Array} feriados - Lista de feriados
 * @param {number} mes - Mes (1-12), si no se especifica usa el actual
 * @param {number} anio - Año, si no se especifica usa el actual
 * @returns {Object} { fechaOriginal, fechaReal, esHabil, mensaje }
 */
export const calcularVencimientoMonotributo = (feriados, mes, anio) => {
  const hoy = new Date()
  const mesCalculo = mes || hoy.getMonth() + 1
  const anioCalculo = anio || hoy.getFullYear()

  // El vencimiento es el dia 20
  const fechaVencimiento = new Date(anioCalculo, mesCalculo - 1, 20)
  const esHabil = esDiaHabil(fechaVencimiento, feriados)

  let mensaje = ''
  let fechaReal = fechaVencimiento

  if (!esHabil) {
    fechaReal = getProximoDiaHabil(fechaVencimiento, feriados)

    const feriadoEncontrado = esFeriado(fechaVencimiento, feriados)
    if (feriadoEncontrado) {
      mensaje = `El 20 es ${feriadoEncontrado.nombre}. Vence el ${fechaReal.getDate()}.`
    } else if (esFinDeSemana(fechaVencimiento)) {
      const diaSemana = fechaVencimiento.getDay() === 0 ? 'domingo' : 'sabado'
      mensaje = `El 20 cae ${diaSemana}. Vence el ${fechaReal.getDate()}.`
    }
  } else {
    mensaje = 'El dia 20 es habil.'
  }

  return {
    fechaOriginal: fechaVencimiento,
    fechaReal,
    esHabil,
    mensaje
  }
}

/**
 * Obtiene los dias restantes hasta una fecha
 * @param {Date|string} fecha - Fecha objetivo
 * @returns {number} Dias restantes (negativo si ya paso)
 */
export const getDiasRestantes = (fecha) => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const objetivo = typeof fecha === 'string' ? new Date(fecha + 'T00:00:00') : new Date(fecha)
  objetivo.setHours(0, 0, 0, 0)

  const diffTime = objetivo - hoy
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
