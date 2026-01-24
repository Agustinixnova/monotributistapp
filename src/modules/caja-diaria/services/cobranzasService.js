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

/**
 * Editar monto de un pago
 * @param {string} pagoId - ID del pago
 * @param {number} nuevoMonto - Nuevo monto
 * @param {string} nota - Nota opcional
 */
export async function editarPago(pagoId, nuevoMonto, nota = null) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Obtener el pago actual para ver si tiene movimiento asociado y su fecha
    const { data: pagoActual, error: fetchError } = await supabase
      .from('caja_pagos_fiado')
      .select('*, movimiento_id, fecha')
      .eq('id', pagoId)
      .eq('user_id', userId)
      .single()

    if (fetchError) throw fetchError

    // Actualizar el pago
    const updateData = { monto: parseFloat(nuevoMonto) }
    if (nota !== null) updateData.nota = nota

    const { data, error } = await supabase
      .from('caja_pagos_fiado')
      .update(updateData)
      .eq('id', pagoId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    // Solo actualizar caja_movimientos si el pago es de HOY
    // Para no alterar cajas de días anteriores ya cerrados
    const fechaHoy = getFechaHoyArgentina()
    const esDeHoy = pagoActual.fecha === fechaHoy

    if (pagoActual.movimiento_id && esDeHoy) {
      await supabase
        .from('caja_movimientos')
        .update({ monto: parseFloat(nuevoMonto) })
        .eq('id', pagoActual.movimiento_id)
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error editando pago:', error)
    return { data: null, error }
  }
}

/**
 * Anular/eliminar un pago
 * @param {string} pagoId - ID del pago
 */
export async function anularPago(pagoId) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Obtener el pago para ver si tiene movimiento asociado y su fecha
    const { data: pago, error: fetchError } = await supabase
      .from('caja_pagos_fiado')
      .select('movimiento_id, fecha')
      .eq('id', pagoId)
      .eq('user_id', userId)
      .single()

    if (fetchError) throw fetchError

    // Eliminar el pago
    const { error } = await supabase
      .from('caja_pagos_fiado')
      .delete()
      .eq('id', pagoId)
      .eq('user_id', userId)

    if (error) throw error

    // Solo eliminar caja_movimientos si el pago es de HOY
    // Para no alterar cajas de días anteriores ya cerrados
    const fechaHoy = getFechaHoyArgentina()
    const esDeHoy = pago.fecha === fechaHoy

    if (pago.movimiento_id && esDeHoy) {
      await supabase
        .from('caja_movimientos')
        .delete()
        .eq('id', pago.movimiento_id)
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error anulando pago:', error)
    return { success: false, error }
  }
}
