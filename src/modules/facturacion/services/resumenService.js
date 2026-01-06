import { supabase } from '../../../lib/supabase'

/**
 * Obtener resumen mensual de un cliente
 */
export async function getResumenMes(clientId, anio, mes) {
  const { data, error } = await supabase
    .from('client_facturacion_mensual_resumen')
    .select(`
      *,
      revisado_por_profile:profiles!revisado_por(nombre, apellido)
    `)
    .eq('client_id', clientId)
    .eq('anio', anio)
    .eq('mes', mes)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

/**
 * Obtener resumenes de ultimos N meses
 */
export async function getResumenesCliente(clientId, meses = 12) {
  const { data, error } = await supabase
    .from('client_facturacion_mensual_resumen')
    .select('*')
    .eq('client_id', clientId)
    .order('anio', { ascending: false })
    .order('mes', { ascending: false })
    .limit(meses)

  if (error) throw error
  return data || []
}

/**
 * Obtener acumulado de 12 meses
 */
export async function getAcumulado12Meses(clientId) {
  const hoy = new Date()
  const hace12Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1)
  const anioInicio = hace12Meses.getFullYear()
  const mesInicio = hace12Meses.getMonth() + 1

  const { data, error } = await supabase
    .from('client_facturacion_mensual_resumen')
    .select('total_facturas, total_notas_debito, total_notas_credito, total_neto, cantidad_comprobantes, anio, mes')
    .eq('client_id', clientId)
    .or(`anio.gt.${anioInicio},and(anio.eq.${anioInicio},mes.gte.${mesInicio})`)

  if (error) throw error

  const totales = (data || []).reduce((acc, item) => ({
    facturas: acc.facturas + parseFloat(item.total_facturas || 0),
    notasDebito: acc.notasDebito + parseFloat(item.total_notas_debito || 0),
    notasCredito: acc.notasCredito + parseFloat(item.total_notas_credito || 0),
    neto: acc.neto + parseFloat(item.total_neto || 0),
    comprobantes: acc.comprobantes + (item.cantidad_comprobantes || 0)
  }), { facturas: 0, notasDebito: 0, notasCredito: 0, neto: 0, comprobantes: 0 })

  return {
    ...totales,
    meses: data || [],
    periodoDesde: `${mesInicio}/${anioInicio}`,
    periodoHasta: `${hoy.getMonth() + 1}/${hoy.getFullYear()}`
  }
}

/**
 * Actualizar estado de revision
 */
export async function updateEstadoRevision(id, estado, userId, nota = null) {
  const { data, error } = await supabase
    .from('client_facturacion_mensual_resumen')
    .update({
      estado_revision: estado,
      revisado_por: userId,
      revisado_at: new Date().toISOString(),
      nota_revision: nota
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Cerrar mes
 */
export async function cerrarMes(id, userId) {
  const { data, error } = await supabase
    .from('client_facturacion_mensual_resumen')
    .update({
      estado: 'cerrado',
      cerrado_por: userId,
      cerrado_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Actualizar notas internas
 */
export async function updateNotasInternas(id, notas) {
  const { data, error } = await supabase
    .from('client_facturacion_mensual_resumen')
    .update({ notas_internas: notas })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
