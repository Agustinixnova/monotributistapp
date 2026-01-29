/**
 * Servicio para generar reportes de facturación en Excel
 */

import * as XLSX from 'xlsx'
import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from '../../caja-diaria/services/empleadosService'
import { getNegocio } from './negocioService'
import { getConfiguracionAfip } from './afipService'

// Tipos de comprobante
const TIPOS_COMPROBANTE = {
  FACTURA_C: 11,
  NOTA_DEBITO_C: 12,
  NOTA_CREDITO_C: 13
}

/**
 * Calcular rango de fechas según el período
 */
function calcularRangoFechas(periodo, mesSeleccionado, fechaDesde, fechaHasta) {
  const hoy = new Date()
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())

  switch (periodo) {
    case 'hoy': {
      const fecha = hoySinHora.toISOString().split('T')[0]
      return { inicio: fecha, fin: fecha, nombrePeriodo: 'Hoy' }
    }
    case 'ayer': {
      const ayer = new Date(hoySinHora)
      ayer.setDate(ayer.getDate() - 1)
      const fecha = ayer.toISOString().split('T')[0]
      return { inicio: fecha, fin: fecha, nombrePeriodo: 'Ayer' }
    }
    case 'semana': {
      const inicioSemana = new Date(hoySinHora)
      const diaSemana = inicioSemana.getDay()
      const diff = diaSemana === 0 ? -6 : 1 - diaSemana
      inicioSemana.setDate(inicioSemana.getDate() + diff)
      return {
        inicio: inicioSemana.toISOString().split('T')[0],
        fin: hoySinHora.toISOString().split('T')[0],
        nombrePeriodo: 'Semana actual'
      }
    }
    case 'personalizado': {
      return {
        inicio: fechaDesde || hoySinHora.toISOString().split('T')[0],
        fin: fechaHasta || hoySinHora.toISOString().split('T')[0],
        nombrePeriodo: `${fechaDesde} a ${fechaHasta}`
      }
    }
    case 'mes':
    default: {
      const [year, month] = mesSeleccionado.split('-')
      const inicioMes = `${year}-${month}-01`
      const finMes = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
      const nombreMes = new Date(parseInt(year), parseInt(month) - 1, 1)
        .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
      return {
        inicio: inicioMes,
        fin: finMes,
        nombrePeriodo: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)
      }
    }
  }
}

/**
 * Formatear monto como moneda
 */
function formatearMonto(monto) {
  return `$ ${new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(monto || 0)}`
}

/**
 * Formatear fecha
 */
function formatearFecha(fecha) {
  if (!fecha) return '-'
  const d = new Date(fecha + 'T12:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Formatear número de comprobante
 */
function formatearNumeroComprobante(puntoVenta, numero) {
  return `${String(puntoVenta || 0).padStart(5, '0')}-${String(numero || 0).padStart(8, '0')}`
}

/**
 * Obtener nombre del tipo de comprobante
 */
function getNombreTipoComprobante(tipo) {
  switch (tipo) {
    case TIPOS_COMPROBANTE.FACTURA_C: return 'Factura C'
    case TIPOS_COMPROBANTE.NOTA_DEBITO_C: return 'Nota de Débito C'
    case TIPOS_COMPROBANTE.NOTA_CREDITO_C: return 'Nota de Crédito C'
    default: return 'Comprobante'
  }
}

/**
 * Categorizar método de pago
 */
function categorizarMetodo(notas) {
  if (!notas) return 'otros'
  const notasLower = notas.toLowerCase()
  if (notasLower.includes('transferencia')) return 'electronico'
  if (notasLower.includes('mercadopago')) return 'electronico'
  if (notasLower.includes('qr')) return 'electronico'
  if (notasLower.includes('efectivo')) return 'efectivo'
  return 'efectivo'
}

/**
 * Extraer método de pago
 */
function extraerMetodo(notas) {
  if (!notas) return 'Otro'
  if (notas.includes('Efectivo')) return 'Efectivo'
  if (notas.includes('Transferencia')) return 'Transferencia'
  if (notas.includes('MercadoPago')) return 'MercadoPago'
  if (notas.includes('QR')) return 'QR'
  return 'Otro'
}

/**
 * Generar reporte de facturación
 */
export async function generarReporteFacturacion(opciones) {
  const {
    incluirElectronicos,
    incluirEfectivo,
    desglosado,
    periodo,
    mesSeleccionado,
    fechaDesde,
    fechaHasta
  } = opciones

  const { userId } = await getEffectiveUserId()
  if (!userId) throw new Error('No hay usuario autenticado')

  // Obtener datos del usuario
  const { data: userData } = await supabase
    .from('usuarios_free')
    .select('nombre, apellido')
    .eq('id', userId)
    .maybeSingle()

  const nombreUsuario = userData
    ? `${userData.nombre || ''} ${userData.apellido || ''}`.trim()
    : 'Usuario'

  // Obtener datos del negocio
  const { data: negocioData } = await getNegocio()
  const nombreNegocio = negocioData?.nombre || 'Mi Negocio'

  // Obtener configuración AFIP
  const configAfip = await getConfiguracionAfip(userId)
  const cuitEmisor = configAfip?.cuit || '-'
  const cuitFormateado = cuitEmisor.length === 11
    ? `${cuitEmisor.slice(0, 2)}-${cuitEmisor.slice(2, 10)}-${cuitEmisor.slice(10)}`
    : cuitEmisor

  // Calcular rango de fechas
  const { inicio, fin, nombrePeriodo } = calcularRangoFechas(periodo, mesSeleccionado, fechaDesde, fechaHasta)

  // Obtener turnos completados con pagos
  const { data: turnos, error: errorTurnos } = await supabase
    .from('agenda_turnos')
    .select(`
      id,
      fecha,
      hora_inicio,
      notas,
      cliente:agenda_clientes(id, nombre, apellido, cuit),
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
    .eq('duenio_id', userId)
    .eq('estado', 'completado')
    .gte('fecha', inicio)
    .lte('fecha', fin)
    .order('fecha', { ascending: true })

  if (errorTurnos) throw errorTurnos

  // Obtener todos los comprobantes del período
  const { data: comprobantes, error: errorComprobantes } = await supabase
    .from('agenda_facturas')
    .select('*')
    .eq('duenio_id', userId)
    .gte('fecha_comprobante', inicio)
    .lte('fecha_comprobante', fin)
    .order('created_at', { ascending: true })

  if (errorComprobantes) throw errorComprobantes

  // Crear mapa de turno_id -> comprobantes
  const comprobantesPorTurno = {}
  comprobantes?.forEach(c => {
    if (!comprobantesPorTurno[c.turno_id]) {
      comprobantesPorTurno[c.turno_id] = []
    }
    comprobantesPorTurno[c.turno_id].push(c)
  })

  // Procesar turnos
  const turnosProcesados = (turnos || []).map(turno => {
    const totalPagos = turno.pagos?.reduce((sum, p) => {
      if (p.tipo === 'devolucion') return sum - p.monto
      return sum + p.monto
    }, 0) || 0

    const pagosPrincipales = turno.pagos?.filter(p => p.tipo !== 'devolucion') || []
    const metodoPrincipal = pagosPrincipales.length > 0
      ? extraerMetodo(pagosPrincipales[0].notas)
      : 'Otro'

    const categoria = pagosPrincipales.length > 0
      ? categorizarMetodo(pagosPrincipales[0].notas)
      : 'otros'

    const compsTurno = comprobantesPorTurno[turno.id] || []
    const ultimoComp = compsTurno.length > 0 ? compsTurno[compsTurno.length - 1] : null

    let estadoFacturacion = 'sin_facturar'
    if (ultimoComp) {
      if (ultimoComp.tipo_comprobante === TIPOS_COMPROBANTE.NOTA_CREDITO_C) {
        estadoFacturacion = 'anulado'
      } else if (ultimoComp.tipo_comprobante === TIPOS_COMPROBANTE.FACTURA_C) {
        estadoFacturacion = 'facturado'
      }
    }

    const nombreCliente = turno.cliente
      ? `${turno.cliente.nombre} ${turno.cliente.apellido || ''}`.trim()
      : 'Sin cliente'

    const serviciosNombres = turno.servicios
      ?.map(s => s.servicio?.nombre)
      .filter(Boolean)
      .join(', ') || 'Sin servicios'

    return {
      ...turno,
      totalPagos,
      metodoPago: metodoPrincipal,
      categoria,
      estadoFacturacion,
      nombreCliente,
      serviciosNombres,
      comprobantes: compsTurno
    }
  })

  // Filtrar por tipo de pago
  const turnosFiltrados = turnosProcesados.filter(t => {
    if (t.categoria === 'electronico' && incluirElectronicos) return true
    if (t.categoria === 'efectivo' && incluirEfectivo) return true
    return false
  })

  // Separar comprobantes por tipo
  const facturas = []
  const pendientes = []
  const notasCredito = []
  const notasDebito = []

  turnosFiltrados.forEach(turno => {
    const tipoPago = turno.categoria === 'electronico' ? 'Electrónico' : 'Efectivo'

    if (turno.estadoFacturacion === 'sin_facturar' || turno.estadoFacturacion === 'anulado') {
      pendientes.push({
        fecha: turno.fecha,
        hora: turno.hora_inicio?.substring(0, 5) || '',
        cliente: turno.nombreCliente,
        cuit: turno.cliente?.cuit || '-',
        servicio: turno.serviciosNombres,
        metodoPago: turno.metodoPago,
        tipoPago,
        total: turno.totalPagos,
        estado: turno.estadoFacturacion === 'anulado' ? 'N/C Emitida' : 'Pendiente'
      })
    }

    // Procesar comprobantes
    turno.comprobantes?.forEach(comp => {
      const datosComp = {
        fecha: comp.fecha_comprobante,
        cliente: comp.receptor_nombre || turno.nombreCliente,
        cuit: comp.receptor_nro_doc || turno.cliente?.cuit || '-',
        servicio: comp.descripcion || turno.serviciosNombres,
        metodoPago: turno.metodoPago,
        tipoPago,
        puntoVenta: comp.punto_venta,
        numeroComprobante: comp.numero_comprobante,
        numeroFormateado: formatearNumeroComprobante(comp.punto_venta, comp.numero_comprobante),
        cae: comp.cae,
        caeVencimiento: comp.cae_vencimiento,
        subtotal: comp.importe_total,
        total: comp.importe_total
      }

      if (comp.tipo_comprobante === TIPOS_COMPROBANTE.FACTURA_C) {
        facturas.push(datosComp)
      } else if (comp.tipo_comprobante === TIPOS_COMPROBANTE.NOTA_CREDITO_C) {
        notasCredito.push({
          ...datosComp,
          facturaAnulada: comp.comprobante_asociado_nro
            ? formatearNumeroComprobante(comp.comprobante_asociado_pto_vta, comp.comprobante_asociado_nro)
            : '-'
        })
      } else if (comp.tipo_comprobante === TIPOS_COMPROBANTE.NOTA_DEBITO_C) {
        notasDebito.push(datosComp)
      }
    })
  })

  // Calcular totales
  const totales = {
    electronicos: {
      facturado: turnosFiltrados.filter(t => t.categoria === 'electronico' && t.estadoFacturacion === 'facturado')
        .reduce((sum, t) => sum + t.totalPagos, 0),
      pendiente: turnosFiltrados.filter(t => t.categoria === 'electronico' && t.estadoFacturacion !== 'facturado')
        .reduce((sum, t) => sum + t.totalPagos, 0),
      notasCredito: notasCredito.filter(nc => nc.tipoPago === 'Electrónico')
        .reduce((sum, nc) => sum + nc.total, 0)
    },
    efectivo: {
      facturado: turnosFiltrados.filter(t => t.categoria === 'efectivo' && t.estadoFacturacion === 'facturado')
        .reduce((sum, t) => sum + t.totalPagos, 0),
      pendiente: turnosFiltrados.filter(t => t.categoria === 'efectivo' && t.estadoFacturacion !== 'facturado')
        .reduce((sum, t) => sum + t.totalPagos, 0),
      notasCredito: notasCredito.filter(nc => nc.tipoPago === 'Efectivo')
        .reduce((sum, nc) => sum + nc.total, 0)
    }
  }

  // Crear workbook
  const wb = XLSX.utils.book_new()

  // Hoja 1: Resumen
  const resumenData = [
    ['REPORTE DE FACTURACIÓN'],
    [''],
    ['Negocio:', nombreNegocio],
    ['Titular:', nombreUsuario],
    ['CUIT:', cuitFormateado],
    [''],
    ['Período:', nombrePeriodo],
    ['Fecha de generación:', new Date().toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })],
    [''],
    [''],
    ['RESUMEN GENERAL'],
    [''],
  ]

  if (incluirElectronicos) {
    resumenData.push(
      ['PAGOS ELECTRÓNICOS'],
      ['Facturado:', formatearMonto(totales.electronicos.facturado)],
      ['Pendiente de facturar:', formatearMonto(totales.electronicos.pendiente)],
      ['Notas de Crédito emitidas:', formatearMonto(totales.electronicos.notasCredito)],
      ['']
    )
  }

  if (incluirEfectivo) {
    resumenData.push(
      ['PAGOS EN EFECTIVO'],
      ['Facturado:', formatearMonto(totales.efectivo.facturado)],
      ['Pendiente de facturar:', formatearMonto(totales.efectivo.pendiente)],
      ['Notas de Crédito emitidas:', formatearMonto(totales.efectivo.notasCredito)],
      ['']
    )
  }

  const totalGeneral = (incluirElectronicos ? totales.electronicos.facturado + totales.electronicos.pendiente : 0) +
                       (incluirEfectivo ? totales.efectivo.facturado + totales.efectivo.pendiente : 0)
  const totalFacturado = (incluirElectronicos ? totales.electronicos.facturado : 0) +
                         (incluirEfectivo ? totales.efectivo.facturado : 0)
  const totalPendiente = (incluirElectronicos ? totales.electronicos.pendiente : 0) +
                         (incluirEfectivo ? totales.efectivo.pendiente : 0)
  const totalNC = (incluirElectronicos ? totales.electronicos.notasCredito : 0) +
                  (incluirEfectivo ? totales.efectivo.notasCredito : 0)

  resumenData.push(
    [''],
    ['TOTALES'],
    ['Total general:', formatearMonto(totalGeneral)],
    ['Total facturado:', formatearMonto(totalFacturado)],
    ['Total pendiente:', formatearMonto(totalPendiente)],
    ['Total N/C emitidas:', formatearMonto(totalNC)],
    [''],
    [''],
    ['Cantidad de comprobantes:'],
    ['Facturas:', facturas.length],
    ['Pendientes:', pendientes.length],
    ['Notas de Crédito:', notasCredito.length],
    ['Notas de Débito:', notasDebito.length]
  )

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
  wsResumen['!cols'] = [{ wch: 30 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  if (desglosado) {
    // Hoja 2: Facturados
    if (facturas.length > 0) {
      const facturasData = [
        ['COMPROBANTES FACTURADOS'],
        [''],
        ['Fecha', 'Cliente', 'CUIT', 'Servicio', 'Tipo Pago', 'Método', 'Nro Factura', 'CAE', 'Vto CAE', 'Subtotal', 'Total']
      ]

      // Separar por tipo de pago
      const facturasElectronicas = facturas.filter(f => f.tipoPago === 'Electrónico')
      const facturasEfectivo = facturas.filter(f => f.tipoPago === 'Efectivo')

      if (facturasElectronicas.length > 0) {
        facturasData.push(['', '', '', '', '', '', '', '', '', '', ''])
        facturasData.push(['--- PAGOS ELECTRÓNICOS ---', '', '', '', '', '', '', '', '', '', ''])
        facturasElectronicas.forEach(f => {
          facturasData.push([
            formatearFecha(f.fecha),
            f.cliente,
            f.cuit,
            f.servicio,
            f.tipoPago,
            f.metodoPago,
            f.numeroFormateado,
            f.cae,
            f.caeVencimiento || '-',
            formatearMonto(f.subtotal),
            formatearMonto(f.total)
          ])
        })
        facturasData.push(['', '', '', '', '', '', '', '', 'Subtotal Electrónicos:', '',
          formatearMonto(facturasElectronicas.reduce((s, f) => s + f.total, 0))])
      }

      if (facturasEfectivo.length > 0) {
        facturasData.push(['', '', '', '', '', '', '', '', '', '', ''])
        facturasData.push(['--- PAGOS EN EFECTIVO ---', '', '', '', '', '', '', '', '', '', ''])
        facturasEfectivo.forEach(f => {
          facturasData.push([
            formatearFecha(f.fecha),
            f.cliente,
            f.cuit,
            f.servicio,
            f.tipoPago,
            f.metodoPago,
            f.numeroFormateado,
            f.cae,
            f.caeVencimiento || '-',
            formatearMonto(f.subtotal),
            formatearMonto(f.total)
          ])
        })
        facturasData.push(['', '', '', '', '', '', '', '', 'Subtotal Efectivo:', '',
          formatearMonto(facturasEfectivo.reduce((s, f) => s + f.total, 0))])
      }

      facturasData.push(['', '', '', '', '', '', '', '', '', '', ''])
      facturasData.push(['', '', '', '', '', '', '', '', 'TOTAL FACTURADO:', '',
        formatearMonto(facturas.reduce((s, f) => s + f.total, 0))])

      const wsFacturas = XLSX.utils.aoa_to_sheet(facturasData)
      wsFacturas['!cols'] = [
        { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 12 },
        { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 14 }
      ]
      XLSX.utils.book_append_sheet(wb, wsFacturas, 'Facturados')
    }

    // Hoja 3: Pendientes
    if (pendientes.length > 0) {
      const pendientesData = [
        ['PENDIENTES DE FACTURAR'],
        [''],
        ['Fecha', 'Hora', 'Cliente', 'CUIT', 'Servicio', 'Tipo Pago', 'Método', 'Estado', 'Total']
      ]

      const pendientesElectronicos = pendientes.filter(p => p.tipoPago === 'Electrónico')
      const pendientesEfectivo = pendientes.filter(p => p.tipoPago === 'Efectivo')

      if (pendientesElectronicos.length > 0) {
        pendientesData.push(['', '', '', '', '', '', '', '', ''])
        pendientesData.push(['--- PAGOS ELECTRÓNICOS ---', '', '', '', '', '', '', '', ''])
        pendientesElectronicos.forEach(p => {
          pendientesData.push([
            formatearFecha(p.fecha),
            p.hora,
            p.cliente,
            p.cuit,
            p.servicio,
            p.tipoPago,
            p.metodoPago,
            p.estado,
            formatearMonto(p.total)
          ])
        })
        pendientesData.push(['', '', '', '', '', '', '', 'Subtotal Electrónicos:',
          formatearMonto(pendientesElectronicos.reduce((s, p) => s + p.total, 0))])
      }

      if (pendientesEfectivo.length > 0) {
        pendientesData.push(['', '', '', '', '', '', '', '', ''])
        pendientesData.push(['--- PAGOS EN EFECTIVO ---', '', '', '', '', '', '', '', ''])
        pendientesEfectivo.forEach(p => {
          pendientesData.push([
            formatearFecha(p.fecha),
            p.hora,
            p.cliente,
            p.cuit,
            p.servicio,
            p.tipoPago,
            p.metodoPago,
            p.estado,
            formatearMonto(p.total)
          ])
        })
        pendientesData.push(['', '', '', '', '', '', '', 'Subtotal Efectivo:',
          formatearMonto(pendientesEfectivo.reduce((s, p) => s + p.total, 0))])
      }

      pendientesData.push(['', '', '', '', '', '', '', '', ''])
      pendientesData.push(['', '', '', '', '', '', '', 'TOTAL PENDIENTE:',
        formatearMonto(pendientes.reduce((s, p) => s + p.total, 0))])

      const wsPendientes = XLSX.utils.aoa_to_sheet(pendientesData)
      wsPendientes['!cols'] = [
        { wch: 12 }, { wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 30 },
        { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 }
      ]
      XLSX.utils.book_append_sheet(wb, wsPendientes, 'Pendientes')
    }

    // Hoja 4: Notas de Crédito
    if (notasCredito.length > 0) {
      const ncData = [
        ['NOTAS DE CRÉDITO'],
        [''],
        ['Fecha', 'Cliente', 'CUIT', 'Descripción', 'Tipo Pago', 'Nro N/C', 'Factura Anulada', 'CAE', 'Total']
      ]

      const ncElectronicas = notasCredito.filter(nc => nc.tipoPago === 'Electrónico')
      const ncEfectivo = notasCredito.filter(nc => nc.tipoPago === 'Efectivo')

      if (ncElectronicas.length > 0) {
        ncData.push(['', '', '', '', '', '', '', '', ''])
        ncData.push(['--- PAGOS ELECTRÓNICOS ---', '', '', '', '', '', '', '', ''])
        ncElectronicas.forEach(nc => {
          ncData.push([
            formatearFecha(nc.fecha),
            nc.cliente,
            nc.cuit,
            nc.servicio,
            nc.tipoPago,
            nc.numeroFormateado,
            nc.facturaAnulada,
            nc.cae,
            formatearMonto(nc.total)
          ])
        })
        ncData.push(['', '', '', '', '', '', '', 'Subtotal Electrónicos:',
          formatearMonto(ncElectronicas.reduce((s, nc) => s + nc.total, 0))])
      }

      if (ncEfectivo.length > 0) {
        ncData.push(['', '', '', '', '', '', '', '', ''])
        ncData.push(['--- PAGOS EN EFECTIVO ---', '', '', '', '', '', '', '', ''])
        ncEfectivo.forEach(nc => {
          ncData.push([
            formatearFecha(nc.fecha),
            nc.cliente,
            nc.cuit,
            nc.servicio,
            nc.tipoPago,
            nc.numeroFormateado,
            nc.facturaAnulada,
            nc.cae,
            formatearMonto(nc.total)
          ])
        })
        ncData.push(['', '', '', '', '', '', '', 'Subtotal Efectivo:',
          formatearMonto(ncEfectivo.reduce((s, nc) => s + nc.total, 0))])
      }

      ncData.push(['', '', '', '', '', '', '', '', ''])
      ncData.push(['', '', '', '', '', '', '', 'TOTAL N/C:',
        formatearMonto(notasCredito.reduce((s, nc) => s + nc.total, 0))])

      const wsNC = XLSX.utils.aoa_to_sheet(ncData)
      wsNC['!cols'] = [
        { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 35 }, { wch: 12 },
        { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 14 }
      ]
      XLSX.utils.book_append_sheet(wb, wsNC, 'Notas de Crédito')
    }

    // Hoja 5: Notas de Débito
    if (notasDebito.length > 0) {
      const ndData = [
        ['NOTAS DE DÉBITO'],
        [''],
        ['Fecha', 'Cliente', 'CUIT', 'Descripción', 'Tipo Pago', 'Nro N/D', 'CAE', 'Total']
      ]

      const ndElectronicas = notasDebito.filter(nd => nd.tipoPago === 'Electrónico')
      const ndEfectivo = notasDebito.filter(nd => nd.tipoPago === 'Efectivo')

      if (ndElectronicas.length > 0) {
        ndData.push(['', '', '', '', '', '', '', ''])
        ndData.push(['--- PAGOS ELECTRÓNICOS ---', '', '', '', '', '', '', ''])
        ndElectronicas.forEach(nd => {
          ndData.push([
            formatearFecha(nd.fecha),
            nd.cliente,
            nd.cuit,
            nd.servicio,
            nd.tipoPago,
            nd.numeroFormateado,
            nd.cae,
            formatearMonto(nd.total)
          ])
        })
        ndData.push(['', '', '', '', '', '', 'Subtotal Electrónicos:',
          formatearMonto(ndElectronicas.reduce((s, nd) => s + nd.total, 0))])
      }

      if (ndEfectivo.length > 0) {
        ndData.push(['', '', '', '', '', '', '', ''])
        ndData.push(['--- PAGOS EN EFECTIVO ---', '', '', '', '', '', '', ''])
        ndEfectivo.forEach(nd => {
          ndData.push([
            formatearFecha(nd.fecha),
            nd.cliente,
            nd.cuit,
            nd.servicio,
            nd.tipoPago,
            nd.numeroFormateado,
            nd.cae,
            formatearMonto(nd.total)
          ])
        })
        ndData.push(['', '', '', '', '', '', 'Subtotal Efectivo:',
          formatearMonto(ndEfectivo.reduce((s, nd) => s + nd.total, 0))])
      }

      ndData.push(['', '', '', '', '', '', '', ''])
      ndData.push(['', '', '', '', '', '', 'TOTAL N/D:',
        formatearMonto(notasDebito.reduce((s, nd) => s + nd.total, 0))])

      const wsND = XLSX.utils.aoa_to_sheet(ndData)
      wsND['!cols'] = [
        { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 35 }, { wch: 12 },
        { wch: 18 }, { wch: 16 }, { wch: 14 }
      ]
      XLSX.utils.book_append_sheet(wb, wsND, 'Notas de Débito')
    }
  }

  // Generar nombre del archivo
  const fechaArchivo = new Date().toISOString().split('T')[0]
  const nombreArchivo = `Reporte_Facturacion_${nombrePeriodo.replace(/\s/g, '_')}_${fechaArchivo}.xlsx`

  // Descargar archivo
  XLSX.writeFile(wb, nombreArchivo)

  return { success: true, nombreArchivo }
}
