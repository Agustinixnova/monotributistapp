/**
 * Funciones de formateo para Agenda & Turnos
 */

/**
 * Formatea número como moneda argentina
 * 1000 → $1.000
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
 * Formatea hora HH:MM:SS a HH:MM
 */
export const formatearHora = (hora) => {
  if (!hora) return ''
  return hora.substring(0, 5)
}

/**
 * Formatea teléfono/WhatsApp
 */
export const formatearTelefono = (telefono) => {
  if (!telefono) return ''
  // Remover todo excepto números
  const numeros = telefono.replace(/\D/g, '')
  if (numeros.length === 10) {
    return `${numeros.slice(0, 2)} ${numeros.slice(2, 6)}-${numeros.slice(6)}`
  }
  return telefono
}

/**
 * Obtener iniciales de un nombre
 * "Juan Pérez" → "JP"
 */
export const getIniciales = (nombre, apellido = '') => {
  const n = nombre?.charAt(0)?.toUpperCase() || ''
  const a = apellido?.charAt(0)?.toUpperCase() || ''
  return n + a || '?'
}

/**
 * Capitalizar primera letra
 */
export const capitalizar = (texto) => {
  if (!texto) return ''
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
}

/**
 * Truncar texto con ellipsis
 */
export const truncar = (texto, maxLength = 30) => {
  if (!texto) return ''
  if (texto.length <= maxLength) return texto
  return texto.slice(0, maxLength) + '...'
}

/**
 * Colores predefinidos para servicios
 */
export const COLORES_SERVICIOS = [
  { id: 'blue', nombre: 'Azul', valor: '#3B82F6', bg: 'bg-blue-500', text: 'text-blue-500', bgLight: 'bg-blue-100' },
  { id: 'green', nombre: 'Verde', valor: '#22C55E', bg: 'bg-green-500', text: 'text-green-500', bgLight: 'bg-green-100' },
  { id: 'purple', nombre: 'Violeta', valor: '#A855F7', bg: 'bg-purple-500', text: 'text-purple-500', bgLight: 'bg-purple-100' },
  { id: 'pink', nombre: 'Rosa', valor: '#EC4899', bg: 'bg-pink-500', text: 'text-pink-500', bgLight: 'bg-pink-100' },
  { id: 'orange', nombre: 'Naranja', valor: '#F97316', bg: 'bg-orange-500', text: 'text-orange-500', bgLight: 'bg-orange-100' },
  { id: 'teal', nombre: 'Turquesa', valor: '#14B8A6', bg: 'bg-teal-500', text: 'text-teal-500', bgLight: 'bg-teal-100' },
  { id: 'red', nombre: 'Rojo', valor: '#EF4444', bg: 'bg-red-500', text: 'text-red-500', bgLight: 'bg-red-100' },
  { id: 'yellow', nombre: 'Amarillo', valor: '#EAB308', bg: 'bg-yellow-500', text: 'text-yellow-500', bgLight: 'bg-yellow-100' },
  { id: 'indigo', nombre: 'Índigo', valor: '#6366F1', bg: 'bg-indigo-500', text: 'text-indigo-500', bgLight: 'bg-indigo-100' },
  { id: 'cyan', nombre: 'Cian', valor: '#06B6D4', bg: 'bg-cyan-500', text: 'text-cyan-500', bgLight: 'bg-cyan-100' },
]

/**
 * Obtener clases de color por valor hex
 */
export const getColorClasses = (colorHex) => {
  const color = COLORES_SERVICIOS.find(c => c.valor === colorHex)
  return color || COLORES_SERVICIOS[0]
}

/**
 * Estados de turno con sus configuraciones visuales
 */
export const ESTADOS_TURNO = {
  pendiente: {
    label: 'Pendiente',
    color: 'yellow',
    bgClass: 'bg-yellow-100',
    textClass: 'text-yellow-700',
    borderClass: 'border-yellow-300',
    icon: 'Clock'
  },
  confirmado: {
    label: 'Confirmado',
    color: 'green',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    borderClass: 'border-green-300',
    icon: 'CheckCircle'
  },
  en_curso: {
    label: 'En curso',
    color: 'blue',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-300',
    icon: 'Play'
  },
  completado: {
    label: 'Completado',
    color: 'gray',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-700',
    borderClass: 'border-gray-300',
    icon: 'CheckCircle2'
  },
  cancelado: {
    label: 'Cancelado',
    color: 'black',
    bgClass: 'bg-gray-800',
    textClass: 'text-white',
    borderClass: 'border-gray-800',
    icon: 'X'
  },
  no_asistio: {
    label: 'No asistió',
    color: 'red',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-300',
    icon: 'UserX'
  },
  pendiente_confirmacion: {
    label: 'Por confirmar',
    color: 'orange',
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-300',
    icon: 'Clock'
  }
}

/**
 * Obtener configuración de estado
 */
export const getEstadoConfig = (estado) => {
  return ESTADOS_TURNO[estado] || ESTADOS_TURNO.pendiente
}
