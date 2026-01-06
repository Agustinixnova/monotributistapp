import { supabase } from '../../../lib/supabase'

/**
 * Servicio de facturacion mensual
 * NUEVO MODELO: Usa client_facturacion_cargas y client_facturacion_mensual_resumen
 */

// Obtener todas las cargas de un cliente (ordenadas por fecha)
export async function getFacturacionCliente(clientId, limit = 50) {
  const { data, error } = await supabase
    .from('client_facturacion_cargas')
    .select(`
      *,
      cargado_por_profile:profiles!cargado_por(nombre, apellido)
    `)
    .eq('client_id', clientId)
    .order('anio', { ascending: false })
    .order('mes', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// Obtener cargas de un mes especifico (multiples registros)
export async function getFacturacionMes(clientId, anio, mes) {
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
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

// Obtener totales agrupados por mes (desde la tabla resumen)
export async function getTotalesPorMes(clientId, meses = 12) {
  // Obtener resumenes desde la tabla de resumenes
  const { data: resumenes, error: errorResumenes } = await supabase
    .from('client_facturacion_mensual_resumen')
    .select('anio, mes, total_neto, total_facturas, total_notas_credito, total_notas_debito, cantidad_comprobantes')
    .eq('client_id', clientId)
    .order('anio', { ascending: false })
    .order('mes', { ascending: false })

  if (errorResumenes) throw errorResumenes

  // Inicializar ultimos N meses con 0
  const totalesPorMes = {}
  const hoy = new Date()

  for (let i = 0; i < meses; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const key = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`
    totalesPorMes[key] = {
      anio: fecha.getFullYear(),
      mes: fecha.getMonth() + 1,
      total: 0,
      cantidadCargas: 0,
      cantidadComprobantes: 0
    }
  }

  // Llenar con datos de resumenes
  for (const resumen of resumenes || []) {
    const key = `${resumen.anio}-${resumen.mes}`
    if (totalesPorMes[key]) {
      totalesPorMes[key].total = parseFloat(resumen.total_neto || 0)
      totalesPorMes[key].cantidadCargas = 1 // Al menos hay cargas si hay resumen
      totalesPorMes[key].cantidadComprobantes = resumen.cantidad_comprobantes || 0
    }
  }

  // Convertir a array ordenado
  return Object.values(totalesPorMes).sort((a, b) => {
    if (a.anio !== b.anio) return b.anio - a.anio
    return b.mes - a.mes
  })
}

// Crear una nueva carga de facturacion (compatible con el modelo anterior)
export async function createFacturacionMensual(data) {
  const { data: result, error } = await supabase
    .from('client_facturacion_cargas')
    .insert({
      client_id: data.clientId,
      anio: data.anio,
      mes: data.mes,
      fecha_emision: data.fechaCarga || new Date().toISOString().split('T')[0],
      tipo_comprobante: data.tipoComprobante || 'FC',
      letra_comprobante: data.letraComprobante || 'C',
      monto: Math.abs(data.monto),
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

// Actualizar una carga de facturacion
export async function updateFacturacionMensual(id, data) {
  const updateData = {}

  if (data.monto !== undefined) updateData.monto = Math.abs(data.monto)
  if (data.fechaCarga !== undefined) updateData.fecha_emision = data.fechaCarga
  if (data.cantidadComprobantes !== undefined) updateData.cantidad_comprobantes = data.cantidadComprobantes
  if (data.nota !== undefined) updateData.nota = data.nota
  if (data.archivosAdjuntos !== undefined) updateData.archivos_adjuntos = data.archivosAdjuntos
  if (data.tipoComprobante !== undefined) updateData.tipo_comprobante = data.tipoComprobante
  if (data.letraComprobante !== undefined) updateData.letra_comprobante = data.letraComprobante

  const { data: result, error } = await supabase
    .from('client_facturacion_cargas')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return result
}

// Eliminar una carga de facturacion
export async function deleteFacturacionMensual(id) {
  const { error } = await supabase
    .from('client_facturacion_cargas')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

// Obtener acumulado de 12 meses (desde tabla resumen)
export async function getAcumulado12Meses(clientId) {
  const hoy = new Date()
  const hace12Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1)
  const anioInicio = hace12Meses.getFullYear()
  const mesInicio = hace12Meses.getMonth() + 1

  const { data, error } = await supabase
    .from('client_facturacion_mensual_resumen')
    .select('total_neto, total_facturas, total_notas_credito, total_notas_debito, cantidad_comprobantes, anio, mes')
    .eq('client_id', clientId)
    .or(`anio.gt.${anioInicio},and(anio.eq.${anioInicio},mes.gte.${mesInicio})`)

  if (error) throw error

  // Sumar todos los totales netos
  const total = (data || []).reduce((sum, item) => {
    return sum + parseFloat(item.total_neto || 0)
  }, 0)

  return {
    total,
    cargas: data || [],
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

  // Para cada cliente, obtener su acumulado y última carga
  const clientesConResumen = await Promise.all(
    clientes.map(async (cliente) => {
      const acumulado = await getAcumulado12Meses(cliente.id)
      const ultimaCarga = await getUltimaCarga(cliente.id)

      return {
        ...cliente,
        acumulado12Meses: acumulado.total,
        ultimaCarga
      }
    })
  )

  return clientesConResumen
}

// Obtener última carga (sin importar el mes)
export async function getUltimaCarga(clientId) {
  const { data, error } = await supabase
    .from('client_facturacion_cargas')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// =============================================
// Facturas Detalle (se mantiene para carga detallada)
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
