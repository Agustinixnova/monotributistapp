/**
 * Servicio para gestión de pagos de turnos
 * Integración con Caja Diaria
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from '../../caja-diaria/services/empleadosService'
import { getHoraActualArgentina } from '../utils/dateUtils'

/**
 * Obtiene los métodos de pago del usuario (reutiliza los de Caja Diaria)
 */
export async function getMetodosPago() {
  const { userId } = await getEffectiveUserId()

  // Obtener métodos del sistema (user_id IS NULL) y del dueño
  const { data, error } = await supabase
    .from('caja_metodos_pago')
    .select('*')
    .eq('activo', true)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('orden', { ascending: true })

  return { data, error }
}

/**
 * Registra un pago de turno (seña o pago final)
 */
export async function registrarPago(turnoId, pagoData) {
  // Obtener hora actual de Argentina
  const horaPago = getHoraActualArgentina()

  const { data, error } = await supabase
    .from('agenda_turno_pagos')
    .insert({
      turno_id: turnoId,
      tipo: pagoData.tipo, // 'sena', 'pago_final', 'devolucion'
      monto: pagoData.monto,
      metodo_pago_id: pagoData.metodo_pago_id,
      fecha_pago: pagoData.fecha_pago,
      hora_pago: horaPago, // Hora del cobro en formato HH:MM UTC-3
      notas: pagoData.notas || null,
      registrado_en_caja: false
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Obtiene los pagos de un turno
 */
export async function getPagosTurno(turnoId) {
  const { data, error } = await supabase
    .from('agenda_turno_pagos')
    .select('*')
    .eq('turno_id', turnoId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error obteniendo pagos del turno:', error)
  }

  return { data, error }
}

/**
 * Registra pago en Caja Diaria
 */
export async function registrarEnCaja(pagoId, turnoInfo) {
  const { userId } = await getEffectiveUserId()

  // Obtener el pago
  const { data: pago, error: pagoError } = await supabase
    .from('agenda_turno_pagos')
    .select(`
      *,
      metodo_pago:caja_metodos_pago(id, nombre)
    `)
    .eq('id', pagoId)
    .single()

  if (pagoError) return { error: pagoError }

  // Buscar o crear categoría de agenda
  let categoriaId = await obtenerOCrearCategoriaAgenda(userId, pago.tipo)

  // Determinar tipo de movimiento
  const tipoMovimiento = pago.tipo === 'devolucion' ? 'egreso' : 'ingreso'

  // Crear descripción
  const descripcion = generarDescripcionMovimiento(pago.tipo, turnoInfo)

  // Crear movimiento en caja
  const { data: movimiento, error: movError } = await supabase
    .from('caja_movimientos')
    .insert({
      duenio_id: userId,
      fecha: pago.fecha_pago,
      tipo: tipoMovimiento,
      categoria_id: categoriaId,
      monto: pago.monto,
      metodo_pago_id: pago.metodo_pago_id,
      descripcion,
      referencia_tipo: 'agenda_turno',
      referencia_id: pago.turno_id
    })
    .select()
    .single()

  if (movError) return { error: movError }

  // Actualizar pago con referencia al movimiento
  const { error: updateError } = await supabase
    .from('agenda_turno_pagos')
    .update({
      registrado_en_caja: true,
      caja_movimiento_id: movimiento.id
    })
    .eq('id', pagoId)

  if (updateError) return { error: updateError }

  return { data: movimiento }
}

/**
 * Obtiene o crea la categoría de caja para pagos de agenda
 */
async function obtenerOCrearCategoriaAgenda(duenioId, tipoPago) {
  const nombreCategoria = tipoPago === 'sena'
    ? 'Seña de turno'
    : tipoPago === 'devolucion'
      ? 'Devolución de seña'
      : 'Cobro de turno'

  const tipoCategoria = tipoPago === 'devolucion' ? 'egreso' : 'ingreso'

  // Buscar categoría existente
  const { data: existente } = await supabase
    .from('caja_categorias')
    .select('id')
    .eq('duenio_id', duenioId)
    .eq('nombre', nombreCategoria)
    .eq('tipo', tipoCategoria)
    .single()

  if (existente) return existente.id

  // Crear categoría si no existe
  const { data: nueva } = await supabase
    .from('caja_categorias')
    .insert({
      duenio_id: duenioId,
      nombre: nombreCategoria,
      tipo: tipoCategoria,
      icono: tipoPago === 'devolucion' ? 'undo' : 'calendar',
      color: tipoPago === 'sena' ? '#F59E0B' : tipoPago === 'devolucion' ? '#EF4444' : '#10B981',
      es_sistema: true
    })
    .select('id')
    .single()

  return nueva?.id
}

/**
 * Genera descripción para el movimiento de caja
 */
function generarDescripcionMovimiento(tipo, turnoInfo) {
  const cliente = turnoInfo.cliente_nombre || 'Cliente sin nombre'
  const servicios = turnoInfo.servicios_nombres || 'Servicio'

  switch (tipo) {
    case 'sena':
      return `Seña - ${cliente} - ${servicios}`
    case 'devolucion':
      return `Devolución seña - ${cliente} - ${servicios}`
    default:
      return `Cobro turno - ${cliente} - ${servicios}`
  }
}

/**
 * Calcula el resumen de pagos de un turno
 */
export function calcularResumenPagos(turno, pagos = []) {
  // Buscar servicios en diferentes formatos posibles
  const servicios = turno.agenda_turno_servicios || turno.servicios || []

  const precioServicios = turno.precio_total ||
    servicios.reduce((sum, s) => sum + (s.precio || 0), 0) || 0

  const totalSenas = pagos
    .filter(p => p.tipo === 'sena')
    .reduce((sum, p) => sum + p.monto, 0)

  const totalPagado = pagos
    .filter(p => p.tipo !== 'devolucion')
    .reduce((sum, p) => sum + p.monto, 0)

  const devoluciones = pagos
    .filter(p => p.tipo === 'devolucion')
    .reduce((sum, p) => sum + p.monto, 0)

  // Si el total pagado es mayor al precio de servicios (por adicionales),
  // usar el total pagado como precio real
  const precioTotal = Math.max(precioServicios, totalPagado)

  const saldoPendiente = precioTotal - totalPagado + devoluciones

  return {
    precioTotal,
    precioServicios, // Precio base de los servicios
    totalSenas,
    totalPagado,
    devoluciones,
    saldoPendiente,
    estaPagado: saldoPendiente <= 0
  }
}

/**
 * Verifica si un turno requiere seña basado en sus servicios
 */
export function calcularSenaRequerida(servicios) {
  let totalSena = 0
  let requiereSena = false

  servicios.forEach(s => {
    const servicio = s.servicio || s
    if (servicio.requiere_sena && servicio.porcentaje_sena > 0) {
      requiereSena = true
      const precio = s.precio || servicio.precio || 0
      totalSena += (precio * servicio.porcentaje_sena) / 100
    }
  })

  return {
    requiereSena,
    montoSena: Math.round(totalSena),
    porcentajePromedio: requiereSena ? Math.round((totalSena / servicios.reduce((sum, s) => sum + (s.precio || s.servicio?.precio || 0), 0)) * 100) : 0
  }
}

/**
 * Obtiene seña disponible de turnos cancelados de un cliente
 * (turnos cancelados que tienen seña pero no devolución)
 */
export async function getSenaDisponibleCliente(clienteId) {
  if (!clienteId) return { data: null, error: null }

  try {
    // Buscar turnos cancelados del cliente
    const { data: turnosCancelados, error: turnosError } = await supabase
      .from('agenda_turnos')
      .select(`
        id,
        fecha,
        estado,
        agenda_turno_servicios(
          servicio:agenda_servicios(nombre)
        )
      `)
      .eq('cliente_id', clienteId)
      .eq('estado', 'cancelado')
      .order('cancelado_at', { ascending: false })

    if (turnosError) throw turnosError
    if (!turnosCancelados || turnosCancelados.length === 0) {
      return { data: null, error: null }
    }

    // Para cada turno cancelado, verificar si tiene seña sin devolver
    for (const turno of turnosCancelados) {
      const { data: pagos, error: pagosError } = await supabase
        .from('agenda_turno_pagos')
        .select('*')
        .eq('turno_id', turno.id)

      if (pagosError) continue

      const senas = pagos?.filter(p => p.tipo === 'sena') || []
      const devoluciones = pagos?.filter(p => p.tipo === 'devolucion') || []

      // Si hay seña y no hay devolución, esta seña está disponible
      if (senas.length > 0 && devoluciones.length === 0) {
        const totalSena = senas.reduce((sum, p) => sum + p.monto, 0)
        const servicioNombre = turno.agenda_turno_servicios?.[0]?.servicio?.nombre || 'Servicio'

        return {
          data: {
            turnoId: turno.id,
            turnoFecha: turno.fecha,
            servicioNombre,
            montoSena: totalSena,
            pagosIds: senas.map(p => p.id)
          },
          error: null
        }
      }
    }

    return { data: null, error: null }
  } catch (error) {
    console.error('Error obteniendo seña disponible:', error)
    return { data: null, error }
  }
}

/**
 * Anula/elimina los pagos de seña de un turno
 * Se usa cuando se cancela un turno y se devuelve la seña
 */
export async function anularPagosSenaTurno(turnoId) {
  try {
    // Eliminar los registros de seña del turno
    const { error } = await supabase
      .from('agenda_turno_pagos')
      .delete()
      .eq('turno_id', turnoId)
      .eq('tipo', 'sena')

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error anulando pagos de seña:', error)
    return { success: false, error }
  }
}

/**
 * Elimina un pago específico de un turno
 * Si el pago estaba registrado en caja, también elimina el movimiento de caja
 */
export async function eliminarPagoTurno(pagoId) {
  try {
    // Primero obtener el pago para ver si tiene movimiento en caja
    const { data: pago, error: fetchError } = await supabase
      .from('agenda_turno_pagos')
      .select('*')
      .eq('id', pagoId)
      .single()

    if (fetchError) throw fetchError

    // Si estaba registrado en caja, eliminar también el movimiento
    if (pago.registrado_en_caja && pago.caja_movimiento_id) {
      const { error: cajaError } = await supabase
        .from('caja_movimientos')
        .delete()
        .eq('id', pago.caja_movimiento_id)

      if (cajaError) {
        console.error('Error eliminando movimiento de caja:', cajaError)
        // Continuamos aunque falle la eliminación de caja
      }
    }

    // Eliminar el pago
    const { error: deleteError } = await supabase
      .from('agenda_turno_pagos')
      .delete()
      .eq('id', pagoId)

    if (deleteError) throw deleteError

    return { success: true, error: null }
  } catch (error) {
    console.error('Error eliminando pago:', error)
    return { success: false, error }
  }
}

/**
 * Transfiere pagos de un turno a otro
 * Se usa cuando un cliente reprograma y mantiene la seña
 */
export async function transferirPagos(turnoOrigenId, turnoDestinoId) {
  try {
    // Obtener pagos del turno origen (solo seña, no devoluciones)
    const { data: pagos, error: pagosError } = await supabase
      .from('agenda_turno_pagos')
      .select('*')
      .eq('turno_id', turnoOrigenId)
      .eq('tipo', 'sena')

    if (pagosError) throw pagosError
    if (!pagos || pagos.length === 0) {
      return { success: false, error: 'No hay pagos para transferir' }
    }

    // Actualizar turno_id de los pagos al nuevo turno
    const { error: updateError } = await supabase
      .from('agenda_turno_pagos')
      .update({ turno_id: turnoDestinoId })
      .in('id', pagos.map(p => p.id))

    if (updateError) throw updateError

    return { success: true, error: null, pagosTransferidos: pagos.length }
  } catch (error) {
    console.error('Error transfiriendo pagos:', error)
    return { success: false, error }
  }
}
