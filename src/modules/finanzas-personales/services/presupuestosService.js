/**
 * Servicio para gestion de presupuestos
 */

import { supabase } from '../../../lib/supabase'
import { getPrimerDiaMes } from '../utils/formatters'

/**
 * Obtener presupuestos del mes
 * @param {string} userId - ID del usuario
 * @param {Date} fecha - Fecha del mes (opcional)
 * @returns {Promise<Array>} Lista de presupuestos
 */
export async function getPresupuestosMes(userId, fecha = new Date()) {
  const mes = getPrimerDiaMes(fecha)

  const { data, error } = await supabase
    .from('fp_presupuestos')
    .select(`
      *,
      categoria:fp_categorias(*)
    `)
    .eq('user_id', userId)
    .eq('mes', mes)

  if (error) throw error
  return data || []
}

/**
 * Guardar/actualizar presupuesto de una categoria
 * @param {Object} presupuesto - Datos del presupuesto
 * @returns {Promise<Object>} Presupuesto guardado
 */
export async function guardarPresupuesto(presupuesto) {
  const mes = getPrimerDiaMes(presupuesto.fecha || new Date())

  const { data, error } = await supabase
    .from('fp_presupuestos')
    .upsert({
      user_id: presupuesto.userId,
      categoria_id: presupuesto.categoriaId,
      monto_limite: presupuesto.montoLimite,
      mes: mes,
      alerta_80: presupuesto.alerta80 !== false // default true
    }, {
      onConflict: 'user_id,categoria_id,mes'
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
 * Eliminar presupuesto
 * @param {string} id - ID del presupuesto
 * @returns {Promise<void>}
 */
export async function eliminarPresupuesto(id) {
  const { error } = await supabase
    .from('fp_presupuestos')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Copiar presupuestos del mes anterior al mes actual
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Presupuestos copiados
 */
export async function copiarPresupuestosMesAnterior(userId) {
  const hoy = new Date()
  const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
  const mesActual = getPrimerDiaMes(hoy)
  const mesAnteriorStr = getPrimerDiaMes(mesAnterior)

  // Obtener presupuestos del mes anterior
  const { data: presupuestosAnteriores, error: errorGet } = await supabase
    .from('fp_presupuestos')
    .select('categoria_id, monto_limite, alerta_80')
    .eq('user_id', userId)
    .eq('mes', mesAnteriorStr)

  if (errorGet) throw errorGet
  if (!presupuestosAnteriores || presupuestosAnteriores.length === 0) {
    return []
  }

  // Crear presupuestos para el mes actual
  const nuevosPresupuestos = presupuestosAnteriores.map(p => ({
    user_id: userId,
    categoria_id: p.categoria_id,
    monto_limite: p.monto_limite,
    mes: mesActual,
    alerta_80: p.alerta_80
  }))

  const { data, error } = await supabase
    .from('fp_presupuestos')
    .upsert(nuevosPresupuestos, {
      onConflict: 'user_id,categoria_id,mes'
    })
    .select(`
      *,
      categoria:fp_categorias(*)
    `)

  if (error) throw error
  return data || []
}
