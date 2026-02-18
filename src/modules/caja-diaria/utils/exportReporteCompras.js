/**
 * Funciones para exportar reporte de compras por proveedor a PDF y Excel
 */

import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { formatearMonto } from './formatters'

/**
 * Aplana los datos: una fila por factura con proveedor, cuit, nro factura, total
 */
function aplanarFacturas(datos) {
  const filas = []
  datos.forEach(prov => {
    if (prov.facturas && prov.facturas.length > 0) {
      prov.facturas.forEach(f => {
        filas.push({
          proveedor: prov.razon_social,
          cuit: prov.cuit || '-',
          numero_factura: f.numero_factura || '-',
          monto_total: parseFloat(f.monto_total)
        })
      })
    }
  })
  return filas
}

/**
 * Genera y descarga PDF del reporte de compras
 */
export function descargarPDFReporteCompras({ datos, nombreNegocio, periodo, total, cantidadTotal }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin
  let y = 20

  const colorPrimario = [14, 165, 233] // sky-500
  const colorClaro = [240, 249, 255]   // sky-50
  const gris = [107, 114, 128]

  // Fecha actual
  const fechaHora = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'short',
    timeStyle: 'short'
  })

  // Función para verificar y agregar página si es necesario
  const checkNewPage = (requiredSpace = 12) => {
    if (y > 275 - requiredSpace) {
      doc.addPage()
      y = 20
      return true
    }
    return false
  }

  // Aplanar datos
  const filas = aplanarFacturas(datos)

  // === HEADER ===
  doc.setFillColor(...colorPrimario)
  doc.rect(0, 0, pageWidth, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE DE COMPRAS POR PROVEEDOR', pageWidth / 2, 13, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(nombreNegocio, pageWidth / 2, 21, { align: 'center' })
  doc.text(`Periodo: ${periodo}`, pageWidth / 2, 29, { align: 'center' })

  y = 45

  // === RESUMEN ===
  doc.setFillColor(...colorClaro)
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F')

  y += 8
  doc.setFontSize(11)
  doc.setTextColor(...colorPrimario)
  doc.setFont('helvetica', 'normal')
  doc.text('Total Compras:', margin + 5, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatearMonto(total), margin + 45, y)

  doc.setFont('helvetica', 'normal')
  doc.text('Facturas:', margin + 100, y)
  doc.setFont('helvetica', 'bold')
  doc.text(String(cantidadTotal), margin + 125, y)

  y += 20

  // === TABLA DE FACTURAS ===
  doc.setTextColor(...colorPrimario)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`DETALLE DE FACTURAS (${filas.length})`, margin, y)
  y += 6

  // Columnas: Proveedor | CUIT | Nro Factura | Total IVA inc.
  const col1 = margin + 2       // Proveedor
  const col2 = margin + 62      // CUIT
  const col3 = margin + 105     // Nro Factura
  const col4 = margin + 145     // Total IVA inc.

  // Encabezados
  doc.setFillColor(...colorPrimario)
  doc.rect(margin, y, contentWidth, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  y += 5
  doc.text('PROVEEDOR', col1, y)
  doc.text('CUIT', col2, y)
  doc.text('NRO FACTURA', col3, y)
  doc.text('TOTAL IVA INC.', col4, y)
  y += 5

  // Filas
  filas.forEach((fila, index) => {
    checkNewPage()

    // Fondo alternado
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, y, contentWidth, 7, 'F')
    }

    y += 5
    doc.setTextColor(55, 65, 81)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')

    // Truncar nombre si es muy largo
    const nombre = fila.proveedor.length > 30
      ? fila.proveedor.substring(0, 30) + '...'
      : fila.proveedor
    doc.text(nombre, col1, y)
    doc.text(fila.cuit, col2, y)
    doc.text(fila.numero_factura, col3, y)

    doc.setFont('helvetica', 'bold')
    doc.text(formatearMonto(fila.monto_total), col4, y)

    y += 3
  })

  // === TOTAL ===
  y += 3
  checkNewPage(15)
  doc.setFillColor(...colorPrimario)
  doc.rect(margin, y, contentWidth, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  y += 6
  doc.text('TOTAL', col1, y)
  doc.text(formatearMonto(total), col4, y)

  // === PIE ===
  y += 10
  checkNewPage(15)
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  doc.setTextColor(...gris)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generado: ${fechaHora}`, margin, y)
  doc.text('MonoGestion - Compras por Proveedor', pageWidth - margin, y, { align: 'right' })

  // Descargar
  const nombreArchivo = `compras_proveedores_${periodo.replace(/\//g, '-').replace(/ /g, '_')}.pdf`
  doc.save(nombreArchivo)
}

/**
 * Genera y descarga Excel del reporte de compras
 */
export function descargarExcelReporteCompras({ datos, nombreNegocio, periodo, total, cantidadTotal }) {
  const wb = XLSX.utils.book_new()

  // Aplanar datos
  const filas = aplanarFacturas(datos)

  // Encabezado + datos
  const sheetData = [
    ['REPORTE DE COMPRAS POR PROVEEDOR'],
    [nombreNegocio],
    [`Periodo: ${periodo}`],
    [],
    ['Proveedor', 'CUIT', 'Nro Factura', 'Total IVA inc.']
  ]

  filas.forEach(fila => {
    sheetData.push([
      fila.proveedor,
      fila.cuit,
      fila.numero_factura,
      formatearMonto(fila.monto_total)
    ])
  })

  // Fila total
  sheetData.push([])
  sheetData.push(['TOTAL', '', '', formatearMonto(total)])

  const ws = XLSX.utils.aoa_to_sheet(sheetData)

  // Anchos de columna
  ws['!cols'] = [
    { wch: 35 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 }
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Compras')

  // Descargar
  const nombreArchivo = `compras_proveedores_${periodo.replace(/\//g, '-').replace(/ /g, '_')}.xlsx`
  XLSX.writeFile(wb, nombreArchivo)
}
