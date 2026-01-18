/**
 * Servicio para gestion de ingresos
 */

import { supabase } from '../../../lib/supabase'
import { getPrimerDiaMes } from '../utils/formatters'

/**
 * Obtener ingresos del mes
 * @param {string} userId - ID del usuario
 * @param {Date} fecha - Fecha del mes (opcional)
 * @returns {Promise<Object|null>} Ingresos del mes o null
 */
export async function getIngresosMes(userId, fecha = new Date()) {
  const mes = getPrimerDiaMes(fecha)

  const { data, error } = await supabase
    .from('fp_ingresos')
    .select('*')
    .eq('user_id', userId)
    .eq('mes', mes)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Guardar/actualizar ingresos del mes
 * @param {Object} ingresos - Datos de ingresos
 * @returns {Promise<Object>} Ingresos guardados
 */
export async function guardarIngresos(ingresos) {
  const mes = getPrimerDiaMes(ingresos.fecha || new Date())

  const { data, error } = await supabase
    .from('fp_ingresos')
    .upsert({
      user_id: ingresos.userId,
      mes: mes,
      ingreso_principal: ingresos.ingresoPrincipal || 0,
      otros_ingresos: ingresos.otrosIngresos || 0,
      ingresos_extra: ingresos.ingresosExtra || 0,
      objetivo_ahorro_porcentaje: ingresos.objetivoAhorroPorcentaje || 0
    }, {
      onConflict: 'user_id,mes'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Obtener historial de ingresos (ultimos N meses)
 * @param {string} userId - ID del usuario
 * @param {number} meses - Cantidad de meses
 * @returns {Promise<Array>} Lista de ingresos
 */
export async function getHistorialIngresos(userId, meses = 6) {
  const fechaDesde = new Date()
  fechaDesde.setMonth(fechaDesde.getMonth() - meses)
  const mesDesde = getPrimerDiaMes(fechaDesde)

  const { data, error } = await supabase
    .from('fp_ingresos')
    .select('*')
    .eq('user_id', userId)
    .gte('mes', mesDesde)
    .order('mes', { ascending: false })

  if (error) throw error
  return data || []
}
