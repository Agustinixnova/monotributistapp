/**
 * Service para cierres de caja diaria
 */

import { supabase } from '../../../lib/supabase'

/**
 * Obtener cierre de una fecha
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 */
export async function getCierreCaja(fecha) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_cierres')
      .select('*')
      .eq('user_id', user.id)
      .eq('fecha', fecha)
      .maybeSingle()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching cierre de caja:', error)
    return { data: null, error }
  }
}

/**
 * Crear o actualizar cierre de caja
 * @param {object} cierre - { fecha, saldo_inicial, efectivo_real, motivo_diferencia, ... }
 */
export async function upsertCierreCaja(cierre) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const cierreData = {
      user_id: user.id,
      ...cierre,
      cerrado: true,
      cerrado_at: new Date().toISOString()
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    // Calcular fecha del día anterior
    const fechaObj = new Date(fecha + 'T00:00:00')
    fechaObj.setDate(fechaObj.getDate() - 1)
    const fechaAnterior = fechaObj.toISOString().split('T')[0]

    // Buscar cierre del día anterior
    const { data, error } = await supabase
      .from('caja_cierres')
      .select('efectivo_real')
      .eq('user_id', user.id)
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_cierres')
      .select('*')
      .eq('user_id', user.id)
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
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {number} saldoInicial - Saldo inicial a guardar
 */
export async function guardarSaldoInicial(fecha, saldoInicial) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    // Primero intentar actualizar si existe
    const { data: existing } = await supabase
      .from('caja_cierres')
      .select('id')
      .eq('user_id', user.id)
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
          user_id: user.id,
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
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 */
export async function reabrirDia(fecha) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_cierres')
      .update({
        cerrado: false,
        cerrado_at: null
      })
      .eq('user_id', user.id)
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
