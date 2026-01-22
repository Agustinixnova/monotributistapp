/**
 * Funciones para exportar reporte por categorías a PDF y Excel
 */

import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { formatearMonto } from './formatters'

/**
 * Genera y descarga PDF del reporte por categorías
 */
export function descargarPDFReporteCategorias({ datos, nombreNegocio, tipo, periodo, total, cantidadTotal, desglose = null }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let y = 20

  // Colores según tipo
  const esIngreso = tipo === 'ingresos'
  const colorPrimario = esIngreso ? [16, 185, 129] : [220, 38, 38] // emerald / red
  const colorClaro = esIngreso ? [236, 253, 245] : [254, 242, 242]
  const gris = [107, 114, 128]

  // Fecha actual
  const fechaHora = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'short',
    timeStyle: 'short'
  })

  // Función para verificar y agregar página si es necesario
  const checkNewPage = (requiredSpace = 20) => {
    if (y > 275 - requiredSpace) {
      doc.addPage()
      y = 20
      return true
    }
    return false
  }

  // === HEADER ===
  doc.setFillColor(...colorPrimario)
  doc.rect(0, 0, pageWidth, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(esIngreso ? 'REPORTE DE INGRESOS POR CATEGORIA' : 'REPORTE DE EGRESOS POR CATEGORIA', pageWidth / 2, 13, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(nombreNegocio, pageWidth / 2, 21, { align: 'center' })
  doc.text(`Periodo: ${periodo}`, pageWidth / 2, 29, { align: 'center' })

  y = 45

  // === RESUMEN ===
  doc.setFillColor(...colorClaro)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 3, 3, 'F')

  y += 8
  doc.setFontSize(11)
  doc.setTextColor(...colorPrimario)
  doc.setFont('helvetica', 'normal')
  doc.text(esIngreso ? 'Total Ingresos:' : 'Total Egresos:', margin + 5, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatearMonto(total), margin + 45, y)

  doc.setFont('helvetica', 'normal')
  doc.text('Operaciones:', margin + 100, y)
  doc.setFont('helvetica', 'bold')
  doc.text(String(cantidadTotal), margin + 132, y)

  y += 20

  // === DETALLE POR CATEGORÍA ===
  doc.setTextColor(...colorPrimario)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`DETALLE POR CATEGORIA (${datos.length})`, margin, y)
  y += 6

  // Encabezados
  doc.setFillColor(...colorPrimario)
  doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  y += 5
  doc.text('CATEGORIA', margin + 2, y)
  doc.text('CANTIDAD', margin + 90, y)
  doc.text('TOTAL', margin + 120, y)
  doc.text('%', margin + 165, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  datos.forEach((cat, index) => {
    checkNewPage()

    const porcentaje = total > 0 ? (parseFloat(cat.total) / total * 100) : 0

    y += 4

    // Dibujar fondo alternado
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251)
      doc.rect(margin, y - 4, pageWidth - 2 * margin, 8, 'F')
    }

    // Categoría
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.text(cat.categoria_nombre.substring(0, 40), margin + 2, y)

    // Cantidad
    doc.setTextColor(...gris)
    doc.text(String(cat.cantidad), margin + 95, y)

    // Total
    doc.setTextColor(...colorPrimario)
    doc.setFont('helvetica', 'bold')
    doc.text(formatearMonto(cat.total), margin + 120, y)

    // Porcentaje
    doc.setTextColor(...gris)
    doc.setFont('helvetica', 'normal')
    doc.text(`${porcentaje.toFixed(1)}%`, margin + 165, y)

    y += 4
  })

  // === DESGLOSE DE MOVIMIENTOS (si está incluido) ===
  if (desglose && desglose.length > 0) {
    y += 10
    checkNewPage(30)

    doc.setTextColor(...colorPrimario)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('DESGLOSE DE MOVIMIENTOS', margin, y)
    y += 8

    desglose.forEach((catDesglose) => {
      if (catDesglose.movimientos.length === 0) return

      checkNewPage(25)

      // Título de la categoría
      doc.setFillColor(...colorClaro)
      doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F')
      doc.setTextColor(...colorPrimario)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      y += 5
      doc.text(catDesglose.categoria_nombre, margin + 2, y)
      y += 5

      // Encabezados de detalle
      doc.setFillColor(229, 231, 235)
      doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F')
      doc.setTextColor(75, 85, 99)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      y += 4
      doc.text('FECHA', margin + 2, y)
      doc.text('HORA', margin + 25, y)
      doc.text('DETALLE', margin + 45, y)
      doc.text('MONTO', margin + 155, y)
      y += 4

      // Movimientos
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)

      catDesglose.movimientos.forEach((mov, idx) => {
        checkNewPage(10)

        y += 4

        // Fondo alternado
        if (idx % 2 === 0) {
          doc.setFillColor(249, 250, 251)
          doc.rect(margin, y - 3, pageWidth - 2 * margin, 6, 'F')
        }

        // Fecha
        const fechaFormateada = new Date(mov.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        })
        doc.setTextColor(75, 85, 99)
        doc.text(fechaFormateada, margin + 2, y)

        // Hora
        const horaFormateada = mov.hora ? mov.hora.substring(0, 5) : ''
        doc.text(horaFormateada, margin + 25, y)

        // Detalle
        doc.setTextColor(0, 0, 0)
        const detalleText = (mov.detalle || '-').substring(0, 50)
        doc.text(detalleText, margin + 45, y)

        // Monto
        doc.setTextColor(...colorPrimario)
        doc.setFont('helvetica', 'bold')
        doc.text(formatearMonto(mov.monto), margin + 155, y)
        doc.setFont('helvetica', 'normal')

        y += 2
      })

      y += 6
    })
  }

  // Footer
  y = 287
  doc.setTextColor(...gris)
  doc.setFontSize(8)
  doc.text(`Generado el ${fechaHora}`, pageWidth / 2, y, { align: 'center' })
  doc.text('MonoGestion - Caja Diaria', pageWidth / 2, y + 5, { align: 'center' })

  // Descargar con fecha y hora para nombre único
  const fechaHoraArchivo = new Date().toLocaleString('sv-SE', {
    timeZone: 'America/Argentina/Buenos_Aires'
  }).replace(' ', '_').replace(/:/g, '-')
  doc.save(`reporte-${tipo}-categorias-${fechaHoraArchivo}.pdf`)
}

/**
 * Genera y descarga Excel del reporte por categorías
 */
export function descargarExcelReporteCategorias({ datos, nombreNegocio, tipo, periodo, total, cantidadTotal, desglose = null }) {
  const fechaHora = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires'
  })

  const formatoMoneda = '"$"#,##0.00'
  const formatoPorcentaje = '0.0%'

  const esIngreso = tipo === 'ingresos'
  const titulo = esIngreso ? 'REPORTE DE INGRESOS POR CATEGORIA' : 'REPORTE DE EGRESOS POR CATEGORIA'

  // Crear datos para el Excel - Hoja principal
  const excelData = [
    [titulo],
    [nombreNegocio],
    [`Periodo: ${periodo}`],
    [`Generado: ${fechaHora}`],
    [],
    ['RESUMEN'],
    [esIngreso ? 'Total Ingresos' : 'Total Egresos', total],
    ['Total Operaciones', cantidadTotal],
    [],
    ['DETALLE POR CATEGORIA'],
    ['Categoria', 'Cantidad', 'Total', 'Porcentaje'],
    ...datos.map(cat => {
      const porcentaje = total > 0 ? (parseFloat(cat.total) / total) : 0
      return [
        cat.categoria_nombre,
        cat.cantidad,
        parseFloat(cat.total),
        porcentaje
      ]
    })
  ]

  // Crear workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(excelData)

  // Ajustar ancho de columnas
  ws['!cols'] = [
    { wch: 30 }, // Categoría
    { wch: 12 }, // Cantidad
    { wch: 15 }, // Total
    { wch: 12 }  // Porcentaje
  ]

  // Aplicar formato de moneda al resumen
  if (ws['B7']) ws['B7'].z = formatoMoneda

  // Formato a columnas C y D en los datos
  const filaInicioData = 12
  datos.forEach((_, index) => {
    const fila = filaInicioData + index
    if (ws[`C${fila}`]) ws[`C${fila}`].z = formatoMoneda
    if (ws[`D${fila}`]) ws[`D${fila}`].z = formatoPorcentaje
  })

  XLSX.utils.book_append_sheet(wb, ws, esIngreso ? 'Ingresos' : 'Egresos')

  // === HOJA DE DESGLOSE (si está incluido y tiene movimientos) ===
  if (desglose && desglose.length > 0) {
    // Contar total de movimientos para verificar que hay datos
    const totalMovimientos = desglose.reduce((sum, cat) => sum + (cat.movimientos?.length || 0), 0)

    if (totalMovimientos > 0) {
      const desgloseData = [
        ['DESGLOSE DE MOVIMIENTOS'],
        [`Periodo: ${periodo}`],
        [],
        ['Categoria', 'Fecha', 'Hora', 'Detalle', 'Monto']
      ]

      desglose.forEach((catDesglose) => {
        if (catDesglose.movimientos && catDesglose.movimientos.length > 0) {
          catDesglose.movimientos.forEach((mov) => {
            const fechaFormateada = new Date(mov.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            })
            desgloseData.push([
              catDesglose.categoria_nombre,
              fechaFormateada,
              mov.hora ? mov.hora.substring(0, 5) : '',
              mov.detalle || '-',
              parseFloat(mov.monto)
            ])
          })
        }
      })

      const wsDesglose = XLSX.utils.aoa_to_sheet(desgloseData)

      // Ajustar ancho de columnas
      wsDesglose['!cols'] = [
        { wch: 25 }, // Categoría
        { wch: 12 }, // Fecha
        { wch: 8 },  // Hora
        { wch: 40 }, // Detalle
        { wch: 15 }  // Monto
      ]

      // Aplicar formato de moneda a columna E (Monto)
      const filaInicioDesglose = 5
      for (let i = 0; i < totalMovimientos; i++) {
        const fila = filaInicioDesglose + i
        if (wsDesglose[`E${fila}`]) wsDesglose[`E${fila}`].z = formatoMoneda
      }

      XLSX.utils.book_append_sheet(wb, wsDesglose, 'Desglose')
    }
  }

  // Descargar con fecha y hora para nombre único
  const fechaHoraArchivo = new Date().toLocaleString('sv-SE', {
    timeZone: 'America/Argentina/Buenos_Aires'
  }).replace(' ', '_').replace(/:/g, '-')
  XLSX.writeFile(wb, `reporte-${tipo}-categorias-${fechaHoraArchivo}.xlsx`)
}
