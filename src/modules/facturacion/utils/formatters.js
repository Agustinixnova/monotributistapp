/**
 * Formatea número como moneda argentina
 */
export function formatearMoneda(numero) {
  if (numero === null || numero === undefined) return '-'

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numero)
}

/**
 * Formatea CUIT con guiones
 */
export function formatearCUIT(cuit) {
  if (!cuit) return '-'
  const clean = cuit.replace(/\D/g, '')
  if (clean.length !== 11) return cuit
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`
}

/**
 * Formatea fecha como DD/MM/YYYY
 */
export function formatearFecha(fecha) {
  if (!fecha) return '-'
  const d = new Date(fecha)
  return d.toLocaleDateString('es-AR')
}

/**
 * Formatea período como "Enero 2025"
 */
export function formatearPeriodo(anio, mes) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return `${meses[mes - 1]} ${anio}`
}

/**
 * Formatea tamaño de archivo
 */
export function formatearTamano(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
