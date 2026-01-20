/**
 * Service para reportes por categoría
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from './empleadosService'

/**
 * Obtener reporte de ingresos por categoría
 * @param {object} filtros - { fechaDesde, fechaHasta }
 */
export async function getReporteIngresosPorCategoria({ fechaDesde = null, fechaHasta = null } = {}) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_reporte_ingresos_por_categoria', {
        p_user_id: userId,
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta
      })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching reporte ingresos por categoría:', error)
    return { data: [], error }
  }
}

/**
 * Obtener reporte de egresos por categoría
 * @param {object} filtros - { fechaDesde, fechaHasta }
 */
export async function getReporteEgresosPorCategoria({ fechaDesde = null, fechaHasta = null } = {}) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_reporte_egresos_por_categoria', {
        p_user_id: userId,
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta
      })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching reporte egresos por categoría:', error)
    return { data: [], error }
  }
}

/**
 * Obtener detalle de movimientos de una categoría
 * @param {object} params - { categoriaId, tipo, fechaDesde, fechaHasta }
 */
export async function getDetalleMovimientosCategoria({ categoriaId, tipo, fechaDesde = null, fechaHasta = null }) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_detalle_movimientos_categoria', {
        p_user_id: userId,
        p_categoria_id: categoriaId,
        p_tipo: tipo,
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta
      })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching detalle movimientos categoría:', error)
    return { data: [], error }
  }
}
