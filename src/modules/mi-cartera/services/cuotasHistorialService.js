import { supabase } from '../../../lib/supabase'

/**
 * Obtener cuotas de los últimos 12 meses para un cliente
 * @param {string} clientId - ID del cliente (client_fiscal_data.id)
 * @returns {Promise<Array>} - Array de 12 meses con información de cuotas
 */
export async function getUltimos12Meses(clientId) {
  const ahora = new Date()
  const meses = []

  // Generar últimos 12 meses
  for (let i = 0; i < 12; i++) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    const anio = fecha.getFullYear()
    const mes = fecha.getMonth() + 1

    meses.push({
      anio,
      mes,
      fecha: fecha.toISOString(),
      mesNombre: fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
      mesCorto: fecha.toLocaleDateString('es-AR', { month: 'short' })
    })
  }

  // Obtener cuotas registradas
  const { data: cuotas, error } = await supabase
    .from('client_cuota_mensual')
    .select('*')
    .eq('client_id', clientId)
    .in('anio', [...new Set(meses.map(m => m.anio))])
    .in('mes', [...new Set(meses.map(m => m.mes))])

  if (error) throw error

  // Combinar información
  return meses.map(m => {
    const cuota = cuotas?.find(c => c.anio === m.anio && c.mes === m.mes)
    return {
      ...m,
      cuota: cuota || null,
      estado: cuota?.estado || 'sin_registro',
      montoCuota: cuota?.monto_cuota || null,
      fechaPago: cuota?.fecha_pago || null,
      comprobanteUrl: cuota?.comprobante_url || null
    }
  })
}

/**
 * Marcar un mes como pagado o pendiente
 * @param {string} clientId - ID del cliente
 * @param {number} anio - Año
 * @param {number} mes - Mes (1-12)
 * @param {string} estado - 'informada', 'verificada', 'pendiente'
 * @param {string} userId - ID del usuario que realiza la acción
 * @param {Object} datos - Datos adicionales (monto_cuota, fecha_pago)
 */
export async function actualizarEstadoCuota(clientId, anio, mes, estado, userId, datos = {}) {
  const { data, error } = await supabase
    .from('client_cuota_mensual')
    .upsert({
      client_id: clientId,
      anio,
      mes,
      estado,
      monto_cuota: datos.montoCuota || null,
      fecha_pago: datos.fechaPago || new Date().toISOString().split('T')[0],
      informado_por: userId,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'client_id,anio,mes'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Eliminar registro de cuota
 * @param {string} clientId - ID del cliente
 * @param {number} anio - Año
 * @param {number} mes - Mes
 */
export async function eliminarCuota(clientId, anio, mes) {
  const { error } = await supabase
    .from('client_cuota_mensual')
    .delete()
    .eq('client_id', clientId)
    .eq('anio', anio)
    .eq('mes', mes)

  if (error) throw error
}

/**
 * Obtener información de deuda inicial del cliente
 */
export async function getDeudaInicial(clientId) {
  const { data, error } = await supabase
    .from('client_fiscal_data')
    .select('fecha_alta_sistema, cuotas_adeudadas_al_alta, periodo_deuda_desde, periodo_deuda_hasta, notas_deuda_inicial')
    .eq('id', clientId)
    .single()

  if (error) throw error
  return data
}

/**
 * Actualizar información de deuda inicial
 */
export async function actualizarDeudaInicial(clientId, datos) {
  const { data, error } = await supabase
    .from('client_fiscal_data')
    .update({
      cuotas_adeudadas_al_alta: datos.cuotasAdeudadas,
      periodo_deuda_desde: datos.periodoDesde,
      periodo_deuda_hasta: datos.periodoHasta,
      notas_deuda_inicial: datos.notas
    })
    .eq('id', clientId)
    .select()
    .single()

  if (error) throw error

  // Recalcular estado de pago
  await supabase.rpc('calcular_estado_pago_monotributo', { p_client_id: clientId })

  return data
}
