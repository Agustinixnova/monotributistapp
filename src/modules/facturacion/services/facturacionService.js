import { supabase } from '../../../lib/supabase'

/**
 * Servicio de facturación mensual
 */

// Obtener facturación mensual de un cliente
export async function getFacturacionCliente(clientId, limit = 12) {
  const { data, error } = await supabase
    .from('client_facturacion_mensual')
    .select(`
      *,
      cargado_por_profile:profiles!cargado_por(nombre, apellido),
      revisado_por_profile:profiles!revisado_por(nombre, apellido)
    `)
    .eq('client_id', clientId)
    .order('anio', { ascending: false })
    .order('mes', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// Obtener facturación de un mes específico
export async function getFacturacionMes(clientId, anio, mes) {
  const { data, error } = await supabase
    .from('client_facturacion_mensual')
    .select(`
      *,
      facturas_detalle:client_facturas_detalle(*)
    `)
    .eq('client_id', clientId)
    .eq('anio', anio)
    .eq('mes', mes)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
  return data
}

// Crear facturación mensual
export async function createFacturacionMensual(data) {
  const { data: result, error } = await supabase
    .from('client_facturacion_mensual')
    .insert({
      client_id: data.clientId,
      anio: data.anio,
      mes: data.mes,
      monto_declarado: data.montoDeclarado,
      cantidad_facturas: data.cantidadFacturas || 0,
      tipo_carga: data.tipoCarga || 'total',
      archivos_adjuntos: data.archivosAdjuntos || [],
      cargado_por: data.cargadoPor
    })
    .select()
    .single()

  if (error) throw error
  return result
}

// Actualizar facturación mensual
export async function updateFacturacionMensual(id, data) {
  const updateData = {}

  if (data.montoDeclarado !== undefined) updateData.monto_declarado = data.montoDeclarado
  if (data.montoAjustado !== undefined) updateData.monto_ajustado = data.montoAjustado
  if (data.cantidadFacturas !== undefined) updateData.cantidad_facturas = data.cantidadFacturas
  if (data.archivosAdjuntos !== undefined) updateData.archivos_adjuntos = data.archivosAdjuntos
  if (data.estadoRevision !== undefined) {
    updateData.estado_revision = data.estadoRevision
    if (data.estadoRevision === 'revisado' || data.estadoRevision === 'observado') {
      updateData.revisado_por = data.revisadoPor
      updateData.revisado_at = new Date().toISOString()
    }
  }
  if (data.notaRevision !== undefined) updateData.nota_revision = data.notaRevision
  if (data.estado !== undefined) {
    updateData.estado = data.estado
    if (data.estado === 'cerrado') {
      updateData.cerrado_por = data.cerradoPor
      updateData.cerrado_at = new Date().toISOString()
    }
  }

  const { data: result, error } = await supabase
    .from('client_facturacion_mensual')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return result
}

// Eliminar facturación mensual
export async function deleteFacturacionMensual(id) {
  const { error } = await supabase
    .from('client_facturacion_mensual')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

// Obtener acumulado de 12 meses
export async function getAcumulado12Meses(clientId) {
  // Calcular fecha de hace 12 meses
  const hoy = new Date()
  const hace12Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1)
  const anioInicio = hace12Meses.getFullYear()
  const mesInicio = hace12Meses.getMonth() + 1

  const { data, error } = await supabase
    .from('client_facturacion_mensual')
    .select('monto_declarado, monto_ajustado, anio, mes')
    .eq('client_id', clientId)
    .or(`anio.gt.${anioInicio},and(anio.eq.${anioInicio},mes.gte.${mesInicio})`)

  if (error) throw error

  // Sumar usando monto_ajustado si existe, sino monto_declarado
  const total = (data || []).reduce((sum, item) => {
    const monto = item.monto_ajustado ?? item.monto_declarado ?? 0
    return sum + parseFloat(monto)
  }, 0)

  return {
    total,
    meses: data || [],
    periodoDesde: `${mesInicio}/${anioInicio}`,
    periodoHasta: `${hoy.getMonth() + 1}/${hoy.getFullYear()}`
  }
}

// Obtener todos los clientes con su resumen de facturación (para contadora)
export async function getResumenTodosClientes() {
  // Primero obtener todos los clientes con datos fiscales
  const { data: clientes, error: errorClientes } = await supabase
    .from('client_fiscal_data')
    .select(`
      id,
      cuit,
      razon_social,
      categoria_monotributo,
      tipo_actividad,
      gestion_facturacion,
      user:profiles!user_id(id, nombre, apellido, email)
    `)
    .eq('tipo_contribuyente', 'monotributista')

  if (errorClientes) throw errorClientes

  // Para cada cliente, obtener su acumulado y último mes
  const clientesConResumen = await Promise.all(
    clientes.map(async (cliente) => {
      const acumulado = await getAcumulado12Meses(cliente.id)
      const ultimoMes = await getUltimoMesCargado(cliente.id)

      return {
        ...cliente,
        acumulado12Meses: acumulado.total,
        ultimoMesCargado: ultimoMes
      }
    })
  )

  return clientesConResumen
}

// Obtener último mes cargado
export async function getUltimoMesCargado(clientId) {
  const { data, error } = await supabase
    .from('client_facturacion_mensual')
    .select('*')
    .eq('client_id', clientId)
    .order('anio', { ascending: false })
    .order('mes', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// =============================================
// Facturas Detalle
// =============================================

export async function createFacturaDetalle(data) {
  const { data: result, error } = await supabase
    .from('client_facturas_detalle')
    .insert({
      facturacion_mensual_id: data.facturacionMensualId,
      fecha_emision: data.fechaEmision,
      tipo_comprobante: data.tipoComprobante,
      punto_venta: data.puntoVenta,
      numero_comprobante: data.numeroComprobante,
      receptor_razon_social: data.receptorRazonSocial,
      receptor_cuit: data.receptorCuit,
      importe_total: data.importeTotal,
      descripcion: data.descripcion,
      archivo_url: data.archivoUrl
    })
    .select()
    .single()

  if (error) throw error
  return result
}

export async function getFacturasDetalle(facturacionMensualId) {
  const { data, error } = await supabase
    .from('client_facturas_detalle')
    .select('*')
    .eq('facturacion_mensual_id', facturacionMensualId)
    .order('fecha_emision', { ascending: true })

  if (error) throw error
  return data
}

export async function deleteFacturaDetalle(id) {
  const { error } = await supabase
    .from('client_facturas_detalle')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
