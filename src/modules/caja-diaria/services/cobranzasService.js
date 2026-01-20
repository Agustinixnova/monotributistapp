/**
 * Service para gestión de cobranzas de cuenta corriente
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from './empleadosService'
import { getFechaHoyArgentina, getHoraArgentina } from '../utils/dateUtils'

/**
 * Registrar un pago de deuda
 * Esta función crea:
 * 1. Un movimiento de entrada en caja_movimientos
 * 2. Un registro en caja_pagos_fiado
 * 3. Actualiza cuentas corrientes como saldadas (FIFO)
 *
 * @param {object} pagoData - { cliente_id, monto, metodo_pago_id, nota?, fecha? }
 */
export async function registrarPago({ cliente_id, monto, metodo_pago_id, nota, fecha }) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Obtener el ID del usuario autenticado (puede ser diferente de userId si es empleado)
    const { data: { user } } = await supabase.auth.getUser()
    const createdById = user?.id || userId

    // Usar función RPC que hace todo en una transacción
    const { data, error } = await supabase
      .rpc('caja_registrar_pago_fiado', {
        p_user_id: userId,
        p_cliente_id: cliente_id,
        p_monto: parseFloat(monto),
        p_metodo_pago_id: metodo_pago_id,
        p_fecha: fecha || getFechaHoyArgentina(),
        p_hora: getHoraArgentina(),
        p_nota: nota?.trim() || null,
        p_created_by_id: createdById
      })

    if (error) throw error

    // La función RPC retorna el pago_id y movimiento_id
    return {
      data: data?.[0] || data,
      error: null
    }
  } catch (error) {
    console.error('Error registrando pago:', error)
    return { data: null, error }
  }
}

/**
 * Obtener pagos de un cliente
 * @param {string} clienteId - ID del cliente
 */
export async function getPagosCliente(clienteId) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_pagos_fiado')
      .select(`
        *,
        metodo_pago:caja_metodos_pago(id, nombre, icono)
      `)
      .eq('cliente_id', clienteId)
      .eq('user_id', userId)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching pagos cliente:', error)
    return { data: null, error }
  }
}

/**
 * Obtener todos los pagos de una fecha
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 */
export async function getPagosByFecha(fecha) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_pagos_fiado')
      .select(`
        *,
        cliente:caja_clientes_fiado(id, nombre, apellido),
        metodo_pago:caja_metodos_pago(id, nombre, icono)
      `)
      .eq('user_id', userId)
      .eq('fecha', fecha)
      .order('hora', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching pagos by fecha:', error)
    return { data: null, error }
  }
}
