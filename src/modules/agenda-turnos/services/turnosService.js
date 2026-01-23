/**
 * Service para turnos de agenda
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from '../../caja-diaria/services/empleadosService'
import { generarFechasRecurrentes } from '../utils/recurrenciaUtils'

/**
 * Obtener turnos por rango de fechas
 * @param {string} fechaInicio - YYYY-MM-DD
 * @param {string} fechaFin - YYYY-MM-DD
 * @param {Object} options
 * @param {string} options.profesionalId - Filtrar por profesional
 * @param {string} options.estado - Filtrar por estado
 */
export async function getTurnos(fechaInicio, fechaFin, options = {}) {
  const { profesionalId, estado } = options

  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    let query = supabase
      .from('agenda_turnos')
      .select(`
        *,
        cliente:agenda_clientes(id, nombre, apellido, telefono, whatsapp),
        profesional:usuarios_free!agenda_turnos_profesional_id_fkey(id, nombre, apellido),
        servicios:agenda_turno_servicios(
          id,
          precio,
          duracion,
          servicio:agenda_servicios(id, nombre, color, duracion_minutos)
        )
      `)
      .eq('duenio_id', userId)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true })

    if (profesionalId) {
      query = query.eq('profesional_id', profesionalId)
    }

    if (estado) {
      query = query.eq('estado', estado)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching turnos:', error)
    return { data: null, error }
  }
}

/**
 * Obtener turnos de un día específico
 */
export async function getTurnosDia(fecha, options = {}) {
  return getTurnos(fecha, fecha, options)
}

/**
 * Obtener un turno por ID con todos sus detalles
 */
export async function getTurnoById(id) {
  try {
    const { data, error } = await supabase
      .from('agenda_turnos')
      .select(`
        *,
        cliente:agenda_clientes(id, nombre, apellido, telefono, whatsapp, email, notas),
        profesional:usuarios_free!agenda_turnos_profesional_id_fkey(id, nombre, apellido, email),
        servicios:agenda_turno_servicios(
          id,
          precio,
          duracion,
          servicio:agenda_servicios(id, nombre, color, duracion_minutos, precio)
        ),
        pagos:agenda_turno_pagos(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching turno:', error)
    return { data: null, error }
  }
}

/**
 * Crear un nuevo turno
 */
export async function createTurno(turnoData) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Obtener usuario actual real (para profesional_id si no se especifica)
    const { data: { user } } = await supabase.auth.getUser()

    // Crear el turno
    const { data: turno, error: turnoError } = await supabase
      .from('agenda_turnos')
      .insert({
        duenio_id: userId,
        profesional_id: turnoData.profesional_id || user.id,
        cliente_id: turnoData.cliente_id || null,
        fecha: turnoData.fecha,
        hora_inicio: turnoData.hora_inicio,
        hora_fin: turnoData.hora_fin,
        duracion_real: turnoData.duracion_real || null,
        estado: turnoData.estado || 'pendiente',
        notas: turnoData.notas || null,
        notas_internas: turnoData.notas_internas || null,
        es_recurrente: turnoData.es_recurrente || false,
        recurrencia_tipo: turnoData.recurrencia_tipo || null,
        recurrencia_fin: turnoData.recurrencia_fin || null,
        turno_padre_id: turnoData.turno_padre_id || null
      })
      .select()
      .single()

    if (turnoError) throw turnoError

    // Agregar servicios si se proporcionan
    if (turnoData.servicios && turnoData.servicios.length > 0) {
      const serviciosInsert = turnoData.servicios.map((s, index) => ({
        turno_id: turno.id,
        servicio_id: s.servicio_id,
        precio: s.precio,
        duracion: s.duracion,
        orden: index
      }))

      const { error: serviciosError } = await supabase
        .from('agenda_turno_servicios')
        .insert(serviciosInsert)

      if (serviciosError) {
        // Rollback: eliminar el turno creado
        await supabase.from('agenda_turnos').delete().eq('id', turno.id)
        throw serviciosError
      }
    }

    // Obtener turno completo
    return getTurnoById(turno.id)
  } catch (error) {
    console.error('Error creating turno:', error)
    return { data: null, error }
  }
}

/**
 * Crear turnos recurrentes
 * Crea múltiples turnos basados en la configuración de recurrencia
 */
export async function createTurnosRecurrentes(turnoData, recurrencia) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Generar las fechas de los turnos recurrentes
    const fechas = generarFechasRecurrentes({
      fechaInicio: turnoData.fecha,
      tipo: recurrencia.tipo,
      cantidad: recurrencia.cantidad,
      fechaFin: recurrencia.fechaFin
    })

    if (fechas.length === 0) {
      throw new Error('No se pudieron generar fechas para los turnos recurrentes')
    }

    // Crear el primer turno (turno padre)
    const primerTurnoData = {
      ...turnoData,
      es_recurrente: true,
      recurrencia_tipo: recurrencia.tipo,
      recurrencia_fin: fechas[fechas.length - 1]
    }

    const { data: turnoPadre, error: errorPadre } = await createTurno(primerTurnoData)
    if (errorPadre) throw errorPadre

    // Crear los turnos hijos (resto de fechas)
    const turnosCreados = [turnoPadre]

    for (let i = 1; i < fechas.length; i++) {
      const turnoHijoData = {
        ...turnoData,
        fecha: fechas[i],
        es_recurrente: true,
        recurrencia_tipo: recurrencia.tipo,
        turno_padre_id: turnoPadre.id
      }

      const { data: turnoHijo, error: errorHijo } = await createTurno(turnoHijoData)
      if (errorHijo) {
        console.error(`Error creando turno recurrente ${i + 1}:`, errorHijo)
        // Continuar con los demás aunque falle uno
      } else {
        turnosCreados.push(turnoHijo)
      }
    }

    return {
      data: turnosCreados,
      error: null,
      mensaje: `Se crearon ${turnosCreados.length} turnos`
    }
  } catch (error) {
    console.error('Error creating turnos recurrentes:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar un turno
 */
export async function updateTurno(id, turnoData) {
  try {
    const updateData = {}

    if (turnoData.profesional_id !== undefined) updateData.profesional_id = turnoData.profesional_id
    if (turnoData.cliente_id !== undefined) updateData.cliente_id = turnoData.cliente_id
    if (turnoData.fecha !== undefined) updateData.fecha = turnoData.fecha
    if (turnoData.hora_inicio !== undefined) updateData.hora_inicio = turnoData.hora_inicio
    if (turnoData.hora_fin !== undefined) updateData.hora_fin = turnoData.hora_fin
    if (turnoData.duracion_real !== undefined) updateData.duracion_real = turnoData.duracion_real
    if (turnoData.estado !== undefined) {
      updateData.estado = turnoData.estado
      // Timestamps de estado
      if (turnoData.estado === 'completado') {
        updateData.completado_at = new Date().toISOString()
      } else if (turnoData.estado === 'cancelado') {
        updateData.cancelado_at = new Date().toISOString()
      }
    }
    if (turnoData.notas !== undefined) updateData.notas = turnoData.notas
    if (turnoData.notas_internas !== undefined) updateData.notas_internas = turnoData.notas_internas
    if (turnoData.recordatorio_enviado !== undefined) {
      updateData.recordatorio_enviado = turnoData.recordatorio_enviado
      if (turnoData.recordatorio_enviado) {
        updateData.fecha_recordatorio = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('agenda_turnos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Actualizar servicios si se proporcionan
    if (turnoData.servicios !== undefined) {
      // Eliminar servicios existentes
      await supabase
        .from('agenda_turno_servicios')
        .delete()
        .eq('turno_id', id)

      // Insertar nuevos
      if (turnoData.servicios.length > 0) {
        const serviciosInsert = turnoData.servicios.map((s, index) => ({
          turno_id: id,
          servicio_id: s.servicio_id,
          precio: s.precio,
          duracion: s.duracion,
          orden: index
        }))

        await supabase
          .from('agenda_turno_servicios')
          .insert(serviciosInsert)
      }
    }

    return getTurnoById(id)
  } catch (error) {
    console.error('Error updating turno:', error)
    return { data: null, error }
  }
}

/**
 * Cambiar estado de un turno
 */
export async function cambiarEstadoTurno(id, nuevoEstado) {
  return updateTurno(id, { estado: nuevoEstado })
}

/**
 * Eliminar un turno
 */
export async function deleteTurno(id) {
  try {
    // Los servicios y pagos se eliminan en cascada por FK
    const { error } = await supabase
      .from('agenda_turnos')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting turno:', error)
    return { success: false, error }
  }
}

/**
 * Verificar disponibilidad para un turno
 */
export async function verificarDisponibilidad(profesionalId, fecha, horaInicio, horaFin, turnoExcluirId = null) {
  try {
    const { data, error } = await supabase
      .rpc('verificar_disponibilidad_turno', {
        p_profesional_id: profesionalId,
        p_fecha: fecha,
        p_hora_inicio: horaInicio,
        p_hora_fin: horaFin,
        p_turno_excluir: turnoExcluirId
      })

    if (error) throw error
    return { disponible: data, error: null }
  } catch (error) {
    console.error('Error verificando disponibilidad:', error)
    // Si falla la verificación (ej: función no existe), retornar disponible
    return { disponible: true, error }
  }
}

/**
 * Obtener próximos turnos de un cliente
 */
export async function getTurnosCliente(clienteId, limite = 10) {
  try {
    const { data, error } = await supabase
      .from('agenda_turnos')
      .select(`
        *,
        servicios:agenda_turno_servicios(
          servicio:agenda_servicios(nombre, color)
        )
      `)
      .eq('cliente_id', clienteId)
      .order('fecha', { ascending: false })
      .order('hora_inicio', { ascending: false })
      .limit(limite)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching turnos cliente:', error)
    return { data: null, error }
  }
}
