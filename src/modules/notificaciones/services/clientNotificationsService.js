import { supabase } from '../../../lib/supabase'

/**
 * Servicio para gestionar notificaciones de clientes
 * Tabla: client_notifications
 */

/**
 * Obtener notificaciones de un cliente
 * @param {string} clientId - ID del cliente (client_fiscal_data.id)
 * @param {Object} options - Opciones de filtrado
 * @returns {Promise<Array>} - Lista de notificaciones
 */
export async function getClientNotifications(clientId, options = {}) {
  const { activeOnly = false, limit = 50 } = options

  try {
    let query = supabase
      .from('client_notifications')
      .select(`
        *,
        created_by_profile:profiles!created_by(nombre, apellido)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error obteniendo notificaciones del cliente:', error)
    throw error
  }
}

/**
 * Crear una nueva notificación para el cliente
 * @param {Object} notificationData - Datos de la notificación
 * @returns {Promise<Object>} - Notificación creada
 */
export async function createNotification(notificationData) {
  try {
    const { data, error } = await supabase
      .from('client_notifications')
      .insert({
        client_id: notificationData.clientId,
        tipo: notificationData.tipo || 'info',
        titulo: notificationData.titulo,
        mensaje: notificationData.mensaje,
        prioridad: notificationData.prioridad || 'normal',
        fecha_vencimiento: notificationData.fechaVencimiento || null,
        is_active: true,
        created_by: notificationData.createdBy
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creando notificación:', error)
    throw error
  }
}

/**
 * Actualizar una notificación
 * @param {string} notificationId - ID de la notificación
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} - Notificación actualizada
 */
export async function updateNotification(notificationId, updates) {
  try {
    const { data, error } = await supabase
      .from('client_notifications')
      .update(updates)
      .eq('id', notificationId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error actualizando notificación:', error)
    throw error
  }
}

/**
 * Eliminar (desactivar) una notificación
 * @param {string} notificationId - ID de la notificación
 * @returns {Promise<boolean>} - Éxito de la operación
 */
export async function deleteNotification(notificationId) {
  try {
    const { error } = await supabase
      .from('client_notifications')
      .update({ is_active: false })
      .eq('id', notificationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error eliminando notificación:', error)
    throw error
  }
}

/**
 * Marcar notificación como leída
 * @param {string} notificationId - ID de la notificación
 * @returns {Promise<boolean>} - Éxito de la operación
 */
export async function markAsRead(notificationId) {
  try {
    const { error } = await supabase
      .from('client_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error marcando notificación como leída:', error)
    throw error
  }
}

// Alias para compatibilidad con código existente
export const getAllNotificationsForClient = getClientNotifications
