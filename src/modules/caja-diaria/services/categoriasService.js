/**
 * Service para categorías de caja diaria
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from './empleadosService'

/**
 * Obtener todas las categorías (sistema + personalizadas del usuario/dueño)
 * @param {string} tipo - 'entrada', 'salida', 'ambos' o null para todas
 */
export async function getCategorias(tipo = null) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Obtener categorías del sistema (user_id IS NULL) y del dueño
    let query = supabase
      .from('caja_categorias')
      .select('*')
      .eq('activo', true)
      .or(`user_id.is.null,user_id.eq.${userId}`)

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
 * Requiere permiso agregar_categorias si es empleado
 */
export async function createCategoria({ nombre, icono, tipo }) {
  try {
    const { userId, esDuenio, permisos, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Verificar permiso si es empleado
    if (!esDuenio && !permisos?.agregar_categorias) {
      throw new Error('No tienes permisos para agregar categorías')
    }

    const { data, error } = await supabase
      .from('caja_categorias')
      .insert({
        user_id: userId,
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
