/**
 * Service para alias de pago de caja diaria
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from './empleadosService'
import { getTimestampArgentina } from '../utils/dateUtils'

/**
 * Obtener todos los alias de pago del usuario/dueño
 */
export async function getAliasPago() {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_alias_pago')
      .select('*')
      .eq('user_id', userId)
      .eq('activo', true)
      .order('orden', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching alias de pago:', error)
    return { data: [], error }
  }
}

/**
 * Crear un nuevo alias de pago
 * Solo el dueño puede crear alias
 */
export async function createAliasPago({ nombre, alias, banco, cbu }) {
  try {
    const { userId, esDuenio, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    if (!esDuenio) {
      throw new Error('Solo el dueño puede agregar alias de pago')
    }

    const { data, error } = await supabase
      .from('caja_alias_pago')
      .insert({
        user_id: userId,
        nombre,
        alias,
        banco: banco || null,
        cbu: cbu || null,
        activo: true
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating alias de pago:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar un alias de pago
 */
export async function updateAliasPago(id, { nombre, alias, banco, cbu }) {
  try {
    const { esDuenio, error: userError } = await getEffectiveUserId()
    if (userError) throw userError

    if (!esDuenio) {
      throw new Error('Solo el dueño puede modificar alias de pago')
    }

    const { data, error } = await supabase
      .from('caja_alias_pago')
      .update({
        nombre,
        alias,
        banco: banco || null,
        cbu: cbu || null,
        updated_at: getTimestampArgentina()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating alias de pago:', error)
    return { data: null, error }
  }
}

/**
 * Eliminar (desactivar) un alias de pago
 */
export async function deleteAliasPago(id) {
  try {
    const { esDuenio, error: userError } = await getEffectiveUserId()
    if (userError) throw userError

    if (!esDuenio) {
      throw new Error('Solo el dueño puede eliminar alias de pago')
    }

    const { error } = await supabase
      .from('caja_alias_pago')
      .update({ activo: false })
      .eq('id', id)

    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting alias de pago:', error)
    return { success: false, error }
  }
}

/**
 * Subir imagen de QR a Storage
 * @param {File} file - Archivo de imagen
 */
export async function uploadQRImage(file) {
  try {
    const { userId, esDuenio, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    if (!esDuenio) {
      throw new Error('Solo el dueño puede subir imagen de QR')
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/qr-${Date.now()}.${fileExt}`

    // Subir a storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('caja-qr')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) throw uploadError

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('caja-qr')
      .getPublicUrl(fileName)

    // Verificar si existe configuración
    const { data: existingConfig } = await supabase
      .from('caja_configuracion')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    let updateResult
    if (existingConfig) {
      // Actualizar configuración existente
      updateResult = await supabase
        .from('caja_configuracion')
        .update({ qr_url: publicUrl })
        .eq('user_id', userId)
        .select()
    } else {
      // Crear nueva configuración
      updateResult = await supabase
        .from('caja_configuracion')
        .insert({
          user_id: userId,
          qr_url: publicUrl,
          nombre_negocio: 'Mi Negocio'
        })
        .select()
    }

    if (updateResult.error) throw updateResult.error

    return { data: { url: publicUrl }, error: null }
  } catch (error) {
    console.error('Error uploading QR image:', error)
    return { data: null, error }
  }
}

/**
 * Eliminar imagen de QR
 */
export async function deleteQRImage() {
  try {
    const { userId, esDuenio, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    if (!esDuenio) {
      throw new Error('Solo el dueño puede eliminar imagen de QR')
    }

    // Quitar URL de configuración
    const { error } = await supabase
      .from('caja_configuracion')
      .update({ qr_url: null })
      .eq('user_id', userId)

    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting QR image:', error)
    return { success: false, error }
  }
}
