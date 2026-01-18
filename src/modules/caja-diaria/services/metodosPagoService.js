/**
 * Service para métodos de pago de caja diaria
 */

import { supabase } from '../../../lib/supabase'

/**
 * Obtener todos los métodos de pago (sistema + personalizados del usuario)
 */
export async function getMetodosPago() {
  try {
    const { data, error } = await supabase
      .from('caja_metodos_pago')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching métodos de pago:', error)
    return { data: null, error }
  }
}

/**
 * Crear método de pago personalizado
 */
export async function createMetodoPago({ nombre, icono, es_efectivo }) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_metodos_pago')
      .insert({
        user_id: user.id,
        nombre,
        icono,
        es_efectivo,
        es_sistema: false,
        orden: 100, // Los personalizados van al final
        activo: true
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating método de pago:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar método de pago personalizado
 */
export async function updateMetodoPago(id, { nombre, icono, es_efectivo }) {
  try {
    const { data, error } = await supabase
      .from('caja_metodos_pago')
      .update({ nombre, icono, es_efectivo })
      .eq('id', id)
      .eq('es_sistema', false) // Solo se pueden editar los personalizados
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating método de pago:', error)
    return { data: null, error }
  }
}

/**
 * Desactivar método de pago personalizado
 */
export async function deleteMetodoPago(id) {
  try {
    const { data, error } = await supabase
      .from('caja_metodos_pago')
      .update({ activo: false })
      .eq('id', id)
      .eq('es_sistema', false)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error deleting método de pago:', error)
    return { data: null, error }
  }
}
