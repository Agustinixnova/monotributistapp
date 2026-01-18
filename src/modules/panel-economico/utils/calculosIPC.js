/**
 * Funciones de calculo de inflacion y ajuste por IPC
 * Feature clave para que los clientes calculen actualizacion de precios
 */

/**
 * Normaliza una fecha a formato YYYY-MM
 * @param {string} fecha - Fecha en formato YYYY-MM o YYYY-MM-DD
 * @returns {string} Fecha en formato YYYY-MM
 */
const normalizarFecha = (fecha) => {
  if (!fecha) return null
  // Tomar solo los primeros 7 caracteres (YYYY-MM)
  return fecha.substring(0, 7)
}

/**
 * Calcula la inflacion acumulada entre dos fechas
 * Usa la formula de interes compuesto: ((1+r1) * (1+r2) * ... * (1+rn)) - 1
 *
 * @param {Array} inflacionMensual - Array de { fecha, valor } con inflacion mensual
 * @param {string} fechaDesde - Fecha inicial (YYYY-MM-DD o YYYY-MM)
 * @param {string} fechaHasta - Fecha final (YYYY-MM-DD o YYYY-MM)
 * @returns {number} Inflacion acumulada en porcentaje
 *
 * @example
 * // Si cobraba $100.000 en enero 2025 y la inflacion acumulada es 118.2%
 * // Deberia cobrar: $100.000 * (1 + 1.182) = $218.200
 */
export const calcularInflacionAcumulada = (inflacionMensual, fechaDesde, fechaHasta) => {
  if (!inflacionMensual || inflacionMensual.length === 0) return 0
  if (!fechaDesde || !fechaHasta) return 0

  const desde = normalizarFecha(fechaDesde)
  const hasta = normalizarFecha(fechaHasta)

  if (!desde || !hasta) return 0

  // Filtrar meses en el rango (excluyendo mes inicial, incluyendo hasta mes final)
  // Esto es porque la inflacion de enero afecta a partir de febrero
  const mesesEnRango = inflacionMensual.filter(m => {
    const mesFecha = normalizarFecha(m.fecha)
    return mesFecha > desde && mesFecha <= hasta
  })

  if (mesesEnRango.length === 0) return 0

  // Calcular inflacion acumulada compuesta
  // Formula: ((1 + r1/100) * (1 + r2/100) * ... * (1 + rn/100)) - 1
  const acumulada = mesesEnRango.reduce((acc, mes) => {
    return acc * (1 + mes.valor / 100)
  }, 1) - 1

  return acumulada * 100
}

/**
 * Calcula el monto ajustado por inflacion
 * @param {number} montoOriginal - Monto a ajustar
 * @param {number} inflacionAcumulada - Inflacion acumulada en porcentaje
 * @returns {number} Monto ajustado
 */
export const calcularMontoAjustado = (montoOriginal, inflacionAcumulada) => {
  if (!montoOriginal || montoOriginal <= 0) return 0
  return montoOriginal * (1 + inflacionAcumulada / 100)
}

/**
 * Calcula la diferencia entre monto original y ajustado
 * @param {number} montoOriginal - Monto original
 * @param {number} montoAjustado - Monto ajustado
 * @returns {number} Diferencia (cuanto deberia aumentar)
 */
export const calcularDiferencia = (montoOriginal, montoAjustado) => {
  return montoAjustado - montoOriginal
}

/**
 * Obtiene la inflacion del ultimo mes disponible
 * @param {Array} inflacionMensual - Array de { fecha, valor }
 * @returns {Object|null} { fecha, valor } del ultimo mes
 */
export const getUltimaInflacion = (inflacionMensual) => {
  if (!inflacionMensual || inflacionMensual.length === 0) return null

  const ordenado = [...inflacionMensual].sort((a, b) =>
    new Date(b.fecha) - new Date(a.fecha)
  )

  return ordenado[0]
}

/**
 * Obtiene la inflacion del mes anterior al ultimo
 * @param {Array} inflacionMensual - Array de { fecha, valor }
 * @returns {Object|null} { fecha, valor } del mes anterior
 */
export const getInflacionMesAnterior = (inflacionMensual) => {
  if (!inflacionMensual || inflacionMensual.length < 2) return null

  const ordenado = [...inflacionMensual].sort((a, b) =>
    new Date(b.fecha) - new Date(a.fecha)
  )

  return ordenado[1]
}

/**
 * Obtiene la ultima inflacion interanual
 * @param {Array} inflacionInteranual - Array de { fecha, valor }
 * @returns {Object|null} { fecha, valor }
 */
export const getUltimaInflacionInteranual = (inflacionInteranual) => {
  if (!inflacionInteranual || inflacionInteranual.length === 0) return null

  const ordenado = [...inflacionInteranual].sort((a, b) =>
    new Date(b.fecha) - new Date(a.fecha)
  )

  return ordenado[0]
}

/**
 * Genera opciones de meses para selectores (ultimos N meses)
 * Empieza desde el mes ANTERIOR al actual porque la inflacion del mes actual
 * aun no esta disponible
 * @param {number} cantidadMeses - Cantidad de meses a generar
 * @returns {Array} [{ value: '2025-12', label: 'Diciembre 2025' }, ...]
 */
export const generarOpcionesMeses = (cantidadMeses = 36) => {
  const opciones = []
  const hoy = new Date()

  // Empezar desde el mes anterior (i=1) porque el mes actual no tiene datos aun
  for (let i = 1; i <= cantidadMeses; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const value = fecha.toISOString().substring(0, 7)
    const label = fecha.toLocaleDateString('es-AR', {
      month: 'long',
      year: 'numeric'
    })
    // Capitalizar primera letra
    const labelCapitalizado = label.charAt(0).toUpperCase() + label.slice(1)

    opciones.push({ value, label: labelCapitalizado })
  }

  return opciones
}

/**
 * Obtiene el nombre del mes en español
 * @param {string} fecha - Fecha YYYY-MM o YYYY-MM-DD
 * @returns {string} Nombre del mes (ej: "Enero 2026")
 */
export const getNombreMes = (fecha) => {
  if (!fecha) return ''

  try {
    // Extraer año y mes directamente del string para evitar problemas de timezone
    const [year, month] = fecha.split('-').map(Number)
    if (!year || !month || month < 1 || month > 12) return ''

    // Crear fecha usando UTC para consistencia
    const date = new Date(Date.UTC(year, month - 1, 1))

    if (isNaN(date.getTime())) return ''

    const label = date.toLocaleDateString('es-AR', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    })

    return label.charAt(0).toUpperCase() + label.slice(1)
  } catch {
    return ''
  }
}

/**
 * Verifica si hay datos de inflacion hasta una fecha dada
 * @param {Array} inflacionMensual - Array de datos
 * @param {string} fecha - Fecha a verificar YYYY-MM
 * @returns {boolean} true si hay datos hasta esa fecha
 */
export const hayDatosHasta = (inflacionMensual, fecha) => {
  if (!inflacionMensual || inflacionMensual.length === 0) return false

  const fechaNormalizada = normalizarFecha(fecha)
  return inflacionMensual.some(m => normalizarFecha(m.fecha) === fechaNormalizada)
}

/**
 * Obtiene la fecha mas reciente con datos de inflacion
 * @param {Array} inflacionMensual - Array de datos
 * @returns {string|null} Fecha YYYY-MM mas reciente
 */
export const getFechaMasReciente = (inflacionMensual) => {
  const ultima = getUltimaInflacion(inflacionMensual)
  return ultima ? normalizarFecha(ultima.fecha) : null
}
