/**
 * Service para arqueos de caja
 */

import { supabase } from '../../../lib/supabase'

/**
 * Obtener efectivo esperado actual
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 */
export async function getEfectivoEsperado(fecha) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_efectivo_esperado_actual', {
        p_user_id: user.id,
        p_fecha: fecha || new Date().toISOString().split('T')[0]
      })

    if (error) throw error
    return { data: data || 0, error: null }
  } catch (error) {
    console.error('Error fetching efectivo esperado:', error)
    return { data: 0, error }
  }
}

/**
 * Obtener arqueos del día
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 */
export async function getArqueosByFecha(fecha) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_arqueos_del_dia', {
        p_user_id: user.id,
        p_fecha: fecha || new Date().toISOString().split('T')[0]
      })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching arqueos:', error)
    return { data: [], error }
  }
}

/**
 * Crear un nuevo arqueo
 * @param {object} arqueo - { fecha, efectivo_esperado, efectivo_real, diferencia, motivo_diferencia, notas }
 */
export async function createArqueo(arqueo) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_arqueos')
      .insert({
        user_id: user.id,
        ...arqueo
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating arqueo:', error)
    return { data: null, error }
  }
}

/**
 * Eliminar un arqueo
 * @param {string} id - ID del arqueo
 */
export async function deleteArqueo(id) {
  try {
    const { error } = await supabase
      .from('caja_arqueos')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting arqueo:', error)
    return { success: false, error }
  }
}
