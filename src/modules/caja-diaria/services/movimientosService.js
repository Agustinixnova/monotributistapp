/**
 * Service para movimientos de caja diaria
 */

import { supabase } from '../../../lib/supabase'

/**
 * Obtener movimientos de una fecha
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 */
export async function getMovimientosByFecha(fecha) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_movimientos')
      .select(`
        *,
        categoria:caja_categorias(id, nombre, icono, tipo),
        pagos:caja_movimientos_pagos(
          id,
          monto,
          metodo:caja_metodos_pago(id, nombre, icono, es_efectivo)
        )
      `)
      .eq('user_id', user.id)
      .eq('fecha', fecha)
      .eq('anulado', false)
      .order('hora', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching movimientos:', error)
    return { data: null, error }
  }
}

/**
 * Crear movimiento con split de pagos
 * @param {object} movimiento - { tipo, categoria_id, descripcion, fecha, pagos: [{ metodo_pago_id, monto }] }
 */
export async function createMovimiento({ tipo, categoria_id, descripcion, fecha, pagos }) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    // Calcular monto total
    const monto_total = pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0)

    if (monto_total <= 0) {
      throw new Error('El monto total debe ser mayor a 0')
    }

    // Crear movimiento
    const { data: movimiento, error: errorMovimiento } = await supabase
      .from('caja_movimientos')
      .insert({
        user_id: user.id,
        tipo,
        categoria_id,
        descripcion,
        fecha: fecha || new Date().toISOString().split('T')[0],
        monto_total,
        anulado: false
      })
      .select()
      .single()

    if (errorMovimiento) throw errorMovimiento

    // Crear detalles de pagos
    const pagosConMovimiento = pagos.map(p => ({
      movimiento_id: movimiento.id,
      metodo_pago_id: p.metodo_pago_id,
      monto: parseFloat(p.monto)
    }))

    const { error: errorPagos } = await supabase
      .from('caja_movimientos_pagos')
      .insert(pagosConMovimiento)

    if (errorPagos) {
      // Si falla, eliminar el movimiento
      await supabase.from('caja_movimientos').delete().eq('id', movimiento.id)
      throw errorPagos
    }

    return { data: movimiento, error: null }
  } catch (error) {
    console.error('Error creating movimiento:', error)
    return { data: null, error }
  }
}

/**
 * Anular movimiento (no se borra, se marca como anulado)
 */
export async function anularMovimiento(id, motivo = '') {
  try {
    const { data, error } = await supabase
      .from('caja_movimientos')
      .update({
        anulado: true,
        anulado_at: new Date().toISOString(),
        anulado_motivo: motivo
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error anulando movimiento:', error)
    return { data: null, error }
  }
}

/**
 * Obtener resumen del día usando función RPC
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 */
export async function getResumenDia(fecha) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_resumen_dia', {
        p_user_id: user.id,
        p_fecha: fecha || new Date().toISOString().split('T')[0]
      })

    if (error) throw error
    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('Error fetching resumen día:', error)
    return { data: null, error }
  }
}

/**
 * Obtener totales por método de pago usando función RPC
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 */
export async function getTotalesPorMetodo(fecha) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_totales_por_metodo', {
        p_user_id: user.id,
        p_fecha: fecha || new Date().toISOString().split('T')[0]
      })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching totales por método:', error)
    return { data: null, error }
  }
}
