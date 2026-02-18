/**
 * Service para gestión de proveedores
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from './empleadosService'

/**
 * Obtener todos los proveedores activos
 */
export async function getProveedores() {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_proveedores')
      .select('*')
      .eq('user_id', userId)
      .eq('activo', true)
      .order('razon_social', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching proveedores:', error)
    return { data: null, error }
  }
}

/**
 * Crear un nuevo proveedor
 * @param {object} data - { razon_social, cuit, telefono, email, direccion, comentario }
 */
export async function createProveedor({ razon_social, cuit, telefono, email, direccion, comentario }) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_proveedores')
      .insert({
        user_id: userId,
        razon_social: razon_social.trim(),
        cuit: cuit?.trim() || null,
        telefono: telefono?.trim() || null,
        email: email?.trim() || null,
        direccion: direccion?.trim() || null,
        comentario: comentario?.trim() || null,
        activo: true
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('Ya existe un proveedor con ese nombre')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error creating proveedor:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar un proveedor
 * @param {string} id - ID del proveedor
 * @param {object} data - { razon_social, cuit, telefono, email, direccion, comentario }
 */
export async function updateProveedor(id, { razon_social, cuit, telefono, email, direccion, comentario }) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_proveedores')
      .update({
        razon_social: razon_social.trim(),
        cuit: cuit?.trim() || null,
        telefono: telefono?.trim() || null,
        email: email?.trim() || null,
        direccion: direccion?.trim() || null,
        comentario: comentario?.trim() || null
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('Ya existe un proveedor con ese nombre')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error updating proveedor:', error)
    return { data: null, error }
  }
}

/**
 * Desactivar un proveedor (soft delete)
 * @param {string} id - ID del proveedor
 */
export async function deleteProveedor(id) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_proveedores')
      .update({ activo: false })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error deleting proveedor:', error)
    return { data: null, error }
  }
}
