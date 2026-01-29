/**
 * Servicio para gestionar facturas pendientes de emisión
 * Maneja la cola de reintentos cuando ARCA está caído o hay problemas de conexión
 */

import { supabase } from '../../../lib/supabase'

// Tipos de comprobante
export const TIPOS_COMPROBANTE = {
  FACTURA_C: 11,
  NOTA_DEBITO_C: 12,
  NOTA_CREDITO_C: 13
}

/**
 * Detecta si un error es de conexión (ARCA caído, sin internet, timeout)
 */
export function esErrorDeConexion(error) {
  const mensaje = error?.message?.toLowerCase() || ''

  const patronesConexion = [
    'network',
    'timeout',
    'econnrefused',
    'enotfound',
    'connection',
    'fetch failed',
    'failed to fetch',
    'net::',
    'socket',
    'dns',
    'unreachable',
    'service unavailable',
    '503',
    '502',
    '504',
    'gateway',
    'no se pudo conectar',
    'sin conexión',
    'afip no disponible',
    'arca no disponible',
    'wsfe',
    'servicio no disponible'
  ]

  return patronesConexion.some(patron => mensaje.includes(patron))
}

/**
 * Guarda una factura en la cola de pendientes
 */
export async function guardarFacturaPendiente({
  userId,
  turnoId,
  tipoComprobante = TIPOS_COMPROBANTE.FACTURA_C,
  datosFactura,
  error
}) {
  const { data, error: dbError } = await supabase
    .from('facturas_pendientes')
    .insert({
      user_id: userId,
      turno_id: turnoId,
      tipo_comprobante: tipoComprobante,
      datos_factura: datosFactura,
      ultimo_error: error?.message || 'Error de conexión',
      intentos: 1,
      estado: 'pendiente'
    })
    .select()
    .single()

  if (dbError) {
    console.error('Error guardando factura pendiente:', dbError)
    throw dbError
  }

  return data
}

/**
 * Obtiene las facturas pendientes de un usuario
 */
export async function obtenerFacturasPendientes(userId) {
  const { data, error } = await supabase
    .from('facturas_pendientes')
    .select(`
      *,
      turno:agenda_turnos(
        id,
        fecha,
        hora_inicio,
        cliente:agenda_clientes(nombre, apellido)
      )
    `)
    .eq('user_id', userId)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error obteniendo facturas pendientes:', error)
    throw error
  }

  return data || []
}

/**
 * Cuenta las facturas pendientes de un usuario
 */
export async function contarFacturasPendientes(userId) {
  const { count, error } = await supabase
    .from('facturas_pendientes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('estado', 'pendiente')

  if (error) {
    console.error('Error contando facturas pendientes:', error)
    return 0
  }

  return count || 0
}

/**
 * Actualiza el estado de una factura pendiente después de un reintento
 */
export async function actualizarIntento(id, { exito, error }) {
  if (exito) {
    // Marcar como emitida exitosamente
    const { error: dbError } = await supabase
      .from('facturas_pendientes')
      .update({
        estado: 'emitido',
        ultimo_intento_at: new Date().toISOString()
      })
      .eq('id', id)

    if (dbError) throw dbError
  } else {
    // Incrementar intentos y actualizar error
    const { error: dbError } = await supabase
      .from('facturas_pendientes')
      .update({
        intentos: supabase.rpc('increment_intentos', { row_id: id }), // O hacerlo manualmente
        ultimo_error: error?.message || 'Error desconocido',
        ultimo_intento_at: new Date().toISOString()
      })
      .eq('id', id)

    // Si falla el RPC, hacerlo con un select + update
    if (dbError) {
      const { data: current } = await supabase
        .from('facturas_pendientes')
        .select('intentos')
        .eq('id', id)
        .single()

      await supabase
        .from('facturas_pendientes')
        .update({
          intentos: (current?.intentos || 0) + 1,
          ultimo_error: error?.message || 'Error desconocido',
          ultimo_intento_at: new Date().toISOString()
        })
        .eq('id', id)
    }
  }
}

/**
 * Descarta una factura pendiente (el usuario decide no reintentar)
 */
export async function descartarFacturaPendiente(id) {
  const { error } = await supabase
    .from('facturas_pendientes')
    .update({ estado: 'descartado' })
    .eq('id', id)

  if (error) {
    console.error('Error descartando factura pendiente:', error)
    throw error
  }
}

/**
 * Elimina una factura pendiente
 */
export async function eliminarFacturaPendiente(id) {
  const { error } = await supabase
    .from('facturas_pendientes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error eliminando factura pendiente:', error)
    throw error
  }
}

/**
 * Obtiene el nombre del tipo de comprobante
 */
export function getNombreTipoComprobante(tipo) {
  switch (tipo) {
    case TIPOS_COMPROBANTE.FACTURA_C:
      return 'Factura C'
    case TIPOS_COMPROBANTE.NOTA_CREDITO_C:
      return 'Nota de Crédito C'
    case TIPOS_COMPROBANTE.NOTA_DEBITO_C:
      return 'Nota de Débito C'
    default:
      return 'Comprobante'
  }
}
