/**
 * Service para gestión de clientes con cuenta corriente
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from './empleadosService'

/**
 * Obtener todos los clientes activos
 */
export async function getClientes() {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_clientes_fiado')
      .select('*')
      .eq('user_id', userId)
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching clientes cuenta corriente:', error)
    return { data: null, error }
  }
}

/**
 * Obtener clientes con deuda usando función RPC
 */
export async function getClientesConDeuda() {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_clientes_con_deuda', { p_user_id: userId })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching clientes con deuda:', error)
    return { data: null, error }
  }
}

/**
 * Obtener TODOS los clientes activos con su saldo (para modal de cobranzas)
 */
export async function getTodosClientesConSaldo() {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_todos_clientes_con_saldo', { p_user_id: userId })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching todos clientes con saldo:', error)
    return { data: null, error }
  }
}

/**
 * Crear un nuevo cliente (opcionalmente con saldo inicial)
 * @param {object} clienteData - { nombre, apellido, telefono, limite_credito, comentario, saldo_inicial, tipo_saldo }
 */
export async function createCliente({ nombre, apellido, telefono, limite_credito, comentario, saldo_inicial, tipo_saldo }) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Obtener el ID del usuario actual (para created_by_id en caso de empleados)
    const { data: { user } } = await supabase.auth.getUser()
    const currentUserId = user?.id

    // Si hay saldo inicial, usar la función RPC
    if (saldo_inicial && saldo_inicial > 0 && tipo_saldo) {
      const { data: clienteId, error } = await supabase
        .rpc('caja_crear_cliente_con_saldo', {
          p_user_id: userId,
          p_nombre: nombre.trim(),
          p_apellido: apellido?.trim() || null,
          p_telefono: telefono?.trim() || null,
          p_limite_credito: limite_credito || null,
          p_comentario: comentario?.trim() || null,
          p_saldo_inicial: saldo_inicial,
          p_tipo_saldo: tipo_saldo,
          p_created_by_id: currentUserId
        })

      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          throw new Error('Ya existe un cliente con ese nombre')
        }
        throw error
      }

      // Obtener el cliente creado
      const { data: cliente, error: fetchError } = await supabase
        .from('caja_clientes_fiado')
        .select('*')
        .eq('id', clienteId)
        .single()

      if (fetchError) throw fetchError
      return { data: cliente, error: null }
    }

    // Sin saldo inicial, insertar directamente
    const { data, error } = await supabase
      .from('caja_clientes_fiado')
      .insert({
        user_id: userId,
        nombre: nombre.trim(),
        apellido: apellido?.trim() || null,
        telefono: telefono?.trim() || null,
        limite_credito: limite_credito || null,
        comentario: comentario?.trim() || null,
        activo: true
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('Ya existe un cliente con ese nombre')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error creating cliente cuenta corriente:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar un cliente
 * @param {string} id - ID del cliente
 * @param {object} clienteData - { nombre, apellido, telefono, limite_credito, comentario }
 */
export async function updateCliente(id, { nombre, apellido, telefono, limite_credito, comentario }) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_clientes_fiado')
      .update({
        nombre: nombre.trim(),
        apellido: apellido?.trim() || null,
        telefono: telefono?.trim() || null,
        limite_credito: limite_credito || null,
        comentario: comentario?.trim() || null
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('Ya existe un cliente con ese nombre')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error updating cliente cuenta corriente:', error)
    return { data: null, error }
  }
}

/**
 * Desactivar un cliente (soft delete)
 * @param {string} id - ID del cliente
 */
export async function deleteCliente(id) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_clientes_fiado')
      .update({ activo: false })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error deleting cliente cuenta corriente:', error)
    return { data: null, error }
  }
}

/**
 * Obtener deuda total de un cliente
 * @param {string} clienteId - ID del cliente
 */
export async function getDeudaCliente(clienteId) {
  try {
    const { data, error } = await supabase
      .rpc('caja_cliente_deuda', { p_cliente_id: clienteId })

    if (error) throw error
    return { data: data || 0, error: null }
  } catch (error) {
    console.error('Error fetching deuda cliente:', error)
    return { data: 0, error }
  }
}

/**
 * Obtener historial de un cliente (cuenta corriente + pagos)
 * @param {string} clienteId - ID del cliente
 */
export async function getHistorialCliente(clienteId) {
  try {
    const { data, error } = await supabase
      .rpc('caja_cliente_historial', { p_cliente_id: clienteId })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching historial cliente:', error)
    return { data: null, error }
  }
}

/**
 * Obtener un cliente por ID con su deuda actual
 * @param {string} clienteId - ID del cliente
 */
export async function getClienteById(clienteId) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data: cliente, error } = await supabase
      .from('caja_clientes_fiado')
      .select('*')
      .eq('id', clienteId)
      .eq('user_id', userId)
      .single()

    if (error) throw error

    // Obtener deuda
    const { data: deuda } = await getDeudaCliente(clienteId)

    return {
      data: { ...cliente, deuda_total: deuda || 0 },
      error: null
    }
  } catch (error) {
    console.error('Error fetching cliente by id:', error)
    return { data: null, error }
  }
}
