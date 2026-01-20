/**
 * Service para cierres de caja diaria
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from './empleadosService'
import { getTimestampArgentina, getFechaAyerArgentina } from '../utils/dateUtils'

/**
 * Obtener cierre de una fecha
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 */
export async function getCierreCaja(fecha) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_cierres')
      .select('*')
      .eq('user_id', userId)
      .eq('fecha', fecha)
      .maybeSingle()

    if (error) throw error

    // Si hay cierre y tiene created_by_id, obtener el perfil del creador usando función RPC
    if (data && data.created_by_id) {
      const { data: perfiles } = await supabase
        .rpc('get_users_names', { user_ids: [data.created_by_id] })

      if (perfiles && perfiles.length > 0) {
        data.creador = perfiles[0]
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching cierre de caja:', error)
    return { data: null, error }
  }
}

/**
 * Crear o actualizar cierre de caja
 * Requiere permiso editar_cierre si es empleado
 * @param {object} cierre - { fecha, saldo_inicial, efectivo_real, motivo_diferencia, ... }
 */
export async function upsertCierreCaja(cierre) {
  try {
    const { userId, esDuenio, permisos, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Verificar permiso si es empleado
    if (!esDuenio && !permisos?.editar_cierre) {
      throw new Error('No tienes permisos para cerrar la caja')
    }

    // Obtener el ID del usuario autenticado (puede ser diferente de userId si es empleado)
    const { data: { user } } = await supabase.auth.getUser()
    const createdById = user?.id || userId

    const cierreData = {
      user_id: userId,
      created_by_id: createdById,
      ...cierre,
      cerrado: true,
      cerrado_at: getTimestampArgentina()
    }

    const { data, error } = await supabase
      .from('caja_cierres')
      .upsert(cierreData, {
        onConflict: 'user_id,fecha'
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error upserting cierre de caja:', error)
    return { data: null, error }
  }
}

/**
 * Obtener saldo inicial del día (efectivo final del día anterior)
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 */
export async function getSaldoInicial(fecha) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Calcular fecha del día anterior
    const fechaAnterior = getFechaAyerArgentina(fecha)

    // Buscar cierre del día anterior
    const { data, error } = await supabase
      .from('caja_cierres')
      .select('efectivo_real')
      .eq('user_id', userId)
      .eq('fecha', fechaAnterior)
      .eq('cerrado', true)
      .maybeSingle()

    if (error) throw error

    return { data: data?.efectivo_real || 0, error: null }
  } catch (error) {
    console.error('Error fetching saldo inicial:', error)
    return { data: 0, error }
  }
}

/**
 * Obtener últimos cierres
 * @param {number} limit - Cantidad de cierres a obtener
 */
export async function getUltimosCierres(limit = 10) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_cierres')
      .select('*')
      .eq('user_id', userId)
      .eq('cerrado', true)
      .order('fecha', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching últimos cierres:', error)
    return { data: null, error }
  }
}

/**
 * Guardar solo el saldo inicial del día (sin cerrar la caja)
 * Requiere permiso editar_saldo_inicial si es empleado
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {number} saldoInicial - Saldo inicial a guardar
 */
export async function guardarSaldoInicial(fecha, saldoInicial) {
  try {
    const { userId, esDuenio, permisos, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Verificar permiso si es empleado
    if (!esDuenio && !permisos?.editar_saldo_inicial) {
      throw new Error('No tienes permisos para editar el saldo inicial')
    }

    // Primero intentar actualizar si existe
    const { data: existing } = await supabase
      .from('caja_cierres')
      .select('id')
      .eq('user_id', userId)
      .eq('fecha', fecha)
      .maybeSingle()

    let data, error

    if (existing) {
      // Actualizar existente
      const result = await supabase
        .from('caja_cierres')
        .update({ saldo_inicial: saldoInicial })
        .eq('id', existing.id)
        .select()
        .single()

      data = result.data
      error = result.error
    } else {
      // Crear nuevo
      const result = await supabase
        .from('caja_cierres')
        .insert({
          user_id: userId,
          fecha,
          saldo_inicial: saldoInicial,
          cerrado: false
        })
        .select()
        .single()

      data = result.data
      error = result.error
    }

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error guardando saldo inicial:', error)
    return { data: null, error }
  }
}

/**
 * Reabrir un día cerrado (cambiar cerrado a false)
 * Requiere permiso reabrir_dia si es empleado
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 */
export async function reabrirDia(fecha) {
  try {
    const { userId, esDuenio, permisos, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Verificar permiso si es empleado
    if (!esDuenio && !permisos?.reabrir_dia) {
      throw new Error('No tienes permisos para reabrir días cerrados')
    }

    const { data, error } = await supabase
      .from('caja_cierres')
      .update({
        cerrado: false,
        cerrado_at: null
      })
      .eq('user_id', userId)
      .eq('fecha', fecha)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error reabriendo día:', error)
    return { data: null, error }
  }
}

/**
 * Obtener días anteriores con movimientos sin cerrar
 * @returns {Array} Lista de días con movimientos pendientes de cierre
 */
export async function getDiasSinCerrar() {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_dias_sin_cerrar', {
        p_user_id: userId
      })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching días sin cerrar:', error)
    return { data: [], error }
  }
}
