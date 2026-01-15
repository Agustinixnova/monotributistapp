/**
 * Constantes fiscales para Argentina
 * Centraliza todas las constantes relacionadas con regímenes fiscales,
 * categorías de monotributo, provincias, etc.
 */

// ============================================
// PROVINCIAS DE ARGENTINA
// ============================================
export const PROVINCIAS_ARGENTINA = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Cordoba',
  'Corrientes',
  'Entre Rios',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquen',
  'Rio Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucuman'
]

// ============================================
// CATEGORÍAS DE MONOTRIBUTO
// ============================================
export const CATEGORIAS_MONOTRIBUTO = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']

// ============================================
// REGÍMENES DE INGRESOS BRUTOS
// ============================================
export const REGIMENES_IIBB = [
  {
    value: 'simplificado',
    label: 'Simplificado',
    requiereJurisdicciones: false,
    descripcion: 'IIBB incluido en la cuota mensual del monotributo'
  },
  {
    value: 'local',
    label: 'Local (Provincial)',
    requiereJurisdicciones: true,
    descripcion: 'Opera en una sola provincia'
  },
  {
    value: 'convenio_multilateral',
    label: 'Convenio Multilateral',
    requiereJurisdicciones: true,
    descripcion: 'Opera en múltiples provincias'
  },
  {
    value: 'exento',
    label: 'Exento',
    requiereJurisdicciones: false,
    descripcion: 'Exento del pago de IIBB'
  },
  {
    value: 'no_inscripto',
    label: 'No inscripto',
    requiereJurisdicciones: false,
    descripcion: 'No está inscripto en IIBB (situación irregular)'
  }
]

// ============================================
// ESTADOS DE PAGO
// ============================================
export const ESTADOS_PAGO = [
  { value: 'al_dia', label: 'Al día', color: 'green' },
  { value: 'debe_1_cuota', label: 'Debe 1 cuota', color: 'yellow' },
  { value: 'debe_2_mas', label: 'Debe 2+ cuotas', color: 'red' },
  { value: 'desconocido', label: 'No se', color: 'gray' }
]

// ============================================
// MÉTODOS DE PAGO
// ============================================
export const METODOS_PAGO = [
  { value: 'debito_automatico', label: 'Débito automático' },
  { value: 'vep', label: 'VEP (Volante Electrónico de Pago)' },
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'efectivo', label: 'Efectivo / Rapipago / PagoFácil' },
  { value: 'otro', label: 'Otro' }
]

// ============================================
// TIPOS DE ACTIVIDAD
// ============================================
export const TIPOS_ACTIVIDAD = [
  { value: 'servicios', label: 'Servicios' },
  { value: 'productos', label: 'Productos (comercio)' },
  { value: 'ambos', label: 'Ambos (servicios + productos)' }
]

// ============================================
// PARENTESCOS (GRUPO FAMILIAR)
// ============================================
export const PARENTESCOS = [
  { value: 'conyuge', label: 'Cónyuge' },
  { value: 'concubino', label: 'Concubino/a' },
  { value: 'hijo', label: 'Hijo/a' },
  { value: 'otro', label: 'Otro' }
]

// ============================================
// FACTURADORES ELECTRÓNICOS
// ============================================
export const FACTURADORES_ELECTRONICOS = [
  { value: 'arca', label: 'ARCA (AFIP)' },
  { value: 'facturante', label: 'Software de facturación privado' },
  { value: 'otro', label: 'Otro' }
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtiene el label de un régimen IIBB
 */
export function getRegimenIibbLabel(value) {
  return REGIMENES_IIBB.find(r => r.value === value)?.label || value
}

/**
 * Verifica si un régimen requiere jurisdicciones
 */
export function regimenRequiereJurisdicciones(regimen) {
  return REGIMENES_IIBB.find(r => r.value === regimen)?.requiereJurisdicciones || false
}

/**
 * Obtiene el color de un estado de pago
 */
export function getEstadoPagoColor(estado) {
  return ESTADOS_PAGO.find(e => e.value === estado)?.color || 'gray'
}
