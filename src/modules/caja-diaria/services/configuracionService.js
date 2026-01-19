/**
 * Service para configuración de caja diaria
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from './empleadosService'
import { getTimestampArgentina } from '../utils/dateUtils'

/**
 * Obtener configuración del usuario (o del dueño si es empleado)
 */
export async function getConfiguracion() {
  try {
    // Obtener el user_id efectivo (dueño o propio)
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_configuracion')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    // Si no existe configuración, devolver valores por defecto
    if (!data) {
      return {
        data: {
          nombre_negocio: 'Mi Negocio'
        },
        error: null
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching configuración:', error)
    return { data: { nombre_negocio: 'Mi Negocio' }, error }
  }
}

/**
 * Guardar configuración (crear o actualizar)
 * Solo el dueño puede guardar configuración
 * @param {object} config - { nombre_negocio }
 */
export async function guardarConfiguracion(config) {
  try {
    // Obtener el user_id efectivo y verificar permisos
    const { userId, esDuenio, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Solo el dueño puede modificar la configuración
    if (!esDuenio) {
      throw new Error('No tienes permisos para modificar la configuración')
    }

    // Intentar actualizar primero
    const { data: existing } = await supabase
      .from('caja_configuracion')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    let data, error

    if (existing) {
      // Actualizar existente
      const result = await supabase
        .from('caja_configuracion')
        .update({
          ...config,
          updated_at: getTimestampArgentina()
        })
        .eq('user_id', userId)
        .select()
        .single()

      data = result.data
      error = result.error
    } else {
      // Crear nuevo
      const result = await supabase
        .from('caja_configuracion')
        .insert({
          user_id: userId,
          ...config
        })
        .select()
        .single()

      data = result.data
      error = result.error
    }

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error guardando configuración:', error)
    return { data: null, error }
  }
}
