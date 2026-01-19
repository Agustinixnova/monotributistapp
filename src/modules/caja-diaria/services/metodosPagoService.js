/**
 * Service para métodos de pago de caja diaria
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from './empleadosService'

/**
 * Obtener todos los métodos de pago (sistema + personalizados del dueño)
 */
export async function getMetodosPago() {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Obtener métodos del sistema (user_id IS NULL) y del dueño
    const { data, error } = await supabase
      .from('caja_metodos_pago')
      .select('*')
      .eq('activo', true)
      .or(`user_id.is.null,user_id.eq.${userId}`)
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
 * Requiere permiso agregar_metodos_pago si es empleado
 */
export async function createMetodoPago({ nombre, icono, es_efectivo }) {
  try {
    const { userId, esDuenio, permisos, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Verificar permiso si es empleado
    if (!esDuenio && !permisos?.agregar_metodos_pago) {
      throw new Error('No tienes permisos para agregar métodos de pago')
    }

    const { data, error } = await supabase
      .from('caja_metodos_pago')
      .insert({
        user_id: userId,
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
