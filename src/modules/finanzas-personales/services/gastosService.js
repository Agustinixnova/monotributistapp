/**
 * Servicio para gestion de gastos
 */

import { supabase } from '../../../lib/supabase'
import { getPrimerDiaMes, getUltimoDiaMes } from '../utils/formatters'

/**
 * Obtener gastos del mes actual
 * @param {string} userId - ID del usuario
 * @param {Date} fecha - Fecha del mes (opcional)
 * @returns {Promise<Array>} Lista de gastos
 */
export async function getGastosMes(userId, fecha = new Date()) {
  const primerDia = getPrimerDiaMes(fecha)
  const ultimoDia = getUltimoDiaMes(fecha)

  const { data, error } = await supabase
    .from('fp_gastos')
    .select(`
      *,
      fp_categorias(*)
    `)
    .eq('user_id', userId)
    .gte('fecha', primerDia)
    .lte('fecha', ultimoDia)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Obtener gastos de los ultimos N meses
 * @param {string} userId - ID del usuario
 * @param {number} meses - Cantidad de meses
 * @returns {Promise<Array>} Lista de gastos
 */
export async function getGastosUltimosMeses(userId, meses = 2) {
  const fechaDesde = new Date()
  fechaDesde.setMonth(fechaDesde.getMonth() - meses)
  fechaDesde.setDate(1)

  const { data, error } = await supabase
    .from('fp_gastos')
    .select(`
      *,
      fp_categorias(*)
    `)
    .eq('user_id', userId)
    .gte('fecha', fechaDesde.toISOString().split('T')[0])
    .order('fecha', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Crear un nuevo gasto
 * @param {Object} gasto - Datos del gasto
 * @returns {Promise<Object>} Gasto creado
 */
export async function crearGasto(gasto) {
  // La tabla usa "nota" como columna (puede incluir descripcion)
  const nota = gasto.descripcion || gasto.notas || gasto.nota || null

  const { data, error } = await supabase
    .from('fp_gastos')
    .insert({
      user_id: gasto.userId || gasto.user_id,
      monto: gasto.monto,
      categoria_id: gasto.categoriaId || gasto.categoria_id,
      fecha: gasto.fecha,
      nota: nota,
      metodo_pago: gasto.metodoPago || gasto.metodo_pago || 'efectivo',
      es_compartido: gasto.esCompartido || gasto.es_compartido || false,
      monto_real: (gasto.esCompartido || gasto.es_compartido) ? (gasto.montoReal || gasto.monto_real) : null,
      recurrente_id: gasto.recurrenteId || gasto.recurrente_id || null
    })
    .select(`
      *,
      fp_categorias(*)
    `)
    .single()

  if (error) throw error
  return data
}

/**
 * Actualizar un gasto
 * @param {string} id - ID del gasto
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>} Gasto actualizado
 */
export async function actualizarGasto(id, datos) {
  const updateData = {}
  if (datos.monto !== undefined) updateData.monto = datos.monto
  if (datos.categoriaId !== undefined || datos.categoria_id !== undefined) {
    updateData.categoria_id = datos.categoriaId || datos.categoria_id
  }
  if (datos.fecha !== undefined) updateData.fecha = datos.fecha
  // La columna es "nota" (singular)
  if (datos.descripcion !== undefined || datos.notas !== undefined || datos.nota !== undefined) {
    updateData.nota = datos.descripcion || datos.notas || datos.nota || null
  }
  if (datos.metodoPago !== undefined || datos.metodo_pago !== undefined) {
    updateData.metodo_pago = datos.metodoPago || datos.metodo_pago
  }
  if (datos.esCompartido !== undefined || datos.es_compartido !== undefined) {
    const esCompartido = datos.esCompartido || datos.es_compartido
    updateData.es_compartido = esCompartido
    updateData.monto_real = esCompartido ? (datos.montoReal || datos.monto_real) : null
  }

  const { data, error } = await supabase
    .from('fp_gastos')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      fp_categorias(*)
    `)
    .single()

  if (error) throw error
  return data
}

/**
 * Eliminar un gasto
 * @param {string} id - ID del gasto
 * @returns {Promise<void>}
 */
export async function eliminarGasto(id) {
  const { error } = await supabase
    .from('fp_gastos')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Obtener estadisticas por categoria usando RPC
 * @param {string} userId - ID del usuario
 * @param {string} mes - Primer dia del mes (YYYY-MM-DD)
 * @returns {Promise<Array>} Estadisticas por categoria
 */
export async function getEstadisticasPorCategoria(userId, mes = null) {
  const { data, error } = await supabase
    .rpc('fp_gastos_por_categoria', {
      p_user_id: userId,
      p_mes: mes
    })

  if (error) throw error
  return data || []
}
