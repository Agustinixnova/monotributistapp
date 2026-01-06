import { supabase } from '../../../lib/supabase'

/**
 * Obtener cargas de un cliente para un periodo
 */
export async function getCargasMes(clientId, anio, mes) {
  const { data, error } = await supabase
    .from('client_facturacion_cargas')
    .select(`
      *,
      cargado_por_profile:profiles!cargado_por(nombre, apellido)
    `)
    .eq('client_id', clientId)
    .eq('anio', anio)
    .eq('mes', mes)
    .order('fecha_emision', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Obtener todas las cargas de un cliente (ultimos 12 meses)
 */
export async function getCargasCliente(clientId, meses = 12) {
  const hoy = new Date()
  const desde = new Date(hoy.getFullYear(), hoy.getMonth() - meses + 1, 1)

  const { data, error } = await supabase
    .from('client_facturacion_cargas')
    .select('*')
    .eq('client_id', clientId)
    .gte('fecha_emision', desde.toISOString().split('T')[0])
    .order('fecha_emision', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Crear una nueva carga
 */
export async function createCarga(data) {
  const { data: result, error } = await supabase
    .from('client_facturacion_cargas')
    .insert({
      client_id: data.clientId,
      anio: data.anio,
      mes: data.mes,
      fecha_emision: data.fechaEmision,
      tipo_comprobante: data.tipoComprobante,
      letra_comprobante: data.letraComprobante,
      monto: data.monto,
      cantidad_comprobantes: data.cantidadComprobantes || 1,
      receptor_tipo: data.receptorTipo || 'consumidor_final',
      receptor_razon_social: data.receptorRazonSocial || null,
      receptor_cuit: data.receptorCuit || null,
      nota: data.nota || null,
      archivos_adjuntos: data.archivosAdjuntos || [],
      cargado_por: data.cargadoPor
    })
    .select()
    .single()

  if (error) throw error
  return result
}

/**
 * Crear multiples cargas de una vez
 */
export async function createCargasMultiples(cargas, clientId, cargadoPor) {
  const registros = cargas.map(c => ({
    client_id: clientId,
    anio: c.anio,
    mes: c.mes,
    fecha_emision: c.fechaEmision,
    tipo_comprobante: c.tipoComprobante,
    letra_comprobante: c.letraComprobante,
    monto: c.monto,
    cantidad_comprobantes: c.cantidadComprobantes || 1,
    receptor_tipo: c.receptorTipo || 'consumidor_final',
    receptor_razon_social: c.receptorRazonSocial || null,
    receptor_cuit: c.receptorCuit || null,
    nota: c.nota || null,
    archivos_adjuntos: c.archivosAdjuntos || [],
    cargado_por: cargadoPor
  }))

  const { data, error } = await supabase
    .from('client_facturacion_cargas')
    .insert(registros)
    .select()

  if (error) throw error
  return data
}

/**
 * Actualizar una carga
 */
export async function updateCarga(id, data) {
  const updateData = {}

  if (data.fechaEmision !== undefined) updateData.fecha_emision = data.fechaEmision
  if (data.tipoComprobante !== undefined) updateData.tipo_comprobante = data.tipoComprobante
  if (data.letraComprobante !== undefined) updateData.letra_comprobante = data.letraComprobante
  if (data.monto !== undefined) updateData.monto = data.monto
  if (data.cantidadComprobantes !== undefined) updateData.cantidad_comprobantes = data.cantidadComprobantes
  if (data.receptorTipo !== undefined) updateData.receptor_tipo = data.receptorTipo
  if (data.receptorRazonSocial !== undefined) updateData.receptor_razon_social = data.receptorRazonSocial
  if (data.receptorCuit !== undefined) updateData.receptor_cuit = data.receptorCuit
  if (data.nota !== undefined) updateData.nota = data.nota
  if (data.archivosAdjuntos !== undefined) updateData.archivos_adjuntos = data.archivosAdjuntos
  if (data.notaContadora !== undefined) updateData.nota_contadora = data.notaContadora

  const { data: result, error } = await supabase
    .from('client_facturacion_cargas')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return result
}

/**
 * Actualizar solo la nota de contadora
 */
export async function updateNotaContadora(id, notaContadora) {
  const { data, error } = await supabase
    .from('client_facturacion_cargas')
    .update({ nota_contadora: notaContadora })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Eliminar una carga
 */
export async function deleteCarga(id) {
  const { error } = await supabase
    .from('client_facturacion_cargas')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

/**
 * Marcar comprobante como OK
 */
export async function marcarComprobanteOk(cargaId, userId) {
  const { error } = await supabase.rpc('marcar_comprobante_ok', {
    p_carga_id: cargaId,
    p_user_id: userId
  })
  if (error) throw error
  return true
}

/**
 * Marcar comprobante como observado
 */
export async function marcarComprobanteObservado(cargaId, userId, nota) {
  const { error } = await supabase.rpc('marcar_comprobante_observado', {
    p_carga_id: cargaId,
    p_user_id: userId,
    p_nota: nota
  })
  if (error) throw error
  return true
}

/**
 * Marcar todos los comprobantes del mes como OK
 */
export async function marcarTodosOkMes(clientId, anio, mes, userId) {
  const { data, error } = await supabase.rpc('marcar_todos_ok_mes', {
    p_client_id: clientId,
    p_anio: anio,
    p_mes: mes,
    p_user_id: userId
  })
  if (error) throw error
  return data
}

/**
 * Verificar si se puede cerrar el mes
 */
export async function puedeCerrarMes(clientId, anio, mes) {
  const { data, error } = await supabase.rpc('puede_cerrar_mes', {
    p_client_id: clientId,
    p_anio: anio,
    p_mes: mes
  })
  if (error) throw error
  return data
}

/**
 * Cerrar mes de facturación
 */
export async function cerrarMesFacturacion(clientId, anio, mes, userId) {
  const { data, error } = await supabase.rpc('cerrar_mes_facturacion', {
    p_client_id: clientId,
    p_anio: anio,
    p_mes: mes,
    p_user_id: userId
  })
  if (error) throw error
  return data
}

/**
 * Crear facturacion historica para cliente nuevo (viene de otro contador)
 * @param {string} clientId - ID del client_fiscal_data
 * @param {Object} historicalData - Datos historicos
 * @param {string} historicalData.modoHistorico - 'total' o 'mensual'
 * @param {number} historicalData.totalAcumulado12Meses - Total acumulado (modo total)
 * @param {Object} historicalData.facturacionMensual - {anio-mes: monto} (modo mensual)
 * @param {string} cargadoPor - UUID del usuario que carga
 */
export async function createHistoricalBilling(clientId, historicalData, cargadoPor) {
  if (historicalData.omitirHistorico) {
    return { skipped: true }
  }

  const registros = []
  const hoy = new Date()

  if (historicalData.modoHistorico === 'mensual' && historicalData.facturacionMensual) {
    // Modo mensual: crear un registro por cada mes con datos
    for (const [key, monto] of Object.entries(historicalData.facturacionMensual)) {
      if (!monto || monto <= 0) continue

      const [anio, mes] = key.split('-').map(Number)
      const fechaEmision = new Date(anio, mes - 1, 15) // Mitad del mes como fecha referencia

      registros.push({
        client_id: clientId,
        anio,
        mes,
        fecha_emision: fechaEmision.toISOString().split('T')[0],
        tipo_comprobante: 'FC',
        letra_comprobante: 'C',
        monto,
        cantidad_comprobantes: 1,
        receptor_tipo: 'consumidor_final',
        nota: 'Facturacion historica (importada de contador anterior)',
        archivos_adjuntos: [],
        cargado_por: cargadoPor,
        es_historico: true
      })
    }
  } else if (historicalData.modoHistorico === 'total' && historicalData.totalAcumulado12Meses > 0) {
    // Modo total: distribuir proporcionalmente en los ultimos 12 meses
    const montoPorMes = historicalData.totalAcumulado12Meses / 12

    for (let i = 1; i <= 12; i++) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 15)
      const anio = fecha.getFullYear()
      const mes = fecha.getMonth() + 1

      registros.push({
        client_id: clientId,
        anio,
        mes,
        fecha_emision: fecha.toISOString().split('T')[0],
        tipo_comprobante: 'FC',
        letra_comprobante: 'C',
        monto: Math.round(montoPorMes * 100) / 100, // Redondear a 2 decimales
        cantidad_comprobantes: 1,
        receptor_tipo: 'consumidor_final',
        nota: 'Facturacion historica (distribucion proporcional de total importado)',
        archivos_adjuntos: [],
        cargado_por: cargadoPor,
        es_historico: true
      })
    }
  }

  if (registros.length === 0) {
    return { inserted: 0 }
  }

  const { data, error } = await supabase
    .from('client_facturacion_cargas')
    .insert(registros)
    .select()

  if (error) throw error
  return { inserted: data.length, data }
}
