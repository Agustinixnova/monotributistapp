/**
 * Servicio para gestionar links de reserva
 */

import { supabase } from '../../../lib/supabase'
import { generateShortToken } from '../utils/tokenGenerator'

/**
 * Crear un nuevo link de reserva
 * @param {Object} datos - Datos del link
 * @param {string} datos.cliente_id - ID del cliente (opcional)
 * @param {string[]} datos.servicios_ids - Array de IDs de servicios habilitados
 * @param {string} datos.fecha_desde - Fecha inicial (YYYY-MM-DD)
 * @param {string} datos.fecha_hasta - Fecha final (YYYY-MM-DD)
 * @param {Object} datos.slots_disponibles - Slots por fecha { "2025-01-29": ["08:00", "08:30"], ... }
 * @param {string} datos.mensaje_personalizado - Mensaje opcional
 * @param {number} datos.horas_expiracion - Horas hasta expiración (default: 48)
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function crearLink(datos) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const token = generateShortToken()
    const horasExpiracion = datos.horas_expiracion || 48
    const expiresAt = new Date(Date.now() + horasExpiracion * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('agenda_reserva_links')
      .insert({
        token,
        profesional_id: user.id,
        cliente_id: datos.cliente_id || null,
        servicios_ids: datos.servicios_ids || [],
        fecha_desde: datos.fecha_desde,
        fecha_hasta: datos.fecha_hasta,
        slots_disponibles: datos.slots_disponibles || {},
        mensaje_personalizado: datos.mensaje_personalizado || null,
        expires_at: expiresAt
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creando link de reserva:', error)
    return { data: null, error }
  }
}

/**
 * Obtener links del profesional actual
 * @param {Object} filtros - Filtros opcionales
 * @param {string} filtros.estado - Filtrar por estado (activo, usado, expirado)
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getLinks(filtros = {}) {
  try {
    let query = supabase
      .from('agenda_reserva_links')
      .select(`
        *,
        cliente:agenda_clientes(id, nombre, apellido, telefono)
      `)
      .order('created_at', { ascending: false })

    if (filtros.estado) {
      query = query.eq('estado', filtros.estado)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error obteniendo links:', error)
    return { data: null, error }
  }
}

/**
 * Obtener un link por token (público, sin auth)
 * @param {string} token - Token del link
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getLinkByToken(token) {
  try {
    const { data, error } = await supabase
      .from('agenda_reserva_links')
      .select(`
        *,
        cliente:agenda_clientes(id, nombre, apellido, telefono, email)
      `)
      .eq('token', token)
      .single()

    if (error) throw error

    // Verificar si expiró
    if (data && new Date(data.expires_at) < new Date()) {
      // Marcar como expirado si aún no lo está
      if (data.estado === 'activo') {
        await supabase
          .from('agenda_reserva_links')
          .update({ estado: 'expirado' })
          .eq('id', data.id)
        data.estado = 'expirado'
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error obteniendo link por token:', error)
    return { data: null, error }
  }
}

/**
 * Obtener datos del negocio para la página pública de reserva
 * @param {string} profesionalId - ID del profesional
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getNegocioPublico(profesionalId) {
  try {
    const { data, error } = await supabase
      .from('agenda_negocio')
      .select('nombre_negocio, descripcion, telefono, whatsapp, direccion, localidad, provincia, instagram, web, horario_atencion')
      .eq('user_id', profesionalId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error obteniendo negocio público:', error)
    return { data: null, error }
  }
}

/**
 * Obtener servicios habilitados en el link
 * @param {string[]} serviciosIds - Array de IDs de servicios
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getServiciosByIds(serviciosIds) {
  try {
    if (!serviciosIds || serviciosIds.length === 0) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('agenda_servicios')
      .select('id, nombre, duracion_minutos, precio, precio_variable')
      .in('id', serviciosIds)
      .eq('activo', true)

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error obteniendo servicios:', error)
    return { data: null, error }
  }
}

/**
 * Usar el link para crear una reserva (público, sin auth)
 * @param {string} linkId - ID del link
 * @param {Object} reserva - Datos de la reserva
 * @param {string} reserva.fecha - Fecha de la reserva (YYYY-MM-DD)
 * @param {string} reserva.hora - Hora de inicio (HH:MM)
 * @param {string[]} reserva.servicios_ids - Array de IDs de servicios seleccionados
 * @param {Object} reserva.cliente_datos - Datos del cliente si no está registrado
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function usarLink(linkId, reserva) {
  try {
    // Usar función RPC con SECURITY DEFINER para bypassear RLS
    const { data, error } = await supabase.rpc('crear_reserva_publica', {
      p_link_id: linkId,
      p_fecha: reserva.fecha,
      p_hora: reserva.hora,
      p_servicios_ids: reserva.servicios_ids,
      p_cliente_nombre: reserva.cliente_datos?.nombre || null,
      p_cliente_apellido: reserva.cliente_datos?.apellido || null,
      p_cliente_telefono: reserva.cliente_datos?.telefono || null,
      p_cliente_email: reserva.cliente_datos?.email || null
    })

    if (error) throw error

    // La función devuelve un JSON con success y error o turno_id
    if (!data.success) {
      throw new Error(data.error || 'Error al crear la reserva')
    }

    return { data: { turno_id: data.turno_id }, error: null }
  } catch (error) {
    console.error('Error usando link de reserva:', error)
    return { data: null, error }
  }
}

/**
 * Cancelar/eliminar un link
 * @param {string} linkId - ID del link
 * @returns {Promise<{success: boolean, error: Error}>}
 */
export async function eliminarLink(linkId) {
  try {
    const { error } = await supabase
      .from('agenda_reserva_links')
      .delete()
      .eq('id', linkId)

    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    console.error('Error eliminando link:', error)
    return { success: false, error }
  }
}

/**
 * Verificar disponibilidad de slots (considerando turnos existentes)
 * @param {string} profesionalId - ID del profesional
 * @param {string} fecha - Fecha a verificar (YYYY-MM-DD)
 * @param {string[]} slotsOriginales - Slots que el profesional marcó como disponibles
 * @returns {Promise<{data: string[], error: Error}>} Slots que aún están libres
 */
export async function verificarDisponibilidad(profesionalId, fecha, slotsOriginales) {
  try {
    // Obtener turnos del día (excluir cancelados y no asistió)
    const { data: turnos, error } = await supabase
      .from('agenda_turnos')
      .select('hora_inicio, hora_fin')
      .eq('duenio_id', profesionalId)
      .eq('fecha', fecha)
      .not('estado', 'in', '(cancelado,no_asistio)')

    if (error) throw error

    // Filtrar slots que ya están ocupados
    const slotsLibres = slotsOriginales.filter(slot => {
      const [h, m] = slot.split(':').map(Number)
      const slotMinutos = h * 60 + m

      // Verificar si este slot colisiona con algún turno
      for (const turno of turnos) {
        const [hInicio, mInicio] = turno.hora_inicio.split(':').map(Number)
        const [hFin, mFin] = turno.hora_fin.split(':').map(Number)
        const turnoInicio = hInicio * 60 + mInicio
        const turnoFin = hFin * 60 + mFin

        // Si el slot está dentro del rango del turno, no está disponible
        if (slotMinutos >= turnoInicio && slotMinutos < turnoFin) {
          return false
        }
      }

      return true
    })

    return { data: slotsLibres, error: null }
  } catch (error) {
    console.error('Error verificando disponibilidad:', error)
    return { data: null, error }
  }
}

export default {
  crearLink,
  getLinks,
  getLinkByToken,
  getNegocioPublico,
  getServiciosByIds,
  usarLink,
  eliminarLink,
  verificarDisponibilidad
}
