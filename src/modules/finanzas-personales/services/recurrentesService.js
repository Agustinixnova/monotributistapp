/**
 * Servicio para gestion de gastos recurrentes
 */

import { supabase } from '../../../lib/supabase'

/**
 * Obtener gastos recurrentes activos
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de recurrentes
 */
export async function getRecurrentesActivos(userId) {
  const { data, error } = await supabase
    .from('fp_gastos_recurrentes')
    .select(`
      *,
      categoria:fp_categorias(*)
    `)
    .eq('user_id', userId)
    .eq('activo', true)
    .order('dia_del_mes', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Obtener todos los gastos recurrentes (activos e inactivos)
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de recurrentes
 */
export async function getTodosRecurrentes(userId) {
  const { data, error } = await supabase
    .from('fp_gastos_recurrentes')
    .select(`
      *,
      categoria:fp_categorias(*)
    `)
    .eq('user_id', userId)
    .order('activo', { ascending: false }) // Activos primero
    .order('dia_del_mes', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Crear un gasto recurrente
 * @param {Object} recurrente - Datos del recurrente
 * @returns {Promise<Object>} Recurrente creado
 */
export async function crearRecurrente(recurrente) {
  const { data, error } = await supabase
    .from('fp_gastos_recurrentes')
    .insert({
      user_id: recurrente.userId,
      monto: recurrente.monto,
      categoria_id: recurrente.categoriaId,
      descripcion: recurrente.descripcion,
      metodo_pago: recurrente.metodoPago || 'debito',
      dia_del_mes: recurrente.diadelMes || null,
      es_compartido: recurrente.esCompartido || false,
      monto_real: recurrente.esCompartido ? recurrente.montoReal : null,
      activo: true
    })
    .select(`
      *,
      categoria:fp_categorias(*)
    `)
    .single()

  if (error) throw error
  return data
}

/**
 * Actualizar un gasto recurrente
 * @param {string} id - ID del recurrente
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>} Recurrente actualizado
 */
export async function actualizarRecurrente(id, datos) {
  const updateData = {}
  if (datos.monto !== undefined) updateData.monto = datos.monto
  if (datos.categoriaId !== undefined) updateData.categoria_id = datos.categoriaId
  if (datos.descripcion !== undefined) updateData.descripcion = datos.descripcion
  if (datos.metodoPago !== undefined) updateData.metodo_pago = datos.metodoPago
  if (datos.diadelMes !== undefined) updateData.dia_del_mes = datos.diadelMes
  if (datos.activo !== undefined) updateData.activo = datos.activo
  if (datos.esCompartido !== undefined) {
    updateData.es_compartido = datos.esCompartido
    updateData.monto_real = datos.esCompartido ? datos.montoReal : null
  }

  const { data, error } = await supabase
    .from('fp_gastos_recurrentes')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      categoria:fp_categorias(*)
    `)
    .single()

  if (error) throw error
  return data
}

/**
 * Eliminar un gasto recurrente
 * @param {string} id - ID del recurrente
 * @returns {Promise<void>}
 */
export async function eliminarRecurrente(id) {
  const { error } = await supabase
    .from('fp_gastos_recurrentes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Cargar gasto desde plantilla recurrente
 * @param {Object} recurrente - Plantilla recurrente
 * @param {string} fecha - Fecha del gasto
 * @returns {Promise<Object>} Gasto creado
 */
export async function cargarDesdeRecurrente(recurrente, fecha) {
  const { data, error } = await supabase
    .from('fp_gastos')
    .insert({
      user_id: recurrente.user_id,
      monto: recurrente.monto,
      categoria_id: recurrente.categoria_id,
      fecha: fecha,
      nota: recurrente.descripcion,
      metodo_pago: recurrente.metodo_pago,
      es_compartido: recurrente.es_compartido,
      monto_real: recurrente.monto_real,
      recurrente_id: recurrente.id
    })
    .select(`
      *,
      categoria:fp_categorias(*)
    `)
    .single()

  if (error) throw error
  return data
}
