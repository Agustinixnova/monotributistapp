/**
 * Generador de PDF para cierre de caja
 */

import { jsPDF } from 'jspdf'
import { formatearMonto, formatearFechaLarga } from './formatters'

/**
 * Genera un PDF con el resumen del cierre de caja
 * @param {object} params - Parámetros del cierre
 * @param {string} params.fecha - Fecha del cierre (YYYY-MM-DD)
 * @param {number} params.saldoInicial - Saldo inicial del día
 * @param {object} params.resumen - Resumen del día (total_entradas, total_salidas, etc.)
 * @param {object} params.cierre - Datos del cierre (efectivo_real, diferencia, etc.)
 * @param {array} params.totalesPorMetodo - Array con totales por método de pago
 * @param {string} params.nombreNegocio - Nombre opcional del negocio
 */
export function generarPDFCierreCaja({
  fecha,
  saldoInicial,
  resumen,
  cierre,
  totalesPorMetodo = [],
  nombreNegocio = 'Mi Negocio'
}) {
  // Crear documento A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = 20

  // Colores
  const violeta = [124, 58, 237] // violet-600
  const gris = [107, 114, 128] // gray-500
  const verde = [16, 185, 129] // emerald-500
  const rojo = [239, 68, 68] // red-500

  // === HEADER ===
  doc.setFillColor(...violeta)
  doc.rect(0, 0, pageWidth, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('CIERRE DE CAJA', pageWidth / 2, 15, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(formatearFechaLarga(fecha), pageWidth / 2, 25, { align: 'center' })

  y = 45

  // === INFO DEL NEGOCIO ===
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(nombreNegocio, margin, y)
  y += 10

  // Línea separadora
  doc.setDrawColor(...violeta)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // === SECCIÓN: EFECTIVO EN CAJA ===
  doc.setFillColor(245, 243, 255) // violet-50
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 55, 3, 3, 'F')

  y += 8
  doc.setTextColor(...violeta)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('EFECTIVO EN CAJA', margin + 5, y)
  y += 8

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Saldo inicial
  doc.text('Saldo inicial:', margin + 5, y)
  doc.text(formatearMonto(saldoInicial), pageWidth - margin - 5, y, { align: 'right' })
  y += 6

  // Entradas efectivo
  doc.setTextColor(...verde)
  doc.text('+ Entradas efectivo:', margin + 5, y)
  doc.text(formatearMonto(resumen?.efectivo_entradas || 0), pageWidth - margin - 5, y, { align: 'right' })
  y += 6

  // Salidas efectivo
  doc.setTextColor(...rojo)
  doc.text('- Salidas efectivo:', margin + 5, y)
  doc.text(formatearMonto(resumen?.efectivo_salidas || 0), pageWidth - margin - 5, y, { align: 'right' })
  y += 8

  // Línea
  doc.setDrawColor(...violeta)
  doc.line(margin + 5, y, pageWidth - margin - 5, y)
  y += 6

  // Efectivo esperado
  doc.setTextColor(...violeta)
  doc.setFont('helvetica', 'bold')
  doc.text('Efectivo esperado:', margin + 5, y)
  const efectivoEsperado = parseFloat(saldoInicial) +
    parseFloat(resumen?.efectivo_entradas || 0) -
    parseFloat(resumen?.efectivo_salidas || 0)
  doc.text(formatearMonto(efectivoEsperado), pageWidth - margin - 5, y, { align: 'right' })

  y += 15

  // === SECCIÓN: ARQUEO ===
  doc.setFillColor(240, 253, 244) // green-50
  doc.roundedRect(margin, y, (pageWidth - 2 * margin) / 2 - 5, 30, 3, 3, 'F')

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Efectivo real:', margin + 5, y + 10)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(formatearMonto(cierre?.efectivo_real || efectivoEsperado), margin + 5, y + 20)

  // Diferencia
  const diferencia = parseFloat(cierre?.diferencia || 0)
  const colorDif = diferencia === 0 ? verde : (diferencia > 0 ? verde : rojo)
  doc.setFillColor(diferencia === 0 ? 240 : (diferencia > 0 ? 240 : 254),
                   diferencia === 0 ? 253 : (diferencia > 0 ? 253 : 242),
                   diferencia === 0 ? 244 : (diferencia > 0 ? 244 : 242))
  doc.roundedRect(margin + (pageWidth - 2 * margin) / 2 + 5, y, (pageWidth - 2 * margin) / 2 - 5, 30, 3, 3, 'F')

  doc.setTextColor(...gris)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Diferencia:', margin + (pageWidth - 2 * margin) / 2 + 10, y + 10)
  doc.setTextColor(...colorDif)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  const signo = diferencia >= 0 ? '+' : ''
  doc.text(signo + formatearMonto(diferencia), margin + (pageWidth - 2 * margin) / 2 + 10, y + 20)

  y += 40

  // Motivo diferencia (si hay)
  if (diferencia !== 0 && cierre?.motivo_diferencia) {
    doc.setTextColor(...gris)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text('Motivo: ' + cierre.motivo_diferencia, margin, y)
    y += 10
  }

  // === SECCIÓN: MEDIOS DIGITALES ===
  const mediosDigitales = totalesPorMetodo?.filter(m => !m.es_efectivo) || []
  const mediosConMovimientos = mediosDigitales.filter(m =>
    parseFloat(m.total_entradas || 0) > 0 || parseFloat(m.total_salidas || 0) > 0
  )

  if (mediosConMovimientos.length > 0) {
    y += 5
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('MEDIOS DIGITALES', margin, y)
    y += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    mediosConMovimientos.forEach(metodo => {
      const entradas = parseFloat(metodo.total_entradas || 0)
      const salidas = parseFloat(metodo.total_salidas || 0)

      doc.setTextColor(0, 0, 0)
      doc.text(metodo.metodo_nombre + ':', margin + 5, y)

      if (entradas > 0) {
        doc.setTextColor(...verde)
        doc.text('+' + formatearMonto(entradas), margin + 60, y)
      }
      if (salidas > 0) {
        doc.setTextColor(...rojo)
        doc.text('-' + formatearMonto(salidas), margin + 110, y)
      }
      y += 6
    })

    // Totales digitales
    y += 2
    doc.setDrawColor(...gris)
    doc.line(margin + 5, y, pageWidth - margin - 5, y)
    y += 6

    const totalDigitalEntradas = mediosDigitales.reduce((sum, m) => sum + parseFloat(m.total_entradas || 0), 0)
    const totalDigitalSalidas = mediosDigitales.reduce((sum, m) => sum + parseFloat(m.total_salidas || 0), 0)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...verde)
    doc.text('Total entradas digitales:', margin + 5, y)
    doc.text(formatearMonto(totalDigitalEntradas), pageWidth - margin - 5, y, { align: 'right' })
    y += 6
    doc.setTextColor(...rojo)
    doc.text('Total salidas digitales:', margin + 5, y)
    doc.text(formatearMonto(totalDigitalSalidas), pageWidth - margin - 5, y, { align: 'right' })
    y += 10
  }

  // === SECCIÓN: RESUMEN DEL DÍA ===
  y += 5
  doc.setFillColor(...violeta)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 45, 3, 3, 'F')

  y += 8
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN DEL DIA', margin + 5, y)
  y += 10

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  // Total entradas
  doc.text('Total entradas:', margin + 5, y)
  doc.text(formatearMonto(resumen?.total_entradas || 0), pageWidth - margin - 5, y, { align: 'right' })
  y += 7

  // Total salidas
  doc.text('Total salidas:', margin + 5, y)
  doc.text(formatearMonto(resumen?.total_salidas || 0), pageWidth - margin - 5, y, { align: 'right' })
  y += 10

  // Resultado
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('RESULTADO:', margin + 5, y)
  doc.text(formatearMonto(resumen?.saldo || 0), pageWidth - margin - 5, y, { align: 'right' })

  // === FOOTER ===
  const fechaHora = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'short',
    timeStyle: 'short'
  })

  doc.setTextColor(...gris)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generado el ${fechaHora}`, pageWidth / 2, 285, { align: 'center' })
  doc.text('MonoGestion - Caja Diaria', pageWidth / 2, 290, { align: 'center' })

  return doc
}

/**
 * Genera y descarga el PDF del cierre
 */
export function descargarPDFCierreCaja(params) {
  const doc = generarPDFCierreCaja(params)
  const nombreArchivo = `cierre-caja-${params.fecha}.pdf`
  doc.save(nombreArchivo)
}

/**
 * Genera y abre el PDF en una nueva pestaña para imprimir/compartir
 */
export function abrirPDFCierreCaja(params) {
  const doc = generarPDFCierreCaja(params)
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
