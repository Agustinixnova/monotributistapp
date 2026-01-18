/**
 * Funciones de formateo para Caja Diaria
 */

/**
 * Formatea número como moneda argentina
 * 1000 → $1.000
 * 1000000 → $1.000.000
 */
export const formatearMonto = (valor) => {
  if (valor === null || valor === undefined || valor === '') return ''

  const numero = typeof valor === 'string'
    ? parseFloat(valor.replace(/\./g, '').replace(',', '.'))
    : valor

  if (isNaN(numero)) return ''

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numero)
}

/**
 * Formatea input en tiempo real
 * 1000 → 1.000
 * Para usar en onChange de inputs
 */
export const formatearInputMonto = (valor) => {
  if (!valor) return ''

  // Remover todo excepto números
  const soloNumeros = valor.replace(/\D/g, '')
  if (!soloNumeros) return ''

  // Formatear con puntos de miles
  return new Intl.NumberFormat('es-AR').format(parseInt(soloNumeros))
}

/**
 * Parsear monto formateado a número
 * 1.000 → 1000
 */
export const parsearMonto = (valor) => {
  if (!valor) return 0
  const soloNumeros = valor.toString().replace(/\D/g, '')
  return parseInt(soloNumeros) || 0
}

/**
 * Formatear hora
 * 14:32:00 → 14:32
 */
export const formatearHora = (hora) => {
  if (!hora) return ''
  return hora.substring(0, 5)
}

/**
 * Formatear fecha corta
 * 2026-01-17 → 17/01
 */
export const formatearFechaCorta = (fecha) => {
  if (!fecha) return ''
  const date = new Date(fecha + 'T00:00:00')
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

/**
 * Formatear fecha larga
 * 2026-01-17 → Viernes 17 de Enero
 */
export const formatearFechaLarga = (fecha) => {
  if (!fecha) return ''
  const date = new Date(fecha + 'T00:00:00')
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
}

/**
 * Obtener fecha actual en formato YYYY-MM-DD
 */
export const getFechaHoy = () => {
  return new Date().toISOString().split('T')[0]
}

/**
 * Formatear fecha para input type="date"
 * Retorna YYYY-MM-DD
 */
export const formatearFechaInput = (fecha) => {
  if (!fecha) return getFechaHoy()
  return fecha
}
