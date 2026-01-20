/**
 * Funciones para exportar reporte de movimientos de cuenta corriente a PDF y Excel
 * Formato contable: Debe / Haber / Saldo
 */

import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { formatearMonto } from './formatters'

/**
 * Genera y descarga PDF del reporte de movimientos
 */
export function descargarPDFMovimientosCuenta({ datos, nombreNegocio, nombreCliente, fechaDesde, fechaHasta, totalDebe, totalHaber, esClienteIndividual }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let y = 20

  // Colores
  const amber = [245, 158, 11]
  const rojo = [220, 38, 38]
  const verde = [16, 185, 129]
  const gris = [107, 114, 128]

  // Formatear fecha
  const formatFecha = (fecha) => {
    if (!fecha) return ''
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR')
  }

  // Fecha actual
  const fechaHora = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'short',
    timeStyle: 'short'
  })

  // === HEADER ===
  doc.setFillColor(...amber)
  doc.rect(0, 0, pageWidth, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('MOVIMIENTOS DE CUENTA CORRIENTE', pageWidth / 2, 13, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(nombreNegocio, pageWidth / 2, 21, { align: 'center' })

  // Info del filtro
  let subtitulo = nombreCliente || 'Todos los clientes'
  if (fechaDesde && fechaHasta) {
    subtitulo += ` | ${formatFecha(fechaDesde)} - ${formatFecha(fechaHasta)}`
  } else {
    subtitulo += ' | Todo el historial'
  }
  doc.text(subtitulo, pageWidth / 2, 29, { align: 'center' })

  y = 45

  // === RESUMEN ===
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 18, 3, 3, 'F')

  y += 7
  doc.setFontSize(10)

  // Total Debe
  doc.setTextColor(...rojo)
  doc.setFont('helvetica', 'normal')
  doc.text('Total Debe:', margin + 5, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatearMonto(totalDebe), margin + 32, y)

  // Total Haber
  doc.setTextColor(...verde)
  doc.setFont('helvetica', 'normal')
  doc.text('Total Haber:', margin + 70, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatearMonto(totalHaber), margin + 100, y)

  // Saldo
  const saldo = totalDebe - totalHaber
  doc.setTextColor(saldo > 0 ? rojo[0] : verde[0], saldo > 0 ? rojo[1] : verde[1], saldo > 0 ? rojo[2] : verde[2])
  doc.setFont('helvetica', 'normal')
  doc.text('Saldo:', margin + 140, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatearMonto(saldo), margin + 157, y)

  y += 18

  // === DETALLE ===
  doc.setTextColor(...amber)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`DETALLE DE MOVIMIENTOS (${datos.length})`, margin, y)
  y += 6

  // Encabezados - varían según si es cliente individual o todos
  doc.setFillColor(...amber)
  doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  y += 5

  if (esClienteIndividual) {
    // Formato para cliente individual: Fecha, Descripción, Debe, Haber, Saldo
    doc.text('FECHA', margin + 2, y)
    doc.text('DESCRIPCIÓN', margin + 35, y)
    doc.text('DEBE', margin + 110, y)
    doc.text('HABER', margin + 135, y)
    doc.text('SALDO', margin + 162, y)
  } else {
    // Formato para todos los clientes: Fecha, Cliente, Descripción, Debe, Haber
    doc.text('FECHA', margin + 2, y)
    doc.text('CLIENTE', margin + 28, y)
    doc.text('DESCRIPCIÓN', margin + 80, y)
    doc.text('DEBE', margin + 130, y)
    doc.text('HABER', margin + 158, y)
  }
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)

  let saldoAcumulado = 0

  datos.forEach((mov, index) => {
    if (y > 275) {
      doc.addPage()
      y = 20
    }

    const esFiado = mov.tipo === 'fiado'
    const debe = esFiado ? parseFloat(mov.monto) : 0
    const haber = !esFiado ? parseFloat(mov.monto) : 0
    saldoAcumulado += debe - haber

    y += 4

    // Dibujar fondo alternado
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251)
      doc.rect(margin, y - 4, pageWidth - 2 * margin, 7, 'F')
    }

    // Fecha y hora
    doc.setTextColor(0, 0, 0)
    const fecha = formatFecha(mov.fecha)
    const hora = mov.hora ? mov.hora.substring(0, 5) : ''
    doc.text(`${fecha} ${hora}`, margin + 2, y)

    if (esClienteIndividual) {
      // Descripción
      doc.setTextColor(...gris)
      const desc = (mov.descripcion || mov.metodo_pago || '-').substring(0, 35)
      doc.text(desc, margin + 35, y)

      // Debe
      doc.setTextColor(...rojo)
      doc.setFont('helvetica', 'bold')
      doc.text(debe > 0 ? formatearMonto(debe) : '', margin + 110, y)

      // Haber
      doc.setTextColor(...verde)
      doc.text(haber > 0 ? formatearMonto(haber) : '', margin + 135, y)

      // Saldo acumulado
      doc.setTextColor(saldoAcumulado > 0 ? rojo[0] : verde[0], saldoAcumulado > 0 ? rojo[1] : verde[1], saldoAcumulado > 0 ? rojo[2] : verde[2])
      doc.text(formatearMonto(saldoAcumulado), margin + 162, y)
      doc.setFont('helvetica', 'normal')
    } else {
      // Cliente
      const clienteNombre = `${mov.cliente_nombre} ${mov.cliente_apellido || ''}`.substring(0, 22)
      doc.text(clienteNombre, margin + 28, y)

      // Descripción
      doc.setTextColor(...gris)
      const desc = (mov.descripcion || mov.metodo_pago || '-').substring(0, 22)
      doc.text(desc, margin + 80, y)

      // Debe
      doc.setTextColor(...rojo)
      doc.setFont('helvetica', 'bold')
      doc.text(debe > 0 ? formatearMonto(debe) : '', margin + 130, y)

      // Haber
      doc.setTextColor(...verde)
      doc.text(haber > 0 ? formatearMonto(haber) : '', margin + 158, y)
      doc.setFont('helvetica', 'normal')
    }

    y += 3
  })

  // Footer
  doc.setTextColor(...gris)
  doc.setFontSize(8)
  doc.text(`Generado el ${fechaHora}`, pageWidth / 2, 287, { align: 'center' })
  doc.text('MonoGestion - Caja Diaria', pageWidth / 2, 292, { align: 'center' })

  // Descargar
  const fechaArchivo = new Date().toISOString().split('T')[0]
  doc.save(`movimientos-cuenta-${fechaArchivo}.pdf`)
}

/**
 * Genera y descarga Excel del reporte de movimientos
 */
export function descargarExcelMovimientosCuenta({ datos, nombreNegocio, nombreCliente, fechaDesde, fechaHasta, totalDebe, totalHaber, esClienteIndividual }) {
  const fechaHora = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires'
  })

  const formatoMoneda = '"$"#,##0.00'

  // Formatear fecha
  const formatFecha = (fecha) => {
    if (!fecha) return ''
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR')
  }

  // Info del período
  let periodo = 'Todo el historial'
  if (fechaDesde && fechaHasta) {
    periodo = `${formatFecha(fechaDesde)} - ${formatFecha(fechaHasta)}`
  }

  const saldoFinal = totalDebe - totalHaber

  // Encabezados según tipo de reporte
  let headers, dataRows, colWidths

  if (esClienteIndividual) {
    // Cliente individual: con saldo acumulado
    headers = ['Fecha', 'Hora', 'Descripción', 'Debe', 'Haber', 'Saldo']
    let saldoAcumulado = 0
    dataRows = datos.map(m => {
      const debe = m.tipo === 'fiado' ? parseFloat(m.monto) : 0
      const haber = m.tipo !== 'fiado' ? parseFloat(m.monto) : 0
      saldoAcumulado += debe - haber
      return [
        m.fecha,
        m.hora ? m.hora.substring(0, 5) : '',
        m.descripcion || m.metodo_pago || '-',
        debe || '',
        haber || '',
        saldoAcumulado
      ]
    })
    colWidths = [
      { wch: 12 }, // Fecha
      { wch: 8 },  // Hora
      { wch: 35 }, // Descripción
      { wch: 15 }, // Debe
      { wch: 15 }, // Haber
      { wch: 15 }  // Saldo
    ]
  } else {
    // Todos los clientes: sin saldo acumulado
    headers = ['Fecha', 'Hora', 'Cliente', 'Descripción', 'Debe', 'Haber']
    dataRows = datos.map(m => {
      const debe = m.tipo === 'fiado' ? parseFloat(m.monto) : 0
      const haber = m.tipo !== 'fiado' ? parseFloat(m.monto) : 0
      return [
        m.fecha,
        m.hora ? m.hora.substring(0, 5) : '',
        `${m.cliente_nombre} ${m.cliente_apellido || ''}`.trim(),
        m.descripcion || m.metodo_pago || '-',
        debe || '',
        haber || ''
      ]
    })
    colWidths = [
      { wch: 12 }, // Fecha
      { wch: 8 },  // Hora
      { wch: 25 }, // Cliente
      { wch: 25 }, // Descripción
      { wch: 15 }, // Debe
      { wch: 15 }  // Haber
    ]
  }

  // Crear datos para el Excel
  const excelData = [
    ['MOVIMIENTOS DE CUENTA CORRIENTE'],
    [nombreNegocio],
    [`Cliente: ${nombreCliente || 'Todos'}`],
    [`Período: ${periodo}`],
    [`Generado: ${fechaHora}`],
    [],
    ['RESUMEN'],
    ['Total Debe', totalDebe],
    ['Total Haber', totalHaber],
    ['Saldo', saldoFinal],
    [],
    ['DETALLE'],
    headers,
    ...dataRows
  ]

  // Crear workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(excelData)

  // Ajustar ancho de columnas
  ws['!cols'] = colWidths

  // Aplicar formato de moneda al resumen
  if (ws['B8']) ws['B8'].z = formatoMoneda
  if (ws['B9']) ws['B9'].z = formatoMoneda
  if (ws['B10']) ws['B10'].z = formatoMoneda

  // Formato a columnas de datos (Debe, Haber, Saldo)
  const filaInicioData = 14
  const colDebe = esClienteIndividual ? 'D' : 'E'
  const colHaber = esClienteIndividual ? 'E' : 'F'
  const colSaldo = 'F'

  datos.forEach((_, index) => {
    const fila = filaInicioData + index
    if (ws[`${colDebe}${fila}`] && ws[`${colDebe}${fila}`].v) ws[`${colDebe}${fila}`].z = formatoMoneda
    if (ws[`${colHaber}${fila}`] && ws[`${colHaber}${fila}`].v) ws[`${colHaber}${fila}`].z = formatoMoneda
    if (esClienteIndividual && ws[`${colSaldo}${fila}`]) ws[`${colSaldo}${fila}`].z = formatoMoneda
  })

  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos')

  // Descargar
  const fechaArchivo = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `movimientos-cuenta-${fechaArchivo}.xlsx`)
}
