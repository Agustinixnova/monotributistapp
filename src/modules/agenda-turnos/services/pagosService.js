/**
 * Servicio para gestión de pagos de turnos
 * Integración con Caja Diaria
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from '../../caja-diaria/services/empleadosService'

/**
 * Obtiene los métodos de pago del usuario (reutiliza los de Caja Diaria)
 */
export async function getMetodosPago() {
  const { userId } = await getEffectiveUserId()

  const { data, error } = await supabase
    .from('caja_metodos_pago')
    .select('*')
    .eq('duenio_id', userId)
    .eq('activo', true)
    .order('orden', { ascending: true })

  return { data, error }
}

/**
 * Registra un pago de turno (seña o pago final)
 */
export async function registrarPago(turnoId, pagoData) {
  const { data, error } = await supabase
    .from('agenda_turno_pagos')
    .insert({
      turno_id: turnoId,
      tipo: pagoData.tipo, // 'sena', 'pago_final', 'devolucion'
      monto: pagoData.monto,
      metodo_pago_id: pagoData.metodo_pago_id,
      fecha_pago: pagoData.fecha_pago,
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
    .select(`
      *,
      metodo_pago:caja_metodos_pago(id, nombre, icono)
    `)
    .eq('turno_id', turnoId)
    .order('created_at', { ascending: true })

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
  const precioTotal = turno.precio_total ||
    turno.agenda_turno_servicios?.reduce((sum, s) => sum + (s.precio || 0), 0) || 0

  const totalSenas = pagos
    .filter(p => p.tipo === 'sena')
    .reduce((sum, p) => sum + p.monto, 0)

  const totalPagado = pagos
    .filter(p => p.tipo !== 'devolucion')
    .reduce((sum, p) => sum + p.monto, 0)

  const devoluciones = pagos
    .filter(p => p.tipo === 'devolucion')
    .reduce((sum, p) => sum + p.monto, 0)

  const saldoPendiente = precioTotal - totalPagado + devoluciones

  return {
    precioTotal,
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
