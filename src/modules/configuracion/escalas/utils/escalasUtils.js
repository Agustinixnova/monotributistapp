/**
 * Constantes y utilidades para el modulo de Escalas Monotributo
 * Basado en tabla oficial ARCA
 */

// Lista de categorias del monotributo argentino
export const CATEGORIAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']

// Categorias que son SOLO para productos (no servicios)
export const CATEGORIAS_SOLO_PRODUCTOS = ['I', 'J', 'K']

// Campos completos de una categoria segun ARCA
export const CAMPOS_CATEGORIA = {
  // Limites
  tope_facturacion_anual: {
    label: 'Ingresos Brutos Anuales',
    labelCorto: 'Tope Fact.',
    tipo: 'moneda',
    required: true,
    seccion: 'limites'
  },
  superficie_maxima: {
    label: 'Superficie Afectada',
    labelCorto: 'Sup.',
    tipo: 'superficie',
    unidad: 'm²',
    required: false,
    seccion: 'limites'
  },
  energia_maxima: {
    label: 'Energia Electrica Anual',
    labelCorto: 'Energia',
    tipo: 'energia',
    unidad: 'kW',
    required: false,
    seccion: 'limites'
  },
  alquiler_maximo: {
    label: 'Alquileres Devengados Anuales',
    labelCorto: 'Alquileres',
    tipo: 'moneda',
    required: false,
    seccion: 'limites'
  },
  precio_unitario_maximo: {
    label: 'Precio Unitario Maximo',
    labelCorto: 'Precio Unit.',
    tipo: 'moneda',
    required: false,
    seccion: 'limites'
  },
  // Impuesto integrado
  impuesto_integrado_servicios: {
    label: 'Impuesto Integrado Servicios',
    labelCorto: 'Imp. Serv.',
    tipo: 'moneda',
    required: true,
    seccion: 'impuesto'
  },
  impuesto_integrado_productos: {
    label: 'Impuesto Integrado Productos',
    labelCorto: 'Imp. Prod.',
    tipo: 'moneda',
    required: true,
    seccion: 'impuesto'
  },
  // Aportes
  aporte_sipa: {
    label: 'Aporte SIPA',
    labelCorto: 'SIPA',
    tipo: 'moneda',
    required: true,
    seccion: 'aportes'
  },
  aporte_obra_social: {
    label: 'Aporte Obra Social',
    labelCorto: 'Obra Social',
    tipo: 'moneda',
    required: true,
    seccion: 'aportes'
  },
  // Totales
  cuota_total_servicios: {
    label: 'Cuota Total Servicios',
    labelCorto: 'Total Serv.',
    tipo: 'moneda',
    required: false,
    seccion: 'totales',
    calculado: true
  },
  cuota_total_productos: {
    label: 'Cuota Total Productos',
    labelCorto: 'Total Prod.',
    tipo: 'moneda',
    required: false,
    seccion: 'totales',
    calculado: true
  }
}

// Columnas para tabla mobile (simplificada)
export const COLUMNAS_MOBILE = [
  { key: 'categoria', label: 'Cat.', width: 'w-14' },
  { key: 'tope_facturacion_anual', label: 'Tope Fact.', width: 'flex-1' },
  { key: 'cuota_total_servicios', label: 'Total Serv.', width: 'w-24' },
  { key: 'cuota_total_productos', label: 'Total Prod.', width: 'w-24' }
]

// Columnas para tabla desktop (completa)
export const COLUMNAS_DESKTOP = [
  { key: 'categoria', label: 'Cat.', width: 'w-14' },
  { key: 'tope_facturacion_anual', label: 'Ingresos Brutos', width: 'w-32' },
  { key: 'superficie_maxima', label: 'Sup.', width: 'w-16', sufijo: 'm²' },
  { key: 'energia_maxima', label: 'Energia', width: 'w-20', sufijo: 'kW' },
  { key: 'alquiler_maximo', label: 'Alquileres', width: 'w-28' },
  { key: 'precio_unitario_maximo', label: 'Precio Unit.', width: 'w-24' },
  { key: 'impuesto_integrado_servicios', label: 'Imp. Serv.', width: 'w-24', grupo: 'Impuesto Integrado' },
  { key: 'impuesto_integrado_productos', label: 'Imp. Prod.', width: 'w-24', grupo: 'Impuesto Integrado' },
  { key: 'aporte_sipa', label: 'SIPA', width: 'w-24' },
  { key: 'aporte_obra_social', label: 'O. Social', width: 'w-24' },
  { key: 'cuota_total_servicios', label: 'Total Serv.', width: 'w-28', grupo: 'Total', destacado: true },
  { key: 'cuota_total_productos', label: 'Total Prod.', width: 'w-28', grupo: 'Total', destacado: true }
]

/**
 * Formatea un valor como moneda argentina (punto miles, coma decimales)
 */
export function formatMoneda(valor, decimales = 2) {
  if (valor === null || valor === undefined) return '-'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(valor)
}

/**
 * Formatea moneda de forma compacta (sin decimales, para tablas)
 */
export function formatMonedaCompacta(valor) {
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
export function formatNumero(valor, decimales = 0) {
  if (valor === null || valor === undefined) return '-'
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(valor)
}

/**
 * Formatea superficie en m²
 */
export function formatSuperficie(valor) {
  if (valor === null || valor === undefined) return '-'
  return `${formatNumero(valor)} m²`
}

/**
 * Formatea energia en kW
 */
export function formatEnergia(valor) {
  if (valor === null || valor === undefined) return '-'
  return `${formatNumero(valor)} kW`
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

// Re-exportar getCategoriaColor desde la utilidad compartida
// para mantener compatibilidad con imports existentes
export { getCategoriaColor } from '../../../../utils/categoriaColors'

/**
 * Verifica si una categoria es solo para productos
 */
export function esSoloProductos(categoria) {
  return CATEGORIAS_SOLO_PRODUCTOS.includes(categoria)
}

/**
 * Calcula el total de servicios
 */
export function calcularTotalServicios(impuesto, sipa, obraSocial) {
  const imp = parseFloat(impuesto) || 0
  const s = parseFloat(sipa) || 0
  const os = parseFloat(obraSocial) || 0
  return imp + s + os
}

/**
 * Calcula el total de productos
 */
export function calcularTotalProductos(impuesto, sipa, obraSocial) {
  const imp = parseFloat(impuesto) || 0
  const s = parseFloat(sipa) || 0
  const os = parseFloat(obraSocial) || 0
  return imp + s + os
}

/**
 * Valida los datos de una categoria
 */
export function validarCategoria(data) {
  const errores = {}

  // Validar campos requeridos
  Object.entries(CAMPOS_CATEGORIA).forEach(([campo, config]) => {
    if (config.required && !config.calculado && (data[campo] === null || data[campo] === undefined || data[campo] === '')) {
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

// Referencias importantes ARCA
export const REFERENCIAS_ARCA = {
  noIngresanImpuestoIntegrado: [
    'Trabajadores independientes promovidos',
    'Asociados a cooperativas (hasta categoria A)',
    'Locadores de hasta 2 inmuebles',
    'Inscriptos en Registro Nacional de Efectores (hasta categoria A)',
    'Actividades primarias: tabaco, cana de azucar, yerba mate o te (hasta categoria D)'
  ],
  superficieAfectada: 'No aplica en ciudades de menos de 40.000 habitantes (excepto excepciones)',
  exceptuadosSIPAyObraSocial: [
    'Obligados por otros regimenes previsionales',
    'Menores de 18 anos',
    'Locacion de bienes muebles e inmuebles',
    'Sucesiones indivisas',
    'Jubilados por leyes anteriores a 07/1994'
  ],
  obraSocial: 'Afiliacion individual. Por cada adherente se debe ingresar el mismo importe adicional.'
}
