/**
 * Service para arqueos de caja
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from './empleadosService'
import { getFechaHoyArgentina, getHoraArgentina } from '../utils/dateUtils'

/**
 * Obtener efectivo esperado actual
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 */
export async function getEfectivoEsperado(fecha) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_efectivo_esperado_actual', {
        p_user_id: userId,
        p_fecha: fecha || getFechaHoyArgentina()
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
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_arqueos_del_dia', {
        p_user_id: userId,
        p_fecha: fecha || getFechaHoyArgentina()
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
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Obtener el ID del usuario autenticado (puede ser diferente de userId si es empleado)
    const { data: { user } } = await supabase.auth.getUser()
    const createdById = user?.id || userId

    const { data, error } = await supabase
      .from('caja_arqueos')
      .insert({
        user_id: userId,
        created_by_id: createdById,
        hora: getHoraArgentina(),
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
 * Requiere permiso eliminar_arqueos si es empleado
 * @param {string} id - ID del arqueo
 */
export async function deleteArqueo(id) {
  try {
    const { userId, esDuenio, permisos, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Verificar permiso si es empleado
    if (!esDuenio && !permisos?.eliminar_arqueos) {
      throw new Error('No tienes permisos para eliminar arqueos')
    }

    const { error } = await supabase
      .from('caja_arqueos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting arqueo:', error)
    return { success: false, error }
  }
}
