/**
 * Funciones de formateo para finanzas personales
 */

/**
 * Formatea un monto en pesos argentinos
 * @param {number} monto - Monto a formatear
 * @param {boolean} conSigno - Si incluir el signo $
 * @returns {string} Monto formateado
 */
export function formatearMonto(monto, conSigno = true) {
  if (monto === null || monto === undefined) return '-'

  const numero = Number(monto)
  if (isNaN(numero)) return '-'

  const formateado = Math.round(numero).toLocaleString('es-AR')
  return conSigno ? `$${formateado}` : formateado
}

/**
 * Formatea una fecha en formato corto
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada (ej: "15 ene")
 */
export function formatearFechaCorta(fecha) {
  if (!fecha) return '-'

  const date = new Date(fecha + 'T00:00:00')
  const dia = date.getDate()
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const mes = meses[date.getMonth()]

  return `${dia} ${mes}`
}

/**
 * Formatea una fecha completa
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada (ej: "15 de enero de 2026")
 */
export function formatearFechaCompleta(fecha) {
  if (!fecha) return '-'

  const date = new Date(fecha + 'T00:00:00')
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Obtiene el nombre del mes actual
 * @param {Date} fecha - Fecha (opcional, default: hoy)
 * @returns {string} Nombre del mes (ej: "Enero 2026")
 */
export function getNombreMes(fecha = new Date()) {
  return fecha.toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric'
  }).replace(/^\w/, c => c.toUpperCase())
}

/**
 * Obtiene el primer dia del mes
 * @param {Date} fecha - Fecha (opcional, default: hoy)
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function getPrimerDiaMes(fecha = new Date()) {
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

/**
 * Obtiene el ultimo dia del mes
 * @param {Date} fecha - Fecha (opcional, default: hoy)
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function getUltimoDiaMes(fecha = new Date()) {
  const year = fecha.getFullYear()
  const month = fecha.getMonth() + 1
  const ultimoDia = new Date(year, month, 0).getDate()
  return `${year}-${String(month).padStart(2, '0')}-${ultimoDia}`
}

/**
 * Obtiene la fecha de hace N meses
 * @param {number} meses - Cantidad de meses atras
 * @returns {Date} Fecha
 */
export function getFechaHaceMeses(meses) {
  const fecha = new Date()
  fecha.setMonth(fecha.getMonth() - meses)
  return fecha
}

/**
 * Formatea un porcentaje
 * @param {number} valor - Valor del porcentaje
 * @param {number} decimales - Cantidad de decimales
 * @returns {string} Porcentaje formateado
 */
export function formatearPorcentaje(valor, decimales = 0) {
  if (valor === null || valor === undefined) return '-'
  return `${Number(valor).toFixed(decimales)}%`
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD
 * @returns {string} Fecha de hoy
 */
export function getHoy() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Alias de getNombreMes para compatibilidad
 */
export const getNombreMesActual = getNombreMes

/**
 * Formatea un valor de input con separadores de miles
 * @param {string} valor - Valor del input
 * @returns {string} Valor formateado (ej: "1.234.567")
 */
export function formatearInputMonto(valor) {
  if (!valor) return ''
  // Remover todo excepto numeros
  const soloNumeros = valor.replace(/\D/g, '')
  if (!soloNumeros) return ''
  // Formatear con separadores de miles
  return Number(soloNumeros).toLocaleString('es-AR')
}

/**
 * Parsea un monto formateado a numero
 * @param {string} valor - Valor formateado (ej: "1.234.567")
 * @returns {number} Numero parseado
 */
export function parsearInputMonto(valor) {
  if (!valor) return 0
  // Remover puntos de miles
  const limpio = valor.toString().replace(/\./g, '')
  return parseFloat(limpio) || 0
}
