import { supabase } from '../../../lib/supabase'

/**
 * Crea una nueva conversacion
 */
export async function crearConversacion(userId, asunto, contenido, origen = 'general', origenReferencia = null, adjuntos = []) {
  const { data, error } = await supabase
    .rpc('crear_conversacion_buzon', {
      p_iniciado_por: userId,
      p_asunto: asunto,
      p_contenido: contenido,
      p_origen: origen,
      p_origen_referencia: origenReferencia,
      p_adjuntos: adjuntos
    })

  if (error) throw error
  return data // Retorna el ID de la conversacion
}

/**
 * Responde a una conversacion existente
 */
export async function responderConversacion(conversacionId, userId, contenido) {
  const { data, error } = await supabase
    .rpc('responder_conversacion', {
      p_conversacion_id: conversacionId,
      p_user_id: userId,
      p_contenido: contenido
    })

  if (error) throw error
  return data
}

/**
 * Obtiene las conversaciones del usuario
 */
export async function getConversaciones(userId, estado = null) {
  let query = supabase
    .from('buzon_participantes')
    .select(`
      conversacion_id,
      leido,
      ultimo_leido_at,
      buzon_conversaciones (
        id,
        asunto,
        origen,
        estado,
        ultimo_mensaje_at,
        created_at,
        iniciado_por,
        profiles!buzon_conversaciones_iniciado_por_fkey (
          id,
          nombre,
          apellido,
          email
        )
      )
    `)
    .eq('user_id', userId)
    .order('buzon_conversaciones(ultimo_mensaje_at)', { ascending: false })

  if (estado) {
    query = query.eq('buzon_conversaciones.estado', estado)
  }

  const { data, error } = await query

  if (error) throw error

  // Transformar datos para facilitar uso
  return data.map(p => ({
    id: p.buzon_conversaciones.id,
    asunto: p.buzon_conversaciones.asunto,
    origen: p.buzon_conversaciones.origen,
    estado: p.buzon_conversaciones.estado,
    ultimoMensaje: p.buzon_conversaciones.ultimo_mensaje_at,
    createdAt: p.buzon_conversaciones.created_at,
    leido: p.leido,
    iniciadoPor: p.buzon_conversaciones.profiles
  }))
}

/**
 * Obtiene una conversacion con todos sus mensajes
 */
export async function getConversacion(conversacionId) {
  // Obtener conversacion
  const { data: conversacion, error: errorConv } = await supabase
    .from('buzon_conversaciones')
    .select(`
      *,
      profiles!buzon_conversaciones_iniciado_por_fkey (
        id,
        nombre,
        apellido,
        email
      )
    `)
    .eq('id', conversacionId)
    .single()

  if (errorConv) throw errorConv

  // Obtener mensajes
  const { data: mensajes, error: errorMsg } = await supabase
    .from('buzon_mensajes')
    .select(`
      *,
      profiles!buzon_mensajes_enviado_por_fkey (
        id,
        nombre,
        apellido,
        email,
        roles (name)
      )
    `)
    .eq('conversacion_id', conversacionId)
    .order('created_at', { ascending: true })

  if (errorMsg) throw errorMsg

  return {
    ...conversacion,
    iniciadoPor: conversacion.profiles,
    mensajes: mensajes.map(m => ({
      ...m,
      enviadoPor: m.profiles
    }))
  }
}

/**
 * Marca una conversacion como leida
 */
export async function marcarComoLeida(conversacionId, userId) {
  const { error } = await supabase
    .from('buzon_participantes')
    .update({
      leido: true,
      ultimo_leido_at: new Date().toISOString()
    })
    .eq('conversacion_id', conversacionId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Obtiene cantidad de mensajes no leidos
 */
export async function getNoLeidosCount(userId) {
  const { count, error } = await supabase
    .from('buzon_participantes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('leido', false)

  if (error) throw error
  return count || 0
}

/**
 * Cierra una conversacion (solo contadoras)
 */
export async function cerrarConversacion(conversacionId) {
  const { error } = await supabase
    .from('buzon_conversaciones')
    .update({ estado: 'cerrada', updated_at: new Date().toISOString() })
    .eq('id', conversacionId)

  if (error) throw error
}

/**
 * Reabre una conversacion
 */
export async function reabrirConversacion(conversacionId) {
  const { error } = await supabase
    .from('buzon_conversaciones')
    .update({ estado: 'abierta', updated_at: new Date().toISOString() })
    .eq('id', conversacionId)

  if (error) throw error
}

/**
 * Crea una conversacion con destinatarios especificos (para contadoras)
 */
export async function crearConversacionConDestinatarios(
  userId,
  asunto,
  contenido,
  destinatarios = [],
  origen = 'general',
  origenReferencia = null,
  adjuntos = []
) {
  const { data, error } = await supabase
    .rpc('crear_conversacion_con_destinatarios', {
      p_iniciado_por: userId,
      p_asunto: asunto,
      p_contenido: contenido,
      p_destinatarios: destinatarios.length > 0 ? destinatarios : null,
      p_origen: origen,
      p_origen_referencia: origenReferencia,
      p_adjuntos: adjuntos
    })

  if (error) throw error
  return data // Retorna el ID de la conversacion
}

/**
 * Obtiene la lista de clientes que una contadora puede contactar
 */
export async function getClientesParaMensajes(contadorId) {
  const { data, error } = await supabase
    .rpc('get_clientes_para_mensajes', {
      p_contador_id: contadorId
    })

  if (error) throw error
  return data || []
}
