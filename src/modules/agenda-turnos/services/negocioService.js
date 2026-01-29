/**
 * Servicio para gestionar datos del negocio
 */

import { supabase } from '../../../lib/supabase'

/**
 * Obtener datos del negocio del usuario actual
 */
export async function getNegocio() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('agenda_negocio')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error obteniendo negocio:', error)
    return { data: null, error }
  }
}

/**
 * Obtener datos del negocio por user_id (para página pública)
 */
export async function getNegocioByUserId(userId) {
  try {
    const { data, error } = await supabase
      .from('agenda_negocio')
      .select('nombre_negocio, telefono, whatsapp, direccion, localidad, provincia, instagram, tiktok, horario_atencion, logo_url')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error obteniendo negocio público:', error)
    return { data: null, error }
  }
}

/**
 * Crear o actualizar datos del negocio (upsert)
 */
export async function saveNegocio(negocioData) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const dataToSave = {
      ...negocioData,
      user_id: user.id
    }

    // Upsert: insertar o actualizar si ya existe
    const { data, error } = await supabase
      .from('agenda_negocio')
      .upsert(dataToSave, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error guardando negocio:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar campos específicos del negocio
 */
export async function updateNegocio(campos) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('agenda_negocio')
      .update(campos)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error actualizando negocio:', error)
    return { data: null, error }
  }
}
