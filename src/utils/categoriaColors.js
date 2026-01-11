/**
 * Colores para categorias del monotributo
 * Estos colores deben coincidir con los usados en Configuracion > Escalas Monotributo
 */

/**
 * Obtiene las clases de color para una categoria del monotributo
 * @param {string} categoria - Letra de la categoria (A-K)
 * @returns {string} Clases de Tailwind para el color
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
  return colores[categoria?.toUpperCase()] || 'bg-gray-100 text-gray-700'
}

/**
 * Obtiene las clases de color con borde para una categoria
 * @param {string} categoria - Letra de la categoria (A-K)
 * @returns {string} Clases de Tailwind para el color con borde
 */
export function getCategoriaColorWithBorder(categoria) {
  const colores = {
    A: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    B: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    C: 'bg-teal-100 text-teal-700 border-teal-200',
    D: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    E: 'bg-blue-100 text-blue-700 border-blue-200',
    F: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    G: 'bg-violet-100 text-violet-700 border-violet-200',
    H: 'bg-purple-100 text-purple-700 border-purple-200',
    I: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    J: 'bg-pink-100 text-pink-700 border-pink-200',
    K: 'bg-rose-100 text-rose-700 border-rose-200'
  }
  return colores[categoria?.toUpperCase()] || 'bg-gray-100 text-gray-700 border-gray-200'
}

export default getCategoriaColor
