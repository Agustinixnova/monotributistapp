/**
 * Colores de badges para roles del sistema
 */

/**
 * Mapa de colores por rol
 */
export const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  contadora_principal: 'bg-blue-100 text-blue-700 border-blue-200',
  contador_secundario: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  monotributista: 'bg-green-100 text-green-700 border-green-200',
  responsable_inscripto: 'bg-amber-100 text-amber-700 border-amber-200',
  operador_gastos: 'bg-gray-100 text-gray-700 border-gray-200',
  desarrollo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  comunicadora: 'bg-pink-100 text-pink-700 border-pink-200'
}

/**
 * Colores simplificados (sin border) para badges compactos
 */
export const ROLE_COLORS_SIMPLE = {
  admin: 'bg-purple-100 text-purple-700',
  contadora_principal: 'bg-blue-100 text-blue-700',
  contador_secundario: 'bg-cyan-100 text-cyan-700',
  monotributista: 'bg-green-100 text-green-700',
  responsable_inscripto: 'bg-amber-100 text-amber-700',
  operador_gastos: 'bg-gray-100 text-gray-700',
  desarrollo: 'bg-indigo-100 text-indigo-700',
  comunicadora: 'bg-pink-100 text-pink-700'
}

/**
 * Colores para iconos de rol (solo bg y text)
 */
export const ROLE_ICON_COLORS = {
  admin: 'bg-purple-100 text-purple-600',
  contadora_principal: 'bg-blue-100 text-blue-600',
  contador_secundario: 'bg-cyan-100 text-cyan-600',
  monotributista: 'bg-green-100 text-green-600',
  responsable_inscripto: 'bg-amber-100 text-amber-600',
  operador_gastos: 'bg-gray-100 text-gray-600',
  desarrollo: 'bg-indigo-100 text-indigo-600',
  comunicadora: 'bg-pink-100 text-pink-600'
}

/**
 * Obtiene las clases de color para un badge de rol
 * @param {string} roleName - Nombre del rol
 * @returns {string} Clases de Tailwind para el badge
 */
export function getRoleBadgeColor(roleName) {
  return ROLE_COLORS_SIMPLE[roleName] || 'bg-gray-100 text-gray-700'
}

/**
 * Obtiene las clases de color para un icono de rol
 * @param {string} roleName - Nombre del rol
 * @returns {string} Clases de Tailwind para el contenedor del icono
 */
export function getRoleIconColor(roleName) {
  return ROLE_ICON_COLORS[roleName] || 'bg-gray-100 text-gray-600'
}

/**
 * Obtiene las clases de color completas (con border) para un rol
 * @param {string} roleName - Nombre del rol
 * @returns {string} Clases de Tailwind con border incluido
 */
export function getRoleColor(roleName) {
  return ROLE_COLORS[roleName] || 'bg-gray-100 text-gray-700 border-gray-200'
}
