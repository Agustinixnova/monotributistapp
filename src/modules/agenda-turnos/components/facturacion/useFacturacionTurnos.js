/**
 * Hook para gestionar facturación de turnos
 * Carga los turnos completados con sus pagos para facturar
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../../lib/supabase'
import { getEffectiveUserId } from '../../../caja-diaria/services/empleadosService'
import { emitirFacturaC, TIPOS_DOCUMENTO } from '../../services/afipService'
import {
  esErrorDeConexion,
  guardarFacturaPendiente,
  TIPOS_COMPROBANTE
} from '../../services/facturasPendientesService'

// Categorías de métodos de pago
const METODOS_ELECTRONICOS = ['Transferencia', 'MercadoPago', 'QR']
const METODOS_EFECTIVO = ['Efectivo']
const METODOS_OTROS = ['Canje', 'Gratis', 'Otro', 'Cortesía']

/**
 * Determina la categoría de un método de pago
 */
function categorizarMetodo(notas) {
  if (!notas) return 'otros'
  const notasLower = notas.toLowerCase()

  if (notasLower.includes('transferencia')) return 'electronico'
  if (notasLower.includes('mercadopago')) return 'electronico'
  if (notasLower.includes('qr')) return 'electronico'
  if (notasLower.includes('efectivo')) return 'efectivo'
  if (notasLower.includes('canje')) return 'otros'
  if (notasLower.includes('gratis')) return 'otros'
  if (notasLower.includes('cortesía') || notasLower.includes('cortesia')) return 'otros'

  return 'efectivo' // Default a efectivo si no coincide
}

/**
 * Extrae el nombre del método de pago
 */
function extraerMetodo(notas) {
  if (!notas) return 'Otro'
  if (notas.includes('Efectivo')) return 'Efectivo'
  if (notas.includes('Transferencia')) return 'Transferencia'
  if (notas.includes('MercadoPago')) return 'MercadoPago'
  if (notas.includes('QR')) return 'QR'
  if (notas.includes('Canje')) return 'Canje'
  if (notas.includes('Gratis')) return 'Gratis'
  return 'Otro'
}

export function useFacturacionTurnos() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [duenioId, setDuenioId] = useState(null)

  // Filtros
  const [mes, setMes] = useState(() => {
    const hoy = new Date()
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  })
  const [filtroPeriodo, setFiltroPeriodo] = useState('mes') // hoy, ayer, semana, mes, personalizado
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos') // todos, sin_facturar, facturado, anulado
  const [filtroTipoPago, setFiltroTipoPago] = useState('todos') // todos, electronicos, efectivo

  // Calcular rango de fechas según el período seleccionado
  const calcularRangoFechas = useCallback(() => {
    const hoy = new Date()
    // Ajustar a UTC-3 para Argentina
    const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())

    switch (filtroPeriodo) {
      case 'hoy': {
        const fecha = hoySinHora.toISOString().split('T')[0]
        return { inicio: fecha, fin: fecha }
      }
      case 'ayer': {
        const ayer = new Date(hoySinHora)
        ayer.setDate(ayer.getDate() - 1)
        const fecha = ayer.toISOString().split('T')[0]
        return { inicio: fecha, fin: fecha }
      }
      case 'semana': {
        const inicioSemana = new Date(hoySinHora)
        const diaSemana = inicioSemana.getDay()
        // Ajustar al lunes (día 1)
        const diff = diaSemana === 0 ? -6 : 1 - diaSemana
        inicioSemana.setDate(inicioSemana.getDate() + diff)
        return {
          inicio: inicioSemana.toISOString().split('T')[0],
          fin: hoySinHora.toISOString().split('T')[0]
        }
      }
      case 'personalizado': {
        return {
          inicio: fechaDesde || hoySinHora.toISOString().split('T')[0],
          fin: fechaHasta || hoySinHora.toISOString().split('T')[0]
        }
      }
      case 'mes':
      default: {
        const [year, month] = mes.split('-')
        const inicioMes = `${year}-${month}-01`
        const finMes = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
        return { inicio: inicioMes, fin: finMes }
      }
    }
  }, [filtroPeriodo, mes, fechaDesde, fechaHasta])

  // Datos
  const [turnosConPagos, setTurnosConPagos] = useState([])
  const [seleccionados, setSeleccionados] = useState([])

  // Totales
  const [totales, setTotales] = useState({
    electronicos: { total: 0, sinFacturar: 0, facturado: 0 },
    efectivo: { total: 0, sinFacturar: 0, facturado: 0 },
    otros: { total: 0, sinFacturar: 0, facturado: 0 }
  })

  // Obtener ID del usuario
  useEffect(() => {
    const obtenerUsuario = async () => {
      const { userId } = await getEffectiveUserId()
      setDuenioId(userId)
    }
    obtenerUsuario()
  }, [])

  // Cargar turnos del período seleccionado
  const cargarTurnos = useCallback(async () => {
    if (!duenioId) return

    setLoading(true)
    setError(null)

    try {
      // Calcular rango de fechas según filtro
      const { inicio: fechaInicio, fin: fechaFin } = calcularRangoFechas()

      // Obtener turnos completados CON pagos
      // No filtramos por fecha de turno, solo por fecha de pago después
      const { data: turnos, error: errorTurnos } = await supabase
        .from('agenda_turnos')
        .select(`
          id,
          fecha,
          hora_inicio,
          estado,
          notas,
          cliente:agenda_clientes(id, nombre, apellido, cuit, whatsapp, telefono),
          servicios:agenda_turno_servicios(
            id,
            precio,
            servicio:agenda_servicios(id, nombre)
          ),
          pagos:agenda_turno_pagos(
            id,
            tipo,
            monto,
            notas,
            fecha_pago
          )
        `)
        .eq('duenio_id', duenioId)
        .eq('estado', 'completado')
        .order('fecha', { ascending: false })
        .limit(500) // Límite para optimizar

      if (errorTurnos) throw errorTurnos

      // Filtrar turnos que tengan al menos un pago dentro del rango de fechas
      const turnosFiltradosPorPago = (turnos || []).filter(turno => {
        if (!turno.pagos || turno.pagos.length === 0) return false

        // Verificar si algún pago está dentro del rango
        return turno.pagos.some(pago => {
          if (!pago.fecha_pago) return false
          const fechaPago = pago.fecha_pago.split('T')[0]
          return fechaPago >= fechaInicio && fechaPago <= fechaFin
        })
      })

      // Obtener IDs de turnos filtrados para buscar facturas asociadas
      const turnoIds = turnosFiltradosPorPago.map(t => t.id)

      // Obtener todos los comprobantes de estos turnos (facturas y N/C)
      let comprobantesMap = {}
      if (turnoIds.length > 0) {
        const { data: comprobantes, error: errorComprobantes } = await supabase
          .from('agenda_facturas')
          .select('id, turno_id, tipo_comprobante, numero_comprobante, punto_venta, cae, cae_vencimiento, fecha_comprobante, importe_total, descripcion, created_at')
          .eq('duenio_id', duenioId)
          .in('turno_id', turnoIds)
          .order('created_at', { ascending: false })

        if (errorComprobantes) {
          console.error('Error cargando comprobantes:', errorComprobantes)
        } else {
          // Crear mapa de turno_id -> último comprobante
          comprobantes?.forEach(c => {
            // Solo guardar el primero (más reciente) de cada turno
            if (!comprobantesMap[c.turno_id]) {
              comprobantesMap[c.turno_id] = c
            }
          })
        }
      }

      // Procesar turnos filtrados para agregar info de facturación
      const turnosProcesados = turnosFiltradosPorPago.map(turno => {
        // Calcular total de pagos (sin devoluciones)
        const totalPagos = turno.pagos?.reduce((sum, p) => {
          if (p.tipo === 'devolucion') return sum - p.monto
          return sum + p.monto
        }, 0) || 0

        // Determinar método de pago principal
        const pagosPrincipales = turno.pagos?.filter(p => p.tipo !== 'devolucion') || []
        const metodoPrincipal = pagosPrincipales.length > 0
          ? extraerMetodo(pagosPrincipales[0].notas)
          : 'Otro'

        const categoria = pagosPrincipales.length > 0
          ? categorizarMetodo(pagosPrincipales[0].notas)
          : 'otros'

        // Determinar estado según el último comprobante
        const ultimoComprobante = comprobantesMap[turno.id]
        let estadoFacturacion = 'sin_facturar'
        let estaFacturado = false

        if (ultimoComprobante) {
          // tipo_comprobante: 11 = Factura C, 13 = Nota de Crédito C
          if (ultimoComprobante.tipo_comprobante === 13) {
            estadoFacturacion = 'anulado' // N/C anulado
            estaFacturado = false // Para que no cuente en totales de facturado
          } else if (ultimoComprobante.tipo_comprobante === 11) {
            estadoFacturacion = 'facturado'
            estaFacturado = true
          }
        }

        // Nombre del cliente
        const nombreCliente = turno.cliente
          ? `${turno.cliente.nombre} ${turno.cliente.apellido || ''}`.trim()
          : 'Sin cliente'

        // Servicios
        const serviciosNombres = turno.servicios
          ?.map(s => s.servicio?.nombre)
          .filter(Boolean)
          .join(', ') || 'Sin servicios'

        return {
          ...turno,
          totalPagos,
          metodoPago: metodoPrincipal,
          categoria,
          estaFacturado,
          estadoFacturacion,
          nombreCliente,
          serviciosNombres,
          facturaInfo: ultimoComprobante || null
        }
      })

      // Aplicar filtros
      let turnosFiltrados = turnosProcesados

      // Filtrar por búsqueda
      if (busqueda.trim()) {
        const busquedaLower = busqueda.toLowerCase()
        turnosFiltrados = turnosFiltrados.filter(t =>
          t.nombreCliente.toLowerCase().includes(busquedaLower)
        )
      }

      // Filtrar por estado
      if (filtroEstado !== 'todos') {
        turnosFiltrados = turnosFiltrados.filter(t => t.estadoFacturacion === filtroEstado)
      }

      // Filtrar por tipo de pago
      if (filtroTipoPago !== 'todos') {
        turnosFiltrados = turnosFiltrados.filter(t => {
          const cat = t.categoria === 'electronico' ? 'electronicos' : t.categoria
          return cat === filtroTipoPago
        })
      }

      setTurnosConPagos(turnosFiltrados)

      // Calcular totales por categoría
      const nuevosTotales = {
        electronicos: { total: 0, sinFacturar: 0, facturado: 0, cantidad: 0 },
        efectivo: { total: 0, sinFacturar: 0, facturado: 0, cantidad: 0 },
        otros: { total: 0, sinFacturar: 0, facturado: 0, cantidad: 0 }
      }

      turnosFiltrados.forEach(turno => {
        const cat = turno.categoria === 'electronico' ? 'electronicos' : turno.categoria
        const totalesCat = nuevosTotales[cat] || nuevosTotales.otros

        totalesCat.total += turno.totalPagos
        totalesCat.cantidad++

        if (turno.estaFacturado) {
          totalesCat.facturado += turno.totalPagos
        } else {
          totalesCat.sinFacturar += turno.totalPagos
        }
      })

      setTotales(nuevosTotales)
      setSeleccionados([]) // Limpiar selección al cambiar filtros

    } catch (err) {
      console.error('Error cargando turnos para facturar:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [duenioId, calcularRangoFechas, busqueda, filtroEstado, filtroTipoPago])

  // Cargar al cambiar filtros
  useEffect(() => {
    cargarTurnos()
  }, [cargarTurnos])

  // Seleccionar/deseleccionar turno
  const toggleSeleccion = (turnoId) => {
    setSeleccionados(prev => {
      if (prev.includes(turnoId)) {
        return prev.filter(id => id !== turnoId)
      }
      return [...prev, turnoId]
    })
  }

  // Seleccionar todos de una categoría
  const seleccionarTodos = (categoria) => {
    const turnosCategoria = turnosConPagos
      .filter(t => {
        const cat = t.categoria === 'electronico' ? 'electronicos' : t.categoria
        return cat === categoria && !t.estaFacturado
      })
      .map(t => t.id)

    setSeleccionados(prev => {
      const nuevos = [...prev]
      turnosCategoria.forEach(id => {
        if (!nuevos.includes(id)) {
          nuevos.push(id)
        }
      })
      return nuevos
    })
  }

  // Deseleccionar todos de una categoría
  const deseleccionarTodos = (categoria) => {
    const turnosCategoria = turnosConPagos
      .filter(t => {
        const cat = t.categoria === 'electronico' ? 'electronicos' : t.categoria
        return cat === categoria
      })
      .map(t => t.id)

    setSeleccionados(prev => prev.filter(id => !turnosCategoria.includes(id)))
  }

  // Facturar un turno individual
  const facturarTurno = async (turno) => {
    if (!duenioId) throw new Error('No hay usuario autenticado')

    // Verificar si ya está facturado (doble check en DB)
    const { data: facturaExistente } = await supabase
      .from('agenda_facturas')
      .select('id, numero_comprobante, punto_venta')
      .eq('turno_id', turno.id)
      .maybeSingle()

    if (facturaExistente) {
      throw new Error(`Este turno ya fue facturado (Factura ${String(facturaExistente.punto_venta).padStart(5, '0')}-${String(facturaExistente.numero_comprobante).padStart(8, '0')})`)
    }

    // Determinar datos del receptor
    let receptorTipoDoc = TIPOS_DOCUMENTO.CONSUMIDOR_FINAL
    let receptorNroDoc = '0'
    let receptorNombre = 'Consumidor Final'

    if (turno.cliente?.cuit && turno.cliente.cuit.length === 11) {
      receptorTipoDoc = TIPOS_DOCUMENTO.CUIT
      receptorNroDoc = turno.cliente.cuit
      receptorNombre = turno.nombreCliente
    } else if (turno.nombreCliente && turno.nombreCliente !== 'Sin cliente') {
      receptorNombre = turno.nombreCliente
    }

    // Datos de la factura para emitir (y guardar en pendientes si falla)
    const datosFactura = {
      importeTotal: turno.totalPagos,
      receptorTipoDoc,
      receptorNroDoc,
      receptorNombre,
      fechaServicioDesde: turno.fecha,
      fechaServicioHasta: turno.fecha,
      descripcion: turno.serviciosNombres,
      turnoId: turno.id
    }

    try {
      const resultado = await emitirFacturaC(duenioId, datosFactura)

      // Recargar datos
      await cargarTurnos()

      return resultado
    } catch (err) {
      // Si es error de conexión, guardar en pendientes
      if (esErrorDeConexion(err)) {
        await guardarFacturaPendiente({
          userId: duenioId,
          turnoId: turno.id,
          tipoComprobante: TIPOS_COMPROBANTE.FACTURA_C,
          datosFactura,
          error: err
        })

        // Lanzar error especial para que la UI sepa que se guardó en pendientes
        const errorPendiente = new Error('ARCA no disponible. La factura se guardó en pendientes para reintentar más tarde.')
        errorPendiente.guardadoEnPendientes = true
        throw errorPendiente
      }

      // Si es otro tipo de error, lanzarlo normalmente
      throw err
    }
  }

  // Facturar múltiples turnos (lote)
  const facturarLote = async (turnosIds) => {
    if (!duenioId) throw new Error('No hay usuario autenticado')

    // Verificar cuáles ya están facturados en DB (doble check)
    const { data: facturasExistentes } = await supabase
      .from('agenda_facturas')
      .select('turno_id')
      .in('turno_id', turnosIds)

    const turnosYaFacturados = new Set((facturasExistentes || []).map(f => f.turno_id))

    const turnosAFacturar = turnosConPagos.filter(t =>
      turnosIds.includes(t.id) &&
      !t.estaFacturado &&
      !turnosYaFacturados.has(t.id)
    )

    // Agrupar por cliente con CUIT
    const porCliente = {}
    const consumidorFinal = []

    turnosAFacturar.forEach(turno => {
      if (turno.cliente?.cuit && turno.cliente.cuit.length === 11) {
        const cuit = turno.cliente.cuit
        if (!porCliente[cuit]) {
          porCliente[cuit] = {
            cliente: turno.cliente,
            nombreCliente: turno.nombreCliente,
            turnos: []
          }
        }
        porCliente[cuit].turnos.push(turno)
      } else {
        consumidorFinal.push(turno)
      }
    })

    const resultados = []
    const errores = []

    // Facturar agrupados por cliente (1 factura por cliente)
    for (const cuit of Object.keys(porCliente)) {
      const grupo = porCliente[cuit]
      const totalGrupo = grupo.turnos.reduce((sum, t) => sum + t.totalPagos, 0)
      const serviciosGrupo = grupo.turnos.map(t => t.serviciosNombres).join(' | ')
      const fechaMin = grupo.turnos.reduce((min, t) => t.fecha < min ? t.fecha : min, grupo.turnos[0].fecha)
      const fechaMax = grupo.turnos.reduce((max, t) => t.fecha > max ? t.fecha : max, grupo.turnos[0].fecha)

      const datosFactura = {
        importeTotal: totalGrupo,
        receptorTipoDoc: TIPOS_DOCUMENTO.CUIT,
        receptorNroDoc: cuit,
        receptorNombre: grupo.nombreCliente,
        fechaServicioDesde: fechaMin,
        fechaServicioHasta: fechaMax,
        descripcion: serviciosGrupo,
        turnoId: grupo.turnos[0].id
      }

      try {
        const resultado = await emitirFacturaC(duenioId, datosFactura)

        // Actualizar los demás turnos para marcarlos como facturados
        // (se asocian a la misma factura)
        for (let i = 1; i < grupo.turnos.length; i++) {
          await supabase
            .from('agenda_facturas')
            .update({ turno_id: grupo.turnos[i].id })
            .eq('id', resultado.facturaDb?.id)
        }

        resultados.push({
          tipo: 'agrupado',
          cliente: grupo.nombreCliente,
          turnos: grupo.turnos.length,
          total: totalGrupo,
          factura: resultado.factura,
          advertencia: resultado.advertencia,
          servicio_nombre: serviciosGrupo
        })
      } catch (err) {
        // Si es error de conexión, guardar en pendientes
        if (esErrorDeConexion(err)) {
          await guardarFacturaPendiente({
            userId: duenioId,
            turnoId: grupo.turnos[0].id,
            tipoComprobante: TIPOS_COMPROBANTE.FACTURA_C,
            datosFactura,
            error: err
          })
          errores.push({
            cliente: grupo.nombreCliente,
            error: 'ARCA no disponible. Guardado en pendientes.',
            guardadoEnPendientes: true
          })
        } else {
          errores.push({
            cliente: grupo.nombreCliente,
            error: err.message
          })
        }
      }
    }

    // Facturar consumidor final (1 factura por turno)
    for (const turno of consumidorFinal) {
      const datosFactura = {
        importeTotal: turno.totalPagos,
        receptorTipoDoc: TIPOS_DOCUMENTO.CONSUMIDOR_FINAL,
        receptorNroDoc: '0',
        receptorNombre: turno.nombreCliente !== 'Sin cliente' ? turno.nombreCliente : 'Consumidor Final',
        fechaServicioDesde: turno.fecha,
        fechaServicioHasta: turno.fecha,
        descripcion: turno.serviciosNombres,
        turnoId: turno.id
      }

      try {
        const resultado = await emitirFacturaC(duenioId, datosFactura)

        resultados.push({
          tipo: 'individual',
          cliente: turno.nombreCliente,
          turnos: 1,
          total: turno.totalPagos,
          factura: resultado.factura,
          advertencia: resultado.advertencia,
          servicio_nombre: turno.serviciosNombres
        })
      } catch (err) {
        // Si es error de conexión, guardar en pendientes
        if (esErrorDeConexion(err)) {
          await guardarFacturaPendiente({
            userId: duenioId,
            turnoId: turno.id,
            tipoComprobante: TIPOS_COMPROBANTE.FACTURA_C,
            datosFactura,
            error: err
          })
          errores.push({
            cliente: turno.nombreCliente,
            error: 'ARCA no disponible. Guardado en pendientes.',
            guardadoEnPendientes: true
          })
        } else {
          errores.push({
            cliente: turno.nombreCliente,
            error: err.message
          })
        }
      }
    }

    // Recargar datos
    await cargarTurnos()

    return { resultados, errores }
  }

  // Obtener turnos por categoría
  const getTurnosPorCategoria = (categoria) => {
    return turnosConPagos.filter(t => {
      const cat = t.categoria === 'electronico' ? 'electronicos' : t.categoria
      return cat === categoria
    })
  }

  // Verificar si todos de una categoría están seleccionados
  const todosSeleccionados = (categoria) => {
    const turnosCategoria = getTurnosPorCategoria(categoria).filter(t => !t.estaFacturado)
    if (turnosCategoria.length === 0) return false
    return turnosCategoria.every(t => seleccionados.includes(t.id))
  }

  return {
    // Estado
    loading,
    error,
    mes,
    filtroPeriodo,
    fechaDesde,
    fechaHasta,
    busqueda,
    filtroEstado,
    filtroTipoPago,
    turnosConPagos,
    seleccionados,
    totales,

    // Setters
    setMes,
    setFiltroPeriodo,
    setFechaDesde,
    setFechaHasta,
    setBusqueda,
    setFiltroEstado,
    setFiltroTipoPago,

    // Acciones
    recargar: cargarTurnos,
    toggleSeleccion,
    seleccionarTodos,
    deseleccionarTodos,
    facturarTurno,
    facturarLote,

    // Helpers
    getTurnosPorCategoria,
    todosSeleccionados
  }
}

export default useFacturacionTurnos
