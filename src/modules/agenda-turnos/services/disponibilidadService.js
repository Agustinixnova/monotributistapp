/**
 * Servicio para gestión de disponibilidad horaria
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from '../../caja-diaria/services/empleadosService'

const DIAS_SEMANA = [
  { id: 0, nombre: 'Domingo', corto: 'Dom' },
  { id: 1, nombre: 'Lunes', corto: 'Lun' },
  { id: 2, nombre: 'Martes', corto: 'Mar' },
  { id: 3, nombre: 'Miércoles', corto: 'Mié' },
  { id: 4, nombre: 'Jueves', corto: 'Jue' },
  { id: 5, nombre: 'Viernes', corto: 'Vie' },
  { id: 6, nombre: 'Sábado', corto: 'Sáb' }
]

export { DIAS_SEMANA }

/**
 * Obtiene la disponibilidad de un profesional
 */
export async function getDisponibilidad(profesionalId = null) {
  const { userId } = await getEffectiveUserId()
  const targetId = profesionalId || userId

  const { data, error } = await supabase
    .from('agenda_disponibilidad')
    .select('*')
    .eq('profesional_id', targetId)
    .order('dia_semana', { ascending: true })

  return { data, error }
}

/**
 * Guarda la disponibilidad completa de un profesional
 */
export async function guardarDisponibilidad(disponibilidad, profesionalId = null) {
  const { userId } = await getEffectiveUserId()
  const targetId = profesionalId || userId

  // Eliminar disponibilidad existente
  await supabase
    .from('agenda_disponibilidad')
    .delete()
    .eq('profesional_id', targetId)

  // Insertar nueva disponibilidad
  const registros = disponibilidad
    .filter(d => d.activo)
    .map(d => ({
      profesional_id: targetId,
      dia_semana: d.dia_semana,
      hora_inicio: d.hora_inicio,
      hora_fin: d.hora_fin,
      activo: true
    }))

  if (registros.length === 0) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('agenda_disponibilidad')
    .insert(registros)
    .select()

  return { data, error }
}

/**
 * Obtiene las excepciones de un profesional (feriados, vacaciones, etc)
 */
export async function getExcepciones(profesionalId = null, fechaInicio = null, fechaFin = null) {
  const { userId } = await getEffectiveUserId()
  const targetId = profesionalId || userId

  let query = supabase
    .from('agenda_excepciones')
    .select('*')
    .eq('profesional_id', targetId)
    .order('fecha', { ascending: true })

  if (fechaInicio) {
    query = query.gte('fecha', fechaInicio)
  }
  if (fechaFin) {
    query = query.lte('fecha', fechaFin)
  }

  const { data, error } = await query

  return { data, error }
}

/**
 * Crea una excepción de disponibilidad
 */
export async function crearExcepcion(excepcionData, profesionalId = null) {
  const { userId } = await getEffectiveUserId()
  const targetId = profesionalId || userId

  const { data, error } = await supabase
    .from('agenda_excepciones')
    .insert({
      profesional_id: targetId,
      fecha: excepcionData.fecha,
      todo_el_dia: excepcionData.todo_el_dia ?? true,
      hora_inicio: excepcionData.hora_inicio || null,
      hora_fin: excepcionData.hora_fin || null,
      motivo: excepcionData.motivo || null,
      tipo: excepcionData.tipo || 'bloqueo'
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Elimina una excepción
 */
export async function eliminarExcepcion(excepcionId) {
  const { error } = await supabase
    .from('agenda_excepciones')
    .delete()
    .eq('id', excepcionId)

  return { error }
}

/**
 * Obtiene los profesionales disponibles (dueño + empleados)
 */
export async function getProfesionales() {
  const { userId, esDuenio } = await getEffectiveUserId()

  if (!esDuenio) {
    // Empleado solo ve su propia agenda
    const { data: perfil } = await supabase
      .from('usuarios_free')
      .select('id, nombre, apellido, avatar_url')
      .eq('user_id', (await supabase.auth.getUser()).data.user.id)
      .single()

    return { data: perfil ? [perfil] : [], error: null }
  }

  // Dueño ve su agenda + empleados
  const { data: propietario } = await supabase
    .from('usuarios_free')
    .select('id, nombre, apellido, avatar_url')
    .eq('id', userId)
    .single()

  const { data: empleados } = await supabase
    .from('usuarios_free')
    .select('id, nombre, apellido, avatar_url')
    .eq('duenio_id', userId)
    .eq('activo', true)

  const profesionales = []
  if (propietario) {
    profesionales.push({ ...propietario, esDuenio: true })
  }
  if (empleados) {
    profesionales.push(...empleados.map(e => ({ ...e, esDuenio: false })))
  }

  return { data: profesionales, error: null }
}

/**
 * Verifica si un horario está disponible para un profesional
 */
export async function verificarDisponibilidadHorario(profesionalId, fecha, horaInicio, horaFin) {
  // Obtener día de la semana (0-6)
  const date = new Date(fecha + 'T12:00:00')
  const diaSemana = date.getDay()

  // Verificar disponibilidad regular
  const { data: disponibilidad } = await supabase
    .from('agenda_disponibilidad')
    .select('*')
    .eq('profesional_id', profesionalId)
    .eq('dia_semana', diaSemana)
    .eq('activo', true)
    .single()

  if (!disponibilidad) {
    return { disponible: false, motivo: 'No trabaja este día' }
  }

  // Verificar si está dentro del horario
  if (horaInicio < disponibilidad.hora_inicio || horaFin > disponibilidad.hora_fin) {
    return { disponible: false, motivo: 'Fuera de horario de trabajo' }
  }

  // Verificar excepciones
  const { data: excepciones } = await supabase
    .from('agenda_excepciones')
    .select('*')
    .eq('profesional_id', profesionalId)
    .eq('fecha', fecha)

  if (excepciones && excepciones.length > 0) {
    for (const exc of excepciones) {
      if (exc.todo_el_dia) {
        return { disponible: false, motivo: exc.motivo || 'Día bloqueado' }
      }
      // Verificar si el horario se superpone con la excepción
      if (horaInicio < exc.hora_fin && horaFin > exc.hora_inicio) {
        return { disponible: false, motivo: exc.motivo || 'Horario bloqueado' }
      }
    }
  }

  return { disponible: true }
}
