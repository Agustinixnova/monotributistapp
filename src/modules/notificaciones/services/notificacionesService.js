import { supabase } from '../../../lib/supabase'

export async function getNotificaciones(limit = 50, offset = 0, soloNoLeidas = false) {
  let query = supabase
    .from('notificaciones')
    .select(`
      *,
      cliente:client_fiscal_data(
        id, razon_social, cuit,
        user:profiles!user_id(nombre, apellido)
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (soloNoLeidas) {
    query = query.eq('leida', false)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getCountNoLeidas() {
  const { count, error } = await supabase
    .from('notificaciones')
    .select('*', { count: 'exact', head: true })
    .eq('leida', false)

  if (error) throw error
  return count || 0
}

export async function marcarLeida(notificacionId) {
  const { data, error } = await supabase.rpc('marcar_notificacion_leida', {
    p_notificacion_id: notificacionId
  })
  if (error) throw error
  return data
}

export async function marcarTodasLeidas() {
  const { data, error } = await supabase.rpc('marcar_todas_notificaciones_leidas')
  if (error) throw error
  return data
}

export function suscribirseNotificaciones(userId, callback) {
  const subscription = supabase
    .channel('notificaciones_nuevas')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notificaciones',
      filter: `destinatario_id=eq.${userId}`
    }, (payload) => callback(payload.new))
    .subscribe()

  return () => subscription.unsubscribe()
}

/**
 * Genera notificaciones para clientes con coeficientes IIBB desactualizados
 * Llama a la función SQL que verifica y crea las notificaciones
 * @returns {Promise<number>} Cantidad de notificaciones creadas
 */
export async function verificarIibbDesactualizados() {
  const { data, error } = await supabase.rpc('generar_notificaciones_iibb')
  if (error) throw error
  return data || 0
}
