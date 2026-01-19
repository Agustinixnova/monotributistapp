/**
 * Service para configuración de caja diaria
 */

import { supabase } from '../../../lib/supabase'

/**
 * Obtener configuración del usuario
 */
export async function getConfiguracion() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_configuracion')
      .select('*')
      .eq('user_id', user.id)
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
 * @param {object} config - { nombre_negocio }
 */
export async function guardarConfiguracion(config) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    // Intentar actualizar primero
    const { data: existing } = await supabase
      .from('caja_configuracion')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    let data, error

    if (existing) {
      // Actualizar existente
      const result = await supabase
        .from('caja_configuracion')
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      data = result.data
      error = result.error
    } else {
      // Crear nuevo
      const result = await supabase
        .from('caja_configuracion')
        .insert({
          user_id: user.id,
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
