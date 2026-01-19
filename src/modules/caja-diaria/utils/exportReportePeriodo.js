/**
 * Funciones para exportar reporte de período a PDF y Excel
 */

import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { formatearMonto } from './formatters'

/**
 * Genera y descarga PDF del reporte de período
 */
export function descargarPDFReportePeriodo({ fechaDesde, fechaHasta, datos, nombreNegocio = 'Mi Negocio' }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = 20

  // Colores
  const indigo = [99, 102, 241] // indigo-500
  const gris = [107, 114, 128]
  const verde = [16, 185, 129]
  const rojo = [239, 68, 68]

  // Formatear fechas
  const formatFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // === HEADER ===
  doc.setFillColor(...indigo)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE DE CAJA', pageWidth / 2, 15, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`${formatFecha(fechaDesde)} - ${formatFecha(fechaHasta)}`, pageWidth / 2, 25, { align: 'center' })

  doc.setFontSize(10)
  doc.text(nombreNegocio, pageWidth / 2, 33, { align: 'center' })

  y = 50

  // Calcular totales
  const totalEntradas = datos.reduce((sum, m) => sum + parseFloat(m.total_entradas || 0), 0)
  const totalSalidas = datos.reduce((sum, m) => sum + parseFloat(m.total_salidas || 0), 0)
  const saldo = totalEntradas - totalSalidas

  // === RESUMEN GENERAL ===
  doc.setFillColor(243, 244, 246)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 30, 3, 3, 'F')

  y += 10
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Total entradas
  doc.setTextColor(...verde)
  doc.text('Total Entradas:', margin + 5, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatearMonto(totalEntradas), margin + 45, y)

  // Total salidas
  doc.setTextColor(...rojo)
  doc.setFont('helvetica', 'normal')
  doc.text('Total Salidas:', margin + 80, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatearMonto(totalSalidas), margin + 115, y)

  y += 12
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('SALDO DEL PERÍODO:', margin + 5, y)
  doc.setTextColor(saldo >= 0 ? verde[0] : rojo[0], saldo >= 0 ? verde[1] : rojo[1], saldo >= 0 ? verde[2] : rojo[2])
  doc.text(formatearMonto(saldo), margin + 70, y)

  y += 25

  // === DETALLE POR MÉTODO DE PAGO ===
  doc.setTextColor(...indigo)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('DETALLE POR MÉTODO DE PAGO', margin, y)
  y += 8

  // Encabezados de tabla
  doc.setFillColor(99, 102, 241)
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  y += 5.5
  doc.text('MÉTODO', margin + 3, y)
  doc.text('ENTRADAS', margin + 55, y)
  doc.text('CANT.', margin + 90, y)
  doc.text('SALIDAS', margin + 110, y)
  doc.text('CANT.', margin + 145, y)
  y += 5

  // Datos
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  datos.forEach((metodo, index) => {
    // Alternar fondo
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251)
      doc.rect(margin, y - 3.5, pageWidth - 2 * margin, 8, 'F')
    }

    y += 4

    // Nombre método
    doc.setTextColor(0, 0, 0)
    const nombreMetodo = metodo.metodo_nombre + (metodo.es_efectivo ? ' *' : '')
    doc.text(nombreMetodo, margin + 3, y)

    // Entradas
    doc.setTextColor(...verde)
    doc.text(formatearMonto(metodo.total_entradas), margin + 55, y)

    // Cantidad entradas
    doc.setTextColor(...gris)
    doc.text(String(metodo.cantidad_entradas), margin + 95, y)

    // Salidas
    doc.setTextColor(...rojo)
    doc.text(formatearMonto(metodo.total_salidas), margin + 110, y)

    // Cantidad salidas
    doc.setTextColor(...gris)
    doc.text(String(metodo.cantidad_salidas), margin + 150, y)

    y += 4
  })

  // Leyenda
  y += 10
  doc.setTextColor(...gris)
  doc.setFontSize(8)
  doc.text('* Método de pago en efectivo', margin, y)

  // Footer
  const fechaHora = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'short',
    timeStyle: 'short'
  })

  doc.setTextColor(...gris)
  doc.setFontSize(8)
  doc.text(`Generado el ${fechaHora}`, pageWidth / 2, 285, { align: 'center' })
  doc.text('MonoGestion - Caja Diaria', pageWidth / 2, 290, { align: 'center' })

  // Descargar
  const nombreArchivo = `reporte-caja-${fechaDesde}-a-${fechaHasta}.pdf`
  doc.save(nombreArchivo)
}

/**
 * Genera y descarga Excel del reporte de período
 */
export function descargarExcelReportePeriodo({ fechaDesde, fechaHasta, datos, nombreNegocio = 'Mi Negocio' }) {
  // Calcular totales
  const totalEntradas = datos.reduce((sum, m) => sum + parseFloat(m.total_entradas || 0), 0)
  const totalSalidas = datos.reduce((sum, m) => sum + parseFloat(m.total_salidas || 0), 0)
  const saldo = totalEntradas - totalSalidas

  // Formatear fechas
  const formatFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR')
  }

  // Crear datos para el Excel
  const excelData = [
    // Encabezado
    ['REPORTE DE CAJA'],
    [`Período: ${formatFecha(fechaDesde)} - ${formatFecha(fechaHasta)}`],
    [nombreNegocio],
    [], // Fila vacía
    // Resumen
    ['RESUMEN GENERAL'],
    ['Total Entradas', totalEntradas],
    ['Total Salidas', totalSalidas],
    ['Saldo del Período', saldo],
    [], // Fila vacía
    // Encabezados de tabla
    ['DETALLE POR MÉTODO DE PAGO'],
    ['Método', 'Es Efectivo', 'Total Entradas', 'Cant. Entradas', 'Total Salidas', 'Cant. Salidas', 'Saldo Método'],
    // Datos
    ...datos.map(m => [
      m.metodo_nombre,
      m.es_efectivo ? 'Sí' : 'No',
      parseFloat(m.total_entradas || 0),
      parseInt(m.cantidad_entradas || 0),
      parseFloat(m.total_salidas || 0),
      parseInt(m.cantidad_salidas || 0),
      parseFloat(m.total_entradas || 0) - parseFloat(m.total_salidas || 0)
    ]),
    [], // Fila vacía
    // Totales
    ['TOTALES', '', totalEntradas, '', totalSalidas, '', saldo]
  ]

  // Crear workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(excelData)

  // Ajustar ancho de columnas
  ws['!cols'] = [
    { wch: 20 }, // Método
    { wch: 12 }, // Es Efectivo
    { wch: 15 }, // Total Entradas
    { wch: 14 }, // Cant. Entradas
    { wch: 15 }, // Total Salidas
    { wch: 14 }, // Cant. Salidas
    { wch: 15 }  // Saldo
  ]

  // Agregar hoja
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte Caja')

  // Descargar
  const nombreArchivo = `reporte-caja-${fechaDesde}-a-${fechaHasta}.xlsx`
  XLSX.writeFile(wb, nombreArchivo)
}
