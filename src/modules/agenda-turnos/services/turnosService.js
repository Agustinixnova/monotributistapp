/**
 * Service para turnos de agenda
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from '../../caja-diaria/services/empleadosService'
import { generarFechasRecurrentes, TURNOS_EXTENSION, recalcularFechasFuturas } from '../utils/recurrenciaUtils'
import { transferirPagos } from './pagosService'

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
        cliente:agenda_clientes(id, nombre, apellido, telefono, whatsapp, direccion, piso, departamento, localidad, provincia, indicaciones_ubicacion),
        servicios:agenda_turno_servicios(
          id,
          precio,
          duracion,
          servicio:agenda_servicios(id, nombre, color, duracion_minutos, precio)
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
        cliente:agenda_clientes(id, nombre, apellido, telefono, whatsapp, email, notas, direccion, piso, departamento, localidad, provincia, indicaciones_ubicacion),
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
    const turnoInsert = {
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
      turno_padre_id: turnoData.turno_padre_id || null,
      es_indeterminado: turnoData.es_indeterminado || false
    }

    // Agregar modalidad solo si se proporciona (columna opcional)
    if (turnoData.modalidad) turnoInsert.modalidad = turnoData.modalidad
    if (turnoData.link_videollamada) turnoInsert.link_videollamada = turnoData.link_videollamada

    const { data: turno, error: turnoError } = await supabase
      .from('agenda_turnos')
      .insert(turnoInsert)
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

    // Registrar pago de seña si se proporcionó
    console.log('[createTurno] Verificando seña:', {
      tieneSena: !!turnoData.sena,
      senaData: turnoData.sena
    })

    if (turnoData.sena && turnoData.sena.monto > 0) {
      // Mapeo de métodos de pago a nombres legibles
      const metodosNombres = {
        efectivo: 'Efectivo',
        transferencia: 'Transferencia',
        mercadopago: 'MercadoPago',
        qr: 'QR',
        otro: 'Otro'
      }
      const metodoNombre = metodosNombres[turnoData.sena.metodo_pago] || turnoData.sena.metodo_pago

      console.log('[createTurno] Insertando seña:', {
        turno_id: turno.id,
        monto: turnoData.sena.monto,
        metodo: metodoNombre
      })

      const { data: senaData, error: senaError } = await supabase
        .from('agenda_turno_pagos')
        .insert({
          turno_id: turno.id,
          tipo: 'sena',
          monto: turnoData.sena.monto,
          metodo_pago_id: null, // No usamos FK, guardamos el método en notas
          fecha_pago: turnoData.sena.fecha_pago || turnoData.fecha,
          notas: `Pago: ${metodoNombre}`,
          registrado_en_caja: false
        })
        .select()

      if (senaError) {
        console.error('[createTurno] Error registrando seña:', senaError)
      } else {
        console.log('[createTurno] Seña registrada exitosamente:', senaData)
      }
    } else {
      console.log('[createTurno] No se registra seña (condición no cumplida)')
    }

    // Transferir seña de turno cancelado si se especificó
    if (turnoData.transferirSenaDe) {
      console.log('[createTurno] Transfiriendo seña del turno:', turnoData.transferirSenaDe)
      const { success, error: transferError, pagosTransferidos } = await transferirPagos(
        turnoData.transferirSenaDe,
        turno.id
      )
      if (success) {
        console.log('[createTurno] Seña transferida exitosamente:', pagosTransferidos, 'pagos')
      } else {
        console.error('[createTurno] Error transfiriendo seña:', transferError)
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

    const esIndeterminado = recurrencia.cantidad === 'indeterminado'

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
      recurrencia_fin: esIndeterminado ? null : fechas[fechas.length - 1],
      es_indeterminado: esIndeterminado
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
        turno_padre_id: turnoPadre.id,
        es_indeterminado: esIndeterminado
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
      mensaje: `Se crearon ${turnosCreados.length} turnos`,
      esIndeterminado
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
    if (turnoData.modalidad !== undefined) updateData.modalidad = turnoData.modalidad
    if (turnoData.link_videollamada !== undefined) updateData.link_videollamada = turnoData.link_videollamada
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

/**
 * Obtener todos los turnos de una serie recurrente
 * @param {string} turnoId - ID de cualquier turno de la serie
 * @returns {Object} { data: turnos[], serieId, turnoPadre }
 */
export async function getTurnosDeSerie(turnoId) {
  try {
    // Primero obtener el turno para saber su padre o si ES el padre
    const { data: turno, error: turnoError } = await getTurnoById(turnoId)
    if (turnoError) throw turnoError

    // El ID de la serie es el del padre, o el propio si es el padre
    const serieId = turno.turno_padre_id || turno.id

    // Buscar todos los turnos de la serie
    const { data, error } = await supabase
      .from('agenda_turnos')
      .select(`
        *,
        cliente:agenda_clientes(id, nombre, apellido, telefono, whatsapp),
        servicios:agenda_turno_servicios(
          id,
          precio,
          duracion,
          servicio:agenda_servicios(id, nombre, color, duracion_minutos, precio)
        )
      `)
      .or(`id.eq.${serieId},turno_padre_id.eq.${serieId}`)
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true })

    if (error) throw error

    return {
      data: data || [],
      serieId,
      turnoPadre: data?.find(t => t.id === serieId) || null,
      error: null
    }
  } catch (error) {
    console.error('Error fetching turnos de serie:', error)
    return { data: null, serieId: null, turnoPadre: null, error }
  }
}

/**
 * Obtener turnos futuros de una serie (desde una fecha en adelante)
 * @param {string} turnoId - ID del turno actual
 * @param {string} fechaDesde - Fecha desde la cual buscar (YYYY-MM-DD)
 * @param {boolean} incluirActual - Si incluir el turno actual en el resultado
 */
export async function getTurnosFuturosDeSerie(turnoId, fechaDesde, incluirActual = false) {
  try {
    // Primero obtener el turno para saber su padre
    const { data: turno, error: turnoError } = await getTurnoById(turnoId)
    if (turnoError) throw turnoError

    const serieId = turno.turno_padre_id || turno.id

    // Buscar todos los de la serie con fecha >= fechaDesde
    let query = supabase
      .from('agenda_turnos')
      .select(`
        *,
        servicios:agenda_turno_servicios(
          id,
          precio,
          duracion,
          servicio:agenda_servicios(id, nombre, color, duracion_minutos, precio)
        )
      `)
      .or(`id.eq.${serieId},turno_padre_id.eq.${serieId}`)
      .gte('fecha', fechaDesde)
      .not('estado', 'in', '(cancelado,no_asistio)') // Excluir cancelados
      .order('fecha', { ascending: true })

    if (!incluirActual) {
      query = query.neq('id', turnoId) // Excluir el actual
    }

    const { data, error } = await query

    if (error) throw error

    return {
      data: data || [],
      cantidadFuturos: data?.length || 0,
      error: null
    }
  } catch (error) {
    console.error('Error fetching turnos futuros de serie:', error)
    return { data: null, cantidadFuturos: 0, error }
  }
}

/**
 * Contar turnos pendientes de una serie indeterminada
 * @param {string} turnoId - ID de cualquier turno de la serie
 */
export async function contarTurnosPendientesSerie(turnoId) {
  try {
    const { data: turno } = await getTurnoById(turnoId)
    if (!turno) return { cantidad: 0, error: new Error('Turno no encontrado') }

    const serieId = turno.turno_padre_id || turno.id
    const hoy = new Date().toISOString().split('T')[0]

    const { count, error } = await supabase
      .from('agenda_turnos')
      .select('*', { count: 'exact', head: true })
      .or(`id.eq.${serieId},turno_padre_id.eq.${serieId}`)
      .gte('fecha', hoy)
      .not('estado', 'in', '(cancelado,no_asistio,completado)')

    if (error) throw error

    return { cantidad: count || 0, serieId, error: null }
  } catch (error) {
    console.error('Error contando turnos pendientes:', error)
    return { cantidad: 0, serieId: null, error }
  }
}

/**
 * Extender una serie recurrente indeterminada
 * Agrega más turnos a partir del último turno existente
 * @param {string} serieId - ID del turno padre de la serie
 * @param {number} cantidadNuevos - Cantidad de turnos a agregar (default: TURNOS_EXTENSION)
 */
export async function extenderSerieRecurrente(serieId, cantidadNuevos = TURNOS_EXTENSION) {
  try {
    // Obtener el turno padre para conocer la configuración
    const { data: turnoPadre, error: padreError } = await getTurnoById(serieId)
    if (padreError) throw padreError
    if (!turnoPadre) throw new Error('Turno padre no encontrado')

    // Verificar que sea una serie indeterminada
    if (!turnoPadre.es_indeterminado) {
      return { data: null, error: new Error('La serie no es indeterminada'), turnosCreados: 0 }
    }

    // Obtener el último turno de la serie
    const { data: ultimosTurnos, error: ultimoError } = await supabase
      .from('agenda_turnos')
      .select('*')
      .or(`id.eq.${serieId},turno_padre_id.eq.${serieId}`)
      .order('fecha', { ascending: false })
      .limit(1)

    if (ultimoError) throw ultimoError

    const ultimoTurno = ultimosTurnos?.[0]
    if (!ultimoTurno) throw new Error('No se encontró el último turno de la serie')

    // Generar nuevas fechas a partir del día siguiente al último turno
    const fechaInicio = new Date(ultimoTurno.fecha + 'T12:00:00')
    // Avanzar según el tipo de recurrencia para obtener la primera fecha nueva
    const tipoRecurrencia = turnoPadre.recurrencia_tipo
    if (tipoRecurrencia === 'mensual') {
      fechaInicio.setMonth(fechaInicio.getMonth() + 1)
    } else {
      const dias = tipoRecurrencia === 'quincenal' ? 14 : 7
      fechaInicio.setDate(fechaInicio.getDate() + dias)
    }

    const fechasNuevas = generarFechasRecurrentes({
      fechaInicio: fechaInicio.toISOString().split('T')[0],
      tipo: tipoRecurrencia,
      cantidad: cantidadNuevos
    })

    // Crear los nuevos turnos
    const turnosCreados = []
    for (const fecha of fechasNuevas) {
      const turnoData = {
        cliente_id: turnoPadre.cliente_id,
        fecha,
        hora_inicio: ultimoTurno.hora_inicio,
        hora_fin: ultimoTurno.hora_fin,
        servicios: turnoPadre.servicios?.map(s => ({
          servicio_id: s.servicio?.id || s.servicio_id,
          precio: s.precio,
          duracion: s.duracion
        })) || [],
        notas: turnoPadre.notas,
        modalidad: turnoPadre.modalidad,
        link_videollamada: turnoPadre.link_videollamada,
        es_recurrente: true,
        recurrencia_tipo: tipoRecurrencia,
        turno_padre_id: serieId,
        es_indeterminado: true
      }

      const { data: nuevoTurno, error: createError } = await createTurno(turnoData)
      if (createError) {
        console.error(`Error creando turno de extensión para ${fecha}:`, createError)
      } else {
        turnosCreados.push(nuevoTurno)
      }
    }

    return {
      data: turnosCreados,
      turnosCreados: turnosCreados.length,
      error: null,
      mensaje: `Se agregaron ${turnosCreados.length} turnos a la serie`
    }
  } catch (error) {
    console.error('Error extendiendo serie recurrente:', error)
    return { data: null, turnosCreados: 0, error }
  }
}

/**
 * Actualizar un turno con opción de propagar cambios a futuros
 * @param {string} id - ID del turno a actualizar
 * @param {Object} turnoData - Datos a actualizar
 * @param {Object} opciones - Opciones de propagación
 * @param {boolean} opciones.propagarAFuturos - Si propagar a turnos futuros
 * @param {boolean} opciones.cambioFecha - Si hubo cambio de fecha (requiere recálculo)
 * @param {string} opciones.fechaOriginal - Fecha original del turno (si cambió)
 */
export async function updateTurnoConPropagacion(id, turnoData, opciones = {}) {
  try {
    const { propagarAFuturos = false, cambioFecha = false, fechaOriginal } = opciones

    // Actualizar el turno principal
    const { data: turnoActualizado, error: updateError } = await updateTurno(id, turnoData)
    if (updateError) throw updateError

    // Si no hay que propagar, retornar
    if (!propagarAFuturos) {
      return {
        data: turnoActualizado,
        turnosActualizados: 1,
        error: null
      }
    }

    // Obtener turnos futuros de la serie
    const fechaActual = turnoData.fecha || turnoActualizado.fecha
    const { data: turnosFuturos, error: futError } = await getTurnosFuturosDeSerie(
      id,
      fechaActual,
      false // No incluir el actual
    )

    if (futError || !turnosFuturos || turnosFuturos.length === 0) {
      return {
        data: turnoActualizado,
        turnosActualizados: 1,
        error: null
      }
    }

    // Preparar datos para propagar (solo ciertos campos)
    const datosParaPropagar = {}
    if (turnoData.hora_inicio !== undefined) datosParaPropagar.hora_inicio = turnoData.hora_inicio
    if (turnoData.hora_fin !== undefined) datosParaPropagar.hora_fin = turnoData.hora_fin
    if (turnoData.notas !== undefined) datosParaPropagar.notas = turnoData.notas
    if (turnoData.modalidad !== undefined) datosParaPropagar.modalidad = turnoData.modalidad
    if (turnoData.link_videollamada !== undefined) datosParaPropagar.link_videollamada = turnoData.link_videollamada

    // Si hay cambio de fecha, recalcular fechas de turnos futuros
    let fechasRecalculadas = null
    if (cambioFecha && fechaOriginal && turnoData.fecha && fechaOriginal !== turnoData.fecha) {
      fechasRecalculadas = recalcularFechasFuturas(
        fechaOriginal,
        turnoData.fecha,
        turnosFuturos.map(t => t.fecha),
        turnoActualizado.recurrencia_tipo
      )
    }

    // Actualizar cada turno futuro
    let turnosActualizados = 1 // Ya contamos el principal
    for (let i = 0; i < turnosFuturos.length; i++) {
      const turnoFuturo = turnosFuturos[i]
      const datosActualizar = { ...datosParaPropagar }

      // Si hay fechas recalculadas, incluir la nueva fecha
      if (fechasRecalculadas && fechasRecalculadas[i]) {
        datosActualizar.fecha = fechasRecalculadas[i].fechaNueva
      }

      // Actualizar servicios si se proporcionaron
      if (turnoData.servicios !== undefined) {
        datosActualizar.servicios = turnoData.servicios
      }

      const { error: upError } = await updateTurno(turnoFuturo.id, datosActualizar)
      if (upError) {
        console.error(`Error actualizando turno futuro ${turnoFuturo.id}:`, upError)
      } else {
        turnosActualizados++
      }
    }

    return {
      data: turnoActualizado,
      turnosActualizados,
      error: null
    }
  } catch (error) {
    console.error('Error updating turno con propagación:', error)
    return { data: null, turnosActualizados: 0, error }
  }
}
