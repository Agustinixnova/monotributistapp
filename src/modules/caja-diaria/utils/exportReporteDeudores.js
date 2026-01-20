/**
 * Funciones para exportar reporte de deudores a PDF y Excel
 */

import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { formatearMonto } from './formatters'

/**
 * Genera y descarga PDF del reporte de deudores
 */
export function descargarPDFReporteDeudores({ datos, nombreNegocio, totalDeuda, totalAFavor, saldoNeto }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let y = 20

  // Colores
  const rojo = [220, 38, 38]
  const azul = [37, 99, 235]
  const verde = [16, 185, 129]
  const gris = [107, 114, 128]
  const naranja = [249, 115, 22]

  // Fecha actual
  const fechaHora = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'long',
    timeStyle: 'short'
  })

  // === HEADER ===
  doc.setFillColor(...rojo)
  doc.rect(0, 0, pageWidth, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE DE DEUDORES', pageWidth / 2, 15, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(nombreNegocio, pageWidth / 2, 23, { align: 'center' })
  doc.text(`Estado al ${fechaHora}`, pageWidth / 2, 30, { align: 'center' })

  y = 45

  // === RESUMEN CONSOLIDADO ===
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 25, 3, 3, 'F')

  y += 8
  doc.setFontSize(10)

  // Total deuda
  doc.setTextColor(...rojo)
  doc.setFont('helvetica', 'normal')
  doc.text('Total a cobrar:', margin + 5, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatearMonto(totalDeuda), margin + 40, y)

  // Total a favor
  doc.setTextColor(...azul)
  doc.setFont('helvetica', 'normal')
  doc.text('Total a favor:', margin + 75, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatearMonto(totalAFavor), margin + 105, y)

  y += 10
  doc.setTextColor(saldoNeto >= 0 ? verde[0] : naranja[0], saldoNeto >= 0 ? verde[1] : naranja[1], saldoNeto >= 0 ? verde[2] : naranja[2])
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('SALDO NETO A COBRAR:', margin + 5, y)
  doc.text(formatearMonto(saldoNeto), margin + 70, y)

  y += 20

  // === DETALLE ===
  const clientesConDeuda = datos.filter(c => c.saldo > 0)
  const clientesAFavor = datos.filter(c => c.saldo < 0)

  // Clientes con deuda
  if (clientesConDeuda.length > 0) {
    doc.setTextColor(...rojo)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`CLIENTES CON DEUDA (${clientesConDeuda.length})`, margin, y)
    y += 6

    // Encabezados
    doc.setFillColor(...rojo)
    doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    y += 5
    doc.text('CLIENTE', margin + 2, y)
    doc.text('TELÉFONO', margin + 55, y)
    doc.text('LÍMITE', margin + 95, y)
    doc.text('DÍAS', margin + 125, y)
    doc.text('SALDO', margin + 150, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)

    clientesConDeuda.forEach((cliente, index) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }

      y += 4

      // Dibujar fondo DESPUÉS de posicionar y, para que quede alineado con el texto
      if (index % 2 === 0) {
        doc.setFillColor(254, 242, 242)
        doc.rect(margin, y - 4, pageWidth - 2 * margin, 7, 'F')
      }

      const nombre = `${cliente.nombre} ${cliente.apellido || ''}`.substring(0, 25)
      const superaLimite = cliente.limite_credito && cliente.saldo > cliente.limite_credito

      doc.setTextColor(0, 0, 0)
      doc.text(nombre, margin + 2, y)

      doc.setTextColor(...gris)
      doc.text(cliente.telefono || '-', margin + 55, y)
      doc.text(cliente.limite_credito ? formatearMonto(cliente.limite_credito) : '-', margin + 95, y)
      doc.text(cliente.dias_deuda ? `${cliente.dias_deuda}d` : '-', margin + 128, y)

      doc.setTextColor(superaLimite ? naranja[0] : rojo[0], superaLimite ? naranja[1] : rojo[1], superaLimite ? naranja[2] : rojo[2])
      doc.setFont('helvetica', 'bold')
      doc.text(formatearMonto(cliente.saldo), margin + 150, y)
      doc.setFont('helvetica', 'normal')

      y += 3
    })

    y += 10
  }

  // Clientes a favor
  if (clientesAFavor.length > 0) {
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    doc.setTextColor(...azul)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`CLIENTES CON SALDO A FAVOR (${clientesAFavor.length})`, margin, y)
    y += 6

    // Encabezados
    doc.setFillColor(...azul)
    doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    y += 5
    doc.text('CLIENTE', margin + 2, y)
    doc.text('TELÉFONO', margin + 70, y)
    doc.text('SALDO A FAVOR', margin + 130, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)

    clientesAFavor.forEach((cliente, index) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }

      y += 4

      // Dibujar fondo DESPUÉS de posicionar y, para que quede alineado con el texto
      if (index % 2 === 0) {
        doc.setFillColor(239, 246, 255)
        doc.rect(margin, y - 4, pageWidth - 2 * margin, 7, 'F')
      }

      const nombre = `${cliente.nombre} ${cliente.apellido || ''}`.substring(0, 30)

      doc.setTextColor(0, 0, 0)
      doc.text(nombre, margin + 2, y)

      doc.setTextColor(...gris)
      doc.text(cliente.telefono || '-', margin + 70, y)

      doc.setTextColor(...azul)
      doc.setFont('helvetica', 'bold')
      doc.text(formatearMonto(Math.abs(cliente.saldo)), margin + 130, y)
      doc.setFont('helvetica', 'normal')

      y += 3
    })
  }

  // Footer
  doc.setTextColor(...gris)
  doc.setFontSize(8)
  doc.text('MonoGestion - Caja Diaria', pageWidth / 2, 290, { align: 'center' })

  // Descargar
  const fechaArchivo = new Date().toISOString().split('T')[0]
  doc.save(`reporte-deudores-${fechaArchivo}.pdf`)
}

/**
 * Genera y descarga Excel del reporte de deudores
 */
export function descargarExcelReporteDeudores({ datos, nombreNegocio, totalDeuda, totalAFavor, saldoNeto }) {
  const fechaHora = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires'
  })

  const formatoMoneda = '"$"#,##0.00'

  // Crear datos para el Excel
  const excelData = [
    ['REPORTE DE DEUDORES'],
    [nombreNegocio],
    [`Estado al ${fechaHora}`],
    [],
    ['RESUMEN'],
    ['Total a cobrar', totalDeuda],
    ['Total a favor de clientes', totalAFavor],
    ['Saldo neto a cobrar', saldoNeto],
    [],
    ['DETALLE DE CLIENTES'],
    ['Cliente', 'Teléfono', 'Límite Crédito', 'Saldo', 'Estado', 'Días Deuda', 'Última Actividad'],
    ...datos.map(c => [
      `${c.nombre} ${c.apellido || ''}`.trim(),
      c.telefono || '',
      c.limite_credito || '',
      c.saldo,
      c.saldo > 0 ? 'Debe' : 'A favor',
      c.dias_deuda || 0,
      c.ultima_actividad || ''
    ])
  ]

  // Crear workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(excelData)

  // Ajustar ancho de columnas
  ws['!cols'] = [
    { wch: 25 }, // Cliente
    { wch: 15 }, // Teléfono
    { wch: 15 }, // Límite
    { wch: 15 }, // Saldo
    { wch: 10 }, // Estado
    { wch: 12 }, // Días
    { wch: 15 }  // Última actividad
  ]

  // Aplicar formato de moneda
  if (ws['B6']) ws['B6'].z = formatoMoneda
  if (ws['B7']) ws['B7'].z = formatoMoneda
  if (ws['B8']) ws['B8'].z = formatoMoneda

  // Formato a columnas C y D en los datos (Límite y Saldo)
  const filaInicioData = 12
  datos.forEach((_, index) => {
    const fila = filaInicioData + index
    if (ws[`C${fila}`] && ws[`C${fila}`].v) ws[`C${fila}`].z = formatoMoneda
    if (ws[`D${fila}`]) ws[`D${fila}`].z = formatoMoneda
  })

  XLSX.utils.book_append_sheet(wb, ws, 'Deudores')

  // Descargar
  const fechaArchivo = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `reporte-deudores-${fechaArchivo}.xlsx`)
}
