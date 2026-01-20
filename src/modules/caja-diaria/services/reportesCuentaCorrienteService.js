/**
 * Service para reportes de cuenta corriente
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from './empleadosService'

/**
 * Obtener reporte de deudores (estado actual)
 * Retorna clientes con saldo != 0, incluyendo días de deuda y última actividad
 */
export async function getReporteDeudores() {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_reporte_deudores', { p_user_id: userId })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching reporte deudores:', error)
    return { data: [], error }
  }
}

/**
 * Obtener reporte de movimientos de cuenta corriente
 * @param {object} filtros - { fechaDesde, fechaHasta, clienteId }
 */
export async function getReporteMovimientosCuenta({ fechaDesde = null, fechaHasta = null, clienteId = null } = {}) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_reporte_movimientos_cuenta', {
        p_user_id: userId,
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta,
        p_cliente_id: clienteId
      })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching reporte movimientos cuenta:', error)
    return { data: [], error }
  }
}
