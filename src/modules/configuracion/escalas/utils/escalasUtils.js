/**
 * Constantes y utilidades para el modulo de Escalas Monotributo
 */

// Lista de categorias del monotributo argentino
export const CATEGORIAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']

// Campos de una categoria con sus labels
export const CAMPOS_CATEGORIA = {
  tope_facturacion_anual: {
    label: 'Tope Facturacion Anual',
    tipo: 'moneda',
    required: true
  },
  tope_facturacion_servicios: {
    label: 'Tope Facturacion Servicios',
    tipo: 'moneda',
    required: false
  },
  cuota_total_servicios: {
    label: 'Cuota Total Servicios',
    tipo: 'moneda',
    required: true
  },
  cuota_total_productos: {
    label: 'Cuota Total Productos',
    tipo: 'moneda',
    required: true
  },
  impuesto_integrado_servicios: {
    label: 'Impuesto Integrado Servicios',
    tipo: 'moneda',
    required: true
  },
  impuesto_integrado_productos: {
    label: 'Impuesto Integrado Productos',
    tipo: 'moneda',
    required: true
  },
  aporte_sipa: {
    label: 'Aporte SIPA',
    tipo: 'moneda',
    required: true
  },
  aporte_obra_social: {
    label: 'Aporte Obra Social',
    tipo: 'moneda',
    required: true
  },
  superficie_maxima: {
    label: 'Superficie Maxima (m2)',
    tipo: 'numero',
    required: false
  },
  energia_maxima: {
    label: 'Energia Maxima (kW)',
    tipo: 'numero',
    required: false
  },
  alquiler_maximo: {
    label: 'Alquiler Maximo Anual',
    tipo: 'moneda',
    required: false
  },
  precio_unitario_maximo: {
    label: 'Precio Unitario Maximo',
    tipo: 'moneda',
    required: false
  }
}

// Columnas principales para la tabla resumida
export const COLUMNAS_TABLA = [
  { key: 'categoria', label: 'Cat.', width: 'w-16' },
  { key: 'tope_facturacion_anual', label: 'Tope Facturacion', width: 'flex-1' },
  { key: 'cuota_total_servicios', label: 'Cuota Serv.', width: 'w-28' },
  { key: 'cuota_total_productos', label: 'Cuota Prod.', width: 'w-28' }
]

/**
 * Formatea un valor como moneda argentina
 */
export function formatMoneda(valor) {
  if (valor === null || valor === undefined) return '-'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor)
}

/**
 * Formatea un valor numerico con separador de miles
 */
export function formatNumero(valor) {
  if (valor === null || valor === undefined) return '-'
  return new Intl.NumberFormat('es-AR').format(valor)
}

/**
 * Formatea una fecha al formato argentino
 */
export function formatFecha(fecha) {
  if (!fecha) return '-'
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires'
  }).format(date)
}

/**
 * Obtiene el color de badge segun la categoria
 */
export function getCategoriaColor(categoria) {
  const colores = {
    A: 'bg-emerald-100 text-emerald-700',
    B: 'bg-emerald-100 text-emerald-700',
    C: 'bg-teal-100 text-teal-700',
    D: 'bg-cyan-100 text-cyan-700',
    E: 'bg-blue-100 text-blue-700',
    F: 'bg-indigo-100 text-indigo-700',
    G: 'bg-violet-100 text-violet-700',
    H: 'bg-purple-100 text-purple-700',
    I: 'bg-fuchsia-100 text-fuchsia-700',
    J: 'bg-pink-100 text-pink-700',
    K: 'bg-rose-100 text-rose-700'
  }
  return colores[categoria] || 'bg-gray-100 text-gray-700'
}

/**
 * Valida los datos de una categoria
 */
export function validarCategoria(data) {
  const errores = {}

  // Validar campos requeridos
  Object.entries(CAMPOS_CATEGORIA).forEach(([campo, config]) => {
    if (config.required && (data[campo] === null || data[campo] === undefined || data[campo] === '')) {
      errores[campo] = `${config.label} es requerido`
    }
  })

  // Validar valores positivos
  Object.entries(data).forEach(([campo, valor]) => {
    if (CAMPOS_CATEGORIA[campo] && valor !== null && valor !== undefined && valor !== '') {
      const num = parseFloat(valor)
      if (isNaN(num) || num < 0) {
        errores[campo] = 'Debe ser un numero positivo'
      }
    }
  })

  return {
    isValid: Object.keys(errores).length === 0,
    errores
  }
}

/**
 * Parsea un string a numero, limpiando formato de moneda
 */
export function parseMoneda(valor) {
  if (typeof valor === 'number') return valor
  if (!valor) return null
  // Remover $ y puntos de miles, reemplazar coma decimal por punto
  const limpio = valor.toString()
    .replace(/\$/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .trim()
  const num = parseFloat(limpio)
  return isNaN(num) ? null : num
}

// Fechas clave del monotributo
export const FECHAS_MONOTRIBUTO = {
  vencimientoCuota: 20, // Dia del mes
  mesesRecategorizacion: [1, 7], // Enero y Julio
  mesesActualizacionEscalas: [2, 8] // Febrero y Agosto
}

// Valores por defecto para alertas
export const ALERTAS_DEFAULTS = {
  alerta_recategorizacion_porcentaje: 80,
  alerta_exclusion_porcentaje: 90,
  dias_alerta_vencimiento_cuota: 5,
  dias_alerta_recategorizacion: 15
}
