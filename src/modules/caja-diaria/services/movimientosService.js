/**
 * Service para movimientos de caja diaria
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from './empleadosService'
import { getFechaHoyArgentina, getTimestampArgentina, getHoraArgentina } from '../utils/dateUtils'

/**
 * Obtener movimientos de una fecha (sin cargar nombres de creadores para mayor velocidad)
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 */
export async function getMovimientosByFecha(fecha) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

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
      .eq('user_id', userId)
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
 * Obtener detalle completo de un movimiento (incluye nombre del creador)
 * @param {string} movimientoId - ID del movimiento
 */
export async function getMovimientoDetalle(movimientoId) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

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
      .eq('id', movimientoId)
      .eq('user_id', userId)
      .single()

    if (error) throw error

    // Obtener nombre del creador si existe
    if (data?.created_by_id) {
      const { data: perfil, error: perfilError } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, email')
        .eq('id', data.created_by_id)
        .single()

      if (!perfilError && perfil) {
        data.creador = perfil
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching movimiento detalle:', error)
    return { data: null, error }
  }
}

/**
 * Crear movimiento con split de pagos
 * @param {object} movimiento - { tipo, categoria_id, descripcion, fecha, pagos: [{ metodo_pago_id, monto }] }
 */
export async function createMovimiento({ tipo, categoria_id, descripcion, fecha, pagos }) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Obtener el ID del usuario autenticado (puede ser diferente de userId si es empleado)
    const { data: { user } } = await supabase.auth.getUser()
    const createdById = user?.id || userId

    // Calcular monto total
    const monto_total = pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0)

    if (monto_total <= 0) {
      throw new Error('El monto total debe ser mayor a 0')
    }

    // Crear movimiento
    const { data: movimiento, error: errorMovimiento } = await supabase
      .from('caja_movimientos')
      .insert({
        user_id: userId,
        created_by_id: createdById,
        tipo,
        categoria_id,
        descripcion,
        fecha: fecha || getFechaHoyArgentina(),
        hora: getHoraArgentina(),
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
 * Requiere permiso anular_movimientos si es empleado
 */
export async function anularMovimiento(id, motivo = '') {
  try {
    const { userId, permisos, esDuenio, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Verificar permiso si es empleado
    if (!esDuenio && !permisos?.anular_movimientos) {
      throw new Error('No tienes permisos para anular movimientos')
    }

    const { data, error } = await supabase
      .from('caja_movimientos')
      .update({
        anulado: true,
        anulado_at: getTimestampArgentina(),
        anulado_motivo: motivo
      })
      .eq('id', id)
      .eq('user_id', userId)
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
 * Actualizar comentario/descripción de un movimiento
 * @param {string} id - ID del movimiento
 * @param {string} descripcion - Nueva descripción/comentario
 */
export async function actualizarComentario(id, descripcion) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_movimientos')
      .update({ descripcion: descripcion?.trim() || null })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error actualizando comentario:', error)
    return { data: null, error }
  }
}

/**
 * Obtener resumen del día usando función RPC
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 */
export async function getResumenDia(fecha) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_resumen_dia', {
        p_user_id: userId,
        p_fecha: fecha || getFechaHoyArgentina()
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
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_totales_por_metodo', {
        p_user_id: userId,
        p_fecha: fecha || getFechaHoyArgentina()
      })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching totales por método:', error)
    return { data: null, error }
  }
}

/**
 * Obtener reporte de totales por método de pago en un período
 * @param {string} fechaDesde - Fecha inicio en formato YYYY-MM-DD
 * @param {string} fechaHasta - Fecha fin en formato YYYY-MM-DD
 */
export async function getReportePeriodo(fechaDesde, fechaHasta) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_reporte_periodo', {
        p_user_id: userId,
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta
      })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching reporte período:', error)
    return { data: null, error }
  }
}
