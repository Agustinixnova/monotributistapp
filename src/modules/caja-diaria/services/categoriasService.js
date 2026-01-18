/**
 * Service para categorías de caja diaria
 */

import { supabase } from '../../../lib/supabase'

/**
 * Obtener todas las categorías (sistema + personalizadas del usuario)
 * @param {string} tipo - 'entrada', 'salida', 'ambos' o null para todas
 */
export async function getCategorias(tipo = null) {
  try {
    let query = supabase
      .from('caja_categorias')
      .select('*')
      .eq('activo', true)

    if (tipo) {
      query = query.or(`tipo.eq.${tipo},tipo.eq.ambos`)
    }

    const { data, error } = await query.order('orden', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching categorías:', error)
    return { data: null, error }
  }
}

/**
 * Crear categoría personalizada
 */
export async function createCategoria({ nombre, icono, tipo }) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_categorias')
      .insert({
        user_id: user.id,
        nombre,
        icono,
        tipo,
        es_sistema: false,
        orden: 100, // Las personalizadas van al final
        activo: true
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating categoría:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar categoría personalizada
 */
export async function updateCategoria(id, { nombre, icono, tipo }) {
  try {
    const { data, error } = await supabase
      .from('caja_categorias')
      .update({ nombre, icono, tipo })
      .eq('id', id)
      .eq('es_sistema', false) // Solo se pueden editar las personalizadas
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating categoría:', error)
    return { data: null, error }
  }
}

/**
 * Desactivar categoría personalizada
 */
export async function deleteCategoria(id) {
  try {
    const { data, error } = await supabase
      .from('caja_categorias')
      .update({ activo: false })
      .eq('id', id)
      .eq('es_sistema', false)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error deleting categoría:', error)
    return { data: null, error }
  }
}
