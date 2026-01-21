/**
 * Service para obtener estadísticas de Caja Diaria
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from './empleadosService'

/**
 * Obtener resumen general del período
 */
export async function getEstadisticasResumen({ fechaDesde, fechaHasta }) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_estadisticas_resumen', {
        p_user_id: userId,
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta
      })

    if (error) throw error
    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('Error fetching estadísticas resumen:', error)
    return { data: null, error }
  }
}

/**
 * Obtener evolución diaria (ingresos/egresos por día)
 */
export async function getEstadisticasEvolucionDiaria({ fechaDesde, fechaHasta }) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_estadisticas_evolucion_diaria', {
        p_user_id: userId,
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta
      })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching evolución diaria:', error)
    return { data: [], error }
  }
}

/**
 * Obtener distribución por categorías
 */
export async function getEstadisticasCategorias({ fechaDesde, fechaHasta, tipo }) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_estadisticas_categorias', {
        p_user_id: userId,
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta,
        p_tipo: tipo
      })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching estadísticas categorías:', error)
    return { data: [], error }
  }
}

/**
 * Obtener distribución por métodos de pago
 */
export async function getEstadisticasMetodosPago({ fechaDesde, fechaHasta }) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_estadisticas_metodos_pago', {
        p_user_id: userId,
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta
      })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching estadísticas métodos pago:', error)
    return { data: [], error }
  }
}

/**
 * Obtener distribución por días de la semana
 */
export async function getEstadisticasDiasSemana({ fechaDesde, fechaHasta }) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_estadisticas_dias_semana', {
        p_user_id: userId,
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta
      })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching estadísticas días semana:', error)
    return { data: [], error }
  }
}

/**
 * Obtener estadísticas de cuenta corriente
 */
export async function getEstadisticasCuentaCorriente({ fechaDesde, fechaHasta }) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_estadisticas_cuenta_corriente', {
        p_user_id: userId,
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta
      })

    if (error) throw error
    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('Error fetching estadísticas cuenta corriente:', error)
    return { data: null, error }
  }
}
