import { supabase } from '../../../lib/supabase'

/**
 * Obtiene la cuota del mes actual para un cliente
 */
export async function getCuotaMesActual(clientId) {
  const ahora = new Date()
  const anio = ahora.getFullYear()
  const mes = ahora.getMonth() + 1

  const { data, error } = await supabase
    .from('client_cuota_mensual')
    .select('*')
    .eq('client_id', clientId)
    .eq('anio', anio)
    .eq('mes', mes)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data
}

/**
 * Crea o actualiza la cuota del mes
 */
export async function upsertCuotaMensual(clientId, anio, mes, datos) {
  const { data, error } = await supabase
    .from('client_cuota_mensual')
    .upsert({
      client_id: clientId,
      anio,
      mes,
      ...datos,
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
 * Marca la cuota como pagada (informada)
 */
export async function marcarCuotaPagada(clientId, anio, mes, userId, fechaPago = null) {
  const { data, error } = await supabase
    .from('client_cuota_mensual')
    .upsert({
      client_id: clientId,
      anio,
      mes,
      estado: 'informada',
      fecha_pago: fechaPago || new Date().toISOString().split('T')[0],
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
 * Sube comprobante de pago
 * Bucket: comprobantes-cuotas
 * Path: <client_id>/<anio>-<mes>_comprobante.<ext>
 */
export async function subirComprobantePago(clientId, anio, mes, file) {
  const fileExt = file.name.split('.').pop().toLowerCase()
  const fileName = `${clientId}/${anio}-${mes.toString().padStart(2, '0')}_comprobante.${fileExt}`

  // Subir archivo al bucket comprobantes-cuotas
  const { error: uploadError } = await supabase.storage
    .from('comprobantes-cuotas')
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type
    })

  if (uploadError) throw uploadError

  // Actualizar registro con URL
  const { data, error } = await supabase
    .from('client_cuota_mensual')
    .update({
      comprobante_url: fileName,
      updated_at: new Date().toISOString()
    })
    .eq('client_id', clientId)
    .eq('anio', anio)
    .eq('mes', mes)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Obtiene URL firmada del comprobante
 */
export async function getComprobanteUrl(path, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from('comprobantes-cuotas')
    .createSignedUrl(path, expiresIn)

  if (error) throw error
  return data.signedUrl
}

/**
 * Calcula el monto de la cuota segun categoria y situacion
 */
export function calcularMontoCuota(categoriaData, tipoActividad, trabajaRelacionDependencia) {
  if (!categoriaData) return 0

  const esServicios = tipoActividad === 'servicios' || tipoActividad === 'ambos'

  if (trabajaRelacionDependencia) {
    // Solo paga impuesto integrado
    return esServicios
      ? parseFloat(categoriaData.impuesto_integrado_servicios || 0)
      : parseFloat(categoriaData.impuesto_integrado_productos || 0)
  } else {
    // Paga cuota completa
    return esServicios
      ? parseFloat(categoriaData.cuota_total_servicios || 0)
      : parseFloat(categoriaData.cuota_total_productos || 0)
  }
}

/**
 * Calcula el estado del vencimiento
 * Retorna: { estado, diasRestantes, color, mensaje }
 */
export function calcularEstadoVencimiento() {
  // Obtener fecha actual en UTC-3 (Argentina)
  const ahora = new Date()
  const ahoraArg = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }))

  const diaActual = ahoraArg.getDate()
  const diaVencimiento = 20

  if (diaActual > diaVencimiento) {
    return {
      estado: 'vencido',
      diasRestantes: 0,
      color: 'red',
      mensaje: 'Vencido'
    }
  }

  const diasRestantes = diaVencimiento - diaActual

  if (diasRestantes <= 3) {
    return {
      estado: 'urgente',
      diasRestantes,
      color: 'red',
      mensaje: diasRestantes === 0 ? 'Vence hoy' : `Vence en ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`
    }
  }

  if (diasRestantes <= 7) {
    return {
      estado: 'proximo',
      diasRestantes,
      color: 'yellow',
      mensaje: `Vence en ${diasRestantes} dias`
    }
  }

  return {
    estado: 'tiempo',
    diasRestantes,
    color: 'green',
    mensaje: `Vence el 20 (${diasRestantes} dias)`
  }
}

/**
 * Obtiene el nombre del mes actual
 */
export function getMesActualNombre() {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  const ahora = new Date()
  return meses[ahora.getMonth()]
}
