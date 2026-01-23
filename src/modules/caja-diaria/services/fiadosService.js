/**
 * Service para gestión de ventas en cuenta corriente
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from './empleadosService'
import { getFechaHoyArgentina, getHoraArgentina } from '../utils/dateUtils'

/**
 * Crear una nueva venta en cuenta corriente
 * @param {object} data - { cliente_id, monto, descripcion, fecha? }
 */
export async function createCuentaCorriente({ cliente_id, monto, descripcion, fecha }) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Obtener el ID del usuario autenticado (puede ser diferente de userId si es empleado)
    const { data: { user } } = await supabase.auth.getUser()
    const createdById = user?.id || userId

    const { data, error } = await supabase
      .from('caja_fiados')
      .insert({
        user_id: userId,
        cliente_id,
        fecha: fecha || getFechaHoyArgentina(),
        hora: getHoraArgentina(),
        monto: parseFloat(monto),
        descripcion: descripcion?.trim() || null,
        saldado: false,
        created_by_id: createdById
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating cuenta corriente:', error)
    return { data: null, error }
  }
}

// Alias para compatibilidad
export const createFiado = createCuentaCorriente

/**
 * Obtener cuentas corrientes pendientes de un cliente
 * @param {string} clienteId - ID del cliente
 */
export async function getCuentasCorrientesPendientes(clienteId) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_fiados')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('user_id', userId)
      .eq('saldado', false)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching cuentas corrientes pendientes:', error)
    return { data: null, error }
  }
}

// Alias para compatibilidad
export const getFiadosPendientes = getCuentasCorrientesPendientes

/**
 * Obtener todas las cuentas corrientes de una fecha
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 */
export async function getCuentasCorrientesByFecha(fecha) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_fiados')
      .select(`
        *,
        cliente:caja_clientes_fiado(id, nombre, apellido)
      `)
      .eq('user_id', userId)
      .eq('fecha', fecha)
      .order('hora', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching cuentas corrientes by fecha:', error)
    return { data: null, error }
  }
}

// Alias para compatibilidad
export const getFiadosByFecha = getCuentasCorrientesByFecha

/**
 * Editar monto de un fiado/deuda
 * @param {string} fiadoId - ID del fiado
 * @param {number} nuevoMonto - Nuevo monto
 * @param {string} descripcion - Descripción opcional
 */
export async function editarFiado(fiadoId, nuevoMonto, descripcion = null) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const updateData = { monto: parseFloat(nuevoMonto) }
    if (descripcion !== null) updateData.descripcion = descripcion

    const { data, error } = await supabase
      .from('caja_fiados')
      .update(updateData)
      .eq('id', fiadoId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error editando fiado:', error)
    return { data: null, error }
  }
}

/**
 * Anular/eliminar un fiado
 * @param {string} fiadoId - ID del fiado
 */
export async function anularFiado(fiadoId) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { error } = await supabase
      .from('caja_fiados')
      .delete()
      .eq('id', fiadoId)
      .eq('user_id', userId)

    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    console.error('Error anulando fiado:', error)
    return { success: false, error }
  }
}
