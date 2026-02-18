/**
 * Servicio para gestionar espacios/salones
 * Solo se usa en modo "espacios"
 */

import { supabase } from '../../../lib/supabase'

/**
 * Colores predefinidos para espacios
 */
export const COLORES_ESPACIOS = [
  { id: '#6366F1', nombre: 'Índigo' },
  { id: '#EC4899', nombre: 'Rosa' },
  { id: '#10B981', nombre: 'Esmeralda' },
  { id: '#F59E0B', nombre: 'Ámbar' },
  { id: '#3B82F6', nombre: 'Azul' },
  { id: '#8B5CF6', nombre: 'Violeta' },
  { id: '#EF4444', nombre: 'Rojo' },
  { id: '#14B8A6', nombre: 'Teal' }
]

/**
 * Obtener todos los espacios del usuario
 */
export async function getEspacios() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('agenda_espacios')
      .select('*')
      .eq('user_id', user.id)
      .order('orden', { ascending: true })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error obteniendo espacios:', error)
    return { data: [], error }
  }
}

/**
 * Obtener solo espacios activos
 */
export async function getEspaciosActivos() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('agenda_espacios')
      .select('*')
      .eq('user_id', user.id)
      .eq('activo', true)
      .order('orden', { ascending: true })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error obteniendo espacios activos:', error)
    return { data: [], error }
  }
}

/**
 * Obtener un espacio por ID
 */
export async function getEspacioById(id) {
  try {
    const { data, error } = await supabase
      .from('agenda_espacios')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error obteniendo espacio:', error)
    return { data: null, error }
  }
}

/**
 * Crear un nuevo espacio
 */
export async function createEspacio(espacioData) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    // Obtener el máximo orden actual
    const { data: espacios } = await supabase
      .from('agenda_espacios')
      .select('orden')
      .eq('user_id', user.id)
      .order('orden', { ascending: false })
      .limit(1)

    const maxOrden = espacios?.[0]?.orden ?? -1

    const dataToInsert = {
      ...espacioData,
      user_id: user.id,
      orden: maxOrden + 1
    }

    const { data, error } = await supabase
      .from('agenda_espacios')
      .insert(dataToInsert)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creando espacio:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar un espacio
 */
export async function updateEspacio(id, espacioData) {
  try {
    // Eliminar campos que no se deben actualizar
    const { user_id, created_at, ...dataToUpdate } = espacioData

    const { data, error } = await supabase
      .from('agenda_espacios')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error actualizando espacio:', error)
    return { data: null, error }
  }
}

/**
 * Eliminar un espacio
 */
export async function deleteEspacio(id) {
  try {
    const { error } = await supabase
      .from('agenda_espacios')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error eliminando espacio:', error)
    return { success: false, error }
  }
}

/**
 * Reordenar espacios
 */
export async function reordenarEspacios(espaciosOrdenados) {
  try {
    // espaciosOrdenados = [{ id, orden }, ...]
    const promises = espaciosOrdenados.map(({ id, orden }) =>
      supabase
        .from('agenda_espacios')
        .update({ orden })
        .eq('id', id)
    )

    await Promise.all(promises)

    return { success: true, error: null }
  } catch (error) {
    console.error('Error reordenando espacios:', error)
    return { success: false, error }
  }
}

/**
 * Verificar si un espacio está disponible en un rango de tiempo
 */
export async function verificarDisponibilidadEspacio(espacioId, fecha, horaInicio, horaFin, excluirTurnoId = null) {
  try {
    let query = supabase
      .from('agenda_turnos')
      .select('id, hora_inicio, hora_fin')
      .eq('espacio_id', espacioId)
      .eq('fecha', fecha)
      .neq('estado', 'cancelado')

    if (excluirTurnoId) {
      query = query.neq('id', excluirTurnoId)
    }

    const { data: turnos, error } = await query

    if (error) throw error

    // Verificar si hay solapamiento
    const haySolapamiento = turnos?.some(turno => {
      const turnoInicio = turno.hora_inicio
      const turnoFin = turno.hora_fin

      // Hay solapamiento si:
      // - El nuevo turno empieza durante un turno existente
      // - El nuevo turno termina durante un turno existente
      // - El nuevo turno contiene un turno existente
      return (
        (horaInicio >= turnoInicio && horaInicio < turnoFin) ||
        (horaFin > turnoInicio && horaFin <= turnoFin) ||
        (horaInicio <= turnoInicio && horaFin >= turnoFin)
      )
    })

    return {
      disponible: !haySolapamiento,
      turnosExistentes: turnos || [],
      error: null
    }
  } catch (error) {
    console.error('Error verificando disponibilidad:', error)
    return { disponible: false, error }
  }
}
