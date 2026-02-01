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
 * @param {array} params.movimientos - Array con los movimientos del día
 * @param {string} params.nombreNegocio - Nombre opcional del negocio
 * @param {number} params.saldoCajaSecundaria - Saldo de la caja secundaria
 */
export function generarPDFCierreCaja({
  fecha,
  saldoInicial,
  resumen,
  cierre,
  totalesPorMetodo = [],
  movimientos = [],
  nombreNegocio = 'Mi Negocio',
  saldoCajaSecundaria = 0
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

  // === SECCIÓN: CAJA SECUNDARIA (si tiene saldo) ===
  if (saldoCajaSecundaria > 0) {
    y += 5
    const indigo = [79, 70, 229] // indigo-600
    doc.setFillColor(238, 242, 255) // indigo-50
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 35, 3, 3, 'F')

    y += 8
    doc.setTextColor(...indigo)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('CAJA SECUNDARIA', margin + 5, y)
    y += 8

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Saldo disponible:', margin + 5, y)
    doc.setFont('helvetica', 'bold')
    doc.text(formatearMonto(saldoCajaSecundaria), pageWidth - margin - 5, y, { align: 'right' })
    y += 6

    doc.setTextColor(...gris)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text('Este saldo se mantiene para el día siguiente', margin + 5, y)

    y += 12

    // Total efectivo del negocio
    const efectivoReal = parseFloat(cierre?.efectivo_real || efectivoEsperado)
    const totalEfectivoNegocio = efectivoReal + parseFloat(saldoCajaSecundaria)

    doc.setFillColor(236, 253, 245) // emerald-50
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 3, 3, 'F')

    y += 8
    doc.setTextColor(...verde)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL EFECTIVO DEL NEGOCIO', margin + 5, y)
    doc.setFontSize(14)
    doc.text(formatearMonto(totalEfectivoNegocio), pageWidth - margin - 5, y, { align: 'right' })

    y += 15
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

  // === FOOTER PÁGINA 1 ===
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

  // === PÁGINA 2: DETALLE DE MOVIMIENTOS ===
  if (movimientos && movimientos.length > 0) {
    // Ordenar movimientos de más antiguo a más nuevo (cronológico)
    const movimientosOrdenados = [...movimientos].sort((a, b) => {
      const horaA = a.hora || '00:00:00'
      const horaB = b.hora || '00:00:00'
      return horaA.localeCompare(horaB)
    })

    doc.addPage()
    y = 20

    // Header página 2
    doc.setFillColor(...violeta)
    doc.rect(0, 0, pageWidth, 25, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('DETALLE DE MOVIMIENTOS', pageWidth / 2, 12, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(formatearFechaLarga(fecha), pageWidth / 2, 20, { align: 'center' })

    y = 35

    // Encabezados de tabla
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setFillColor(243, 244, 246) // gray-100
    doc.rect(margin, y - 4, pageWidth - 2 * margin, 8, 'F')

    doc.text('HORA', margin + 2, y)
    doc.text('TIPO', margin + 18, y)
    doc.text('CATEGORÍA', margin + 35, y)
    doc.text('MONTO', margin + 75, y)
    doc.text('MÉTODO', margin + 100, y)
    doc.text('USUARIO', margin + 130, y)

    y += 6

    // Línea separadora
    doc.setDrawColor(...gris)
    doc.line(margin, y, pageWidth - margin, y)
    y += 4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)

    // Iterar movimientos (ya ordenados cronológicamente)
    movimientosOrdenados.forEach((mov, index) => {
      // Verificar si necesitamos nueva página
      if (y > 270) {
        doc.addPage()
        y = 20

        // Mini header en páginas siguientes
        doc.setFillColor(...violeta)
        doc.rect(0, 0, pageWidth, 15, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('DETALLE DE MOVIMIENTOS (cont.)', pageWidth / 2, 10, { align: 'center' })

        y = 25

        // Encabezados
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setFillColor(243, 244, 246)
        doc.rect(margin, y - 4, pageWidth - 2 * margin, 8, 'F')

        doc.text('HORA', margin + 2, y)
        doc.text('TIPO', margin + 18, y)
        doc.text('CATEGORÍA', margin + 35, y)
        doc.text('MONTO', margin + 75, y)
        doc.text('MÉTODO', margin + 100, y)
        doc.text('USUARIO', margin + 130, y)

        y += 6
        doc.setDrawColor(...gris)
        doc.line(margin, y, pageWidth - margin, y)
        y += 4
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
      }

      const esEntrada = mov.tipo === 'entrada'

      // Dibujar fondo alineado con el texto
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251) // gray-50
        doc.rect(margin, y - 2, pageWidth - 2 * margin, mov.descripcion ? 10 : 6, 'F')
      }

      // Hora
      doc.setTextColor(0, 0, 0)
      const hora = mov.hora ? mov.hora.substring(0, 5) : '--:--'
      doc.text(hora, margin + 2, y)

      // Tipo
      doc.setTextColor(esEntrada ? verde[0] : rojo[0], esEntrada ? verde[1] : rojo[1], esEntrada ? verde[2] : rojo[2])
      doc.text(esEntrada ? 'Entrada' : 'Salida', margin + 18, y)

      // Categoría
      doc.setTextColor(0, 0, 0)
      const categoria = mov.categoria?.nombre || '-'
      doc.text(categoria.substring(0, 15), margin + 35, y)

      // Monto
      doc.setTextColor(esEntrada ? verde[0] : rojo[0], esEntrada ? verde[1] : rojo[1], esEntrada ? verde[2] : rojo[2])
      const signoMonto = esEntrada ? '+' : '-'
      doc.text(signoMonto + formatearMonto(mov.monto_total), margin + 75, y)

      // Método de pago (puede haber varios)
      doc.setTextColor(0, 0, 0)
      const metodos = mov.pagos?.map(p => p.metodo?.nombre || '-').join(', ') || '-'
      doc.text(metodos.substring(0, 18), margin + 100, y)

      // Usuario
      const usuario = mov.creador?.nombre_completo || mov.creador?.nombre || 'Usuario'
      doc.text(usuario.substring(0, 15), margin + 130, y)

      y += 5

      // Descripción/comentario (si tiene)
      if (mov.descripcion) {
        doc.setTextColor(...gris)
        doc.setFontSize(6)
        doc.setFont('helvetica', 'italic')
        doc.text('→ ' + mov.descripcion.substring(0, 80), margin + 5, y)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        y += 4
      }

      y += 1
    })

    // Resumen al final
    y += 5
    doc.setDrawColor(...violeta)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 5

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(`Total movimientos: ${movimientos.length}`, margin, y)

    const totalEntradas = movimientos.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + parseFloat(m.monto_total || 0), 0)
    const totalSalidas = movimientos.filter(m => m.tipo === 'salida').reduce((sum, m) => sum + parseFloat(m.monto_total || 0), 0)

    doc.setTextColor(...verde)
    doc.text(`Entradas: ${formatearMonto(totalEntradas)}`, margin + 50, y)
    doc.setTextColor(...rojo)
    doc.text(`Salidas: ${formatearMonto(totalSalidas)}`, margin + 100, y)

    // Footer página 2
    doc.setTextColor(...gris)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generado el ${fechaHora}`, pageWidth / 2, 285, { align: 'center' })
    doc.text('MonoGestion - Caja Diaria', pageWidth / 2, 290, { align: 'center' })
  }

  return doc
}

/**
 * Genera y descarga el PDF del cierre
 */
export function descargarPDFCierreCaja(params) {
  const doc = generarPDFCierreCaja(params)
  // Incluir hora para nombre único
  const horaArchivo = new Date().toLocaleString('sv-SE', {
    timeZone: 'America/Argentina/Buenos_Aires'
  }).split(' ')[1].replace(/:/g, '-')
  const nombreArchivo = `cierre-caja-${params.fecha}_${horaArchivo}.pdf`
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
