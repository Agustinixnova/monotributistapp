/**
 * Servicio de generación de PDFs de facturas
 *
 * Genera facturas en formato PDF con:
 * - Logo del negocio
 * - Datos del emisor y contacto
 * - Datos del receptor
 * - Detalle de servicios (con paginación)
 * - QR de AFIP
 */

import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import {
  TIPOS_COMPROBANTE,
  getNombreTipoComprobante,
  formatearNumeroComprobante
} from './afipService'

// Colores globales
const COLORES = {
  primario: [79, 70, 229], // Indigo-600
  texto: [31, 41, 55], // Gray-800
  gris: [107, 114, 128], // Gray-500
  grisClaro: [156, 163, 175], // Gray-400
  fondoClaro: [249, 250, 251], // Gray-50
  borde: [229, 231, 235] // Gray-200
}

/**
 * Genera el PDF de una factura
 * @param {Object} factura - Datos de la factura
 * @param {Object} config - Configuración AFIP del emisor
 * @param {Object} negocio - Datos del negocio (opcional)
 * @returns {jsPDF} - Documento PDF
 */
export async function generarFacturaPDF(factura, config, negocio = null) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2

  // Preparar items (puede ser un array o un item único)
  const items = factura.items || [{
    descripcion: factura.descripcion || 'Servicio profesional',
    cantidad: 1,
    precioUnitario: factura.importe_total,
    subtotal: factura.importe_total
  }]

  // Calcular cuántos items caben por página (aprox 8-10 por página)
  const itemsPorPagina = 10
  const totalPaginas = Math.ceil(items.length / itemsPorPagina)

  let paginaActual = 1

  for (let pagina = 0; pagina < totalPaginas; pagina++) {
    if (pagina > 0) {
      doc.addPage()
    }

    let y = margin

    // =====================================================
    // ENCABEZADO (solo en primera página completo, resto simplificado)
    // =====================================================

    if (pagina === 0) {
      y = await dibujarEncabezadoCompleto(doc, factura, config, negocio, margin, pageWidth)
    } else {
      y = dibujarEncabezadoSimplificado(doc, factura, config, margin, pageWidth, pagina + 1, totalPaginas)
    }

    // =====================================================
    // DETALLE DE ITEMS
    // =====================================================

    const itemsInicio = pagina * itemsPorPagina
    const itemsFin = Math.min(itemsInicio + itemsPorPagina, items.length)
    const itemsPagina = items.slice(itemsInicio, itemsFin)

    y = dibujarTablaItems(doc, itemsPagina, y, margin, pageWidth, pagina === 0)

    // En la última página, dibujar totales y CAE
    if (pagina === totalPaginas - 1) {
      y = dibujarTotales(doc, factura, y, margin, pageWidth)
      y = await dibujarSeccionCAE(doc, factura, config, y, margin, pageWidth, pageHeight)
    }

    // Pie de página
    dibujarPiePagina(doc, pageWidth, pageHeight, pagina + 1, totalPaginas)

    paginaActual++
  }

  return doc
}

/**
 * Dibuja el encabezado completo (primera página)
 */
async function dibujarEncabezadoCompleto(doc, factura, config, negocio, margin, pageWidth) {
  let y = margin

  // Barra superior
  doc.setFillColor(...COLORES.primario)
  doc.rect(0, 0, pageWidth, 3, 'F')

  y = 10

  // Logo (si existe en config AFIP)
  let tieneLogoAfip = false
  if (config.logo_url) {
    try {
      const logoData = await cargarImagenBase64(config.logo_url)
      if (logoData) {
        doc.addImage(logoData, 'PNG', margin, y, 30, 15, undefined, 'MEDIUM')
        tieneLogoAfip = true
      }
    } catch (error) {
      console.error('Error cargando logo:', error)
    }
  }

  // Nombre del negocio SOLO si no hay logo
  if (!tieneLogoAfip && negocio?.nombre_negocio) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORES.texto)
    doc.text(negocio.nombre_negocio, margin, y + 8)
  }

  // Tipo de comprobante (letra) - MÁS PEQUEÑO
  const letraComprobante = obtenerLetraComprobante(factura.tipo_comprobante)
  const letraSize = 14 // Reducido de 24
  const boxSize = 16 // Reducido de 24
  const letraX = pageWidth / 2 - boxSize / 2

  doc.setDrawColor(...COLORES.primario)
  doc.setLineWidth(0.6)
  doc.rect(letraX, y, boxSize, boxSize)

  doc.setFontSize(letraSize)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORES.primario)
  doc.text(letraComprobante, pageWidth / 2, y + 11, { align: 'center' })

  // Código del comprobante debajo (más pequeño)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORES.gris)
  doc.text(`CÓD. ${String(factura.tipo_comprobante).padStart(2, '0')}`, pageWidth / 2, y + boxSize - 1, { align: 'center' })

  // Tipo de comprobante (nombre) y número - LADO DERECHO
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORES.texto)
  const nombreComprobante = getNombreTipoComprobante(factura.tipo_comprobante)
  doc.text(nombreComprobante, pageWidth - margin, y + 5, { align: 'right' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const numeroFormateado = formatearNumeroComprobante(factura.punto_venta, factura.numero_comprobante)
  doc.text(`N° ${numeroFormateado}`, pageWidth - margin, y + 11, { align: 'right' })

  doc.setFontSize(8)
  doc.setTextColor(...COLORES.gris)
  doc.text(`Fecha: ${formatearFecha(factura.fecha_comprobante)}`, pageWidth - margin, y + 17, { align: 'right' })

  y += 22

  // Datos de contacto del negocio (si existen)
  const contactos = []
  if (negocio?.whatsapp) contactos.push(`WA: ${negocio.whatsapp}`)
  if (negocio?.telefono && negocio.telefono !== negocio?.whatsapp) contactos.push(`Tel: ${negocio.telefono}`)
  if (negocio?.email) contactos.push(negocio.email)
  if (negocio?.web) contactos.push(negocio.web.replace('https://', '').replace('http://', ''))
  if (negocio?.instagram) contactos.push(`@${negocio.instagram}`)
  if (negocio?.tiktok) contactos.push(`TK: @${negocio.tiktok}`)

  if (contactos.length > 0) {
    doc.setFontSize(7)
    doc.setTextColor(...COLORES.grisClaro)
    doc.text(contactos.join('  •  '), margin, y)
    y += 4
  }

  // Ubicación del local (si tiene modalidad local)
  const tieneLocal = negocio?.modalidades_trabajo?.includes('local')
  if (tieneLocal && negocio?.direccion) {
    doc.setFontSize(7)
    doc.setTextColor(...COLORES.grisClaro)
    let ubicacion = negocio.direccion
    if (negocio.piso) ubicacion += `, Piso ${negocio.piso}`
    if (negocio.departamento) ubicacion += ` ${negocio.departamento}`
    if (negocio.localidad) ubicacion += ` - ${negocio.localidad}`
    if (negocio.provincia) ubicacion += `, ${negocio.provincia}`
    doc.text(ubicacion, margin, y)
    y += 4
  }

  y += 2

  // Línea separadora
  doc.setDrawColor(...COLORES.borde)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)
  y += 4

  // Datos del emisor
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORES.texto)
  doc.text(config.razon_social || 'Sin razón social', margin, y)
  y += 4

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORES.gris)
  const datosFiscales = [`CUIT: ${formatearCuit(config.cuit)}`]
  datosFiscales.push(`${config.condicion_iva || 'Monotributista'}`)
  if (config.inicio_actividades) datosFiscales.push(`Inicio: ${config.inicio_actividades}`)
  doc.text(datosFiscales.join('  |  '), margin, y)
  y += 3

  if (config.domicilio_fiscal) {
    doc.text(`Domicilio: ${config.domicilio_fiscal}`, margin, y)
    y += 3
  }

  y += 3

  // Datos del receptor (cliente)
  doc.setFillColor(...COLORES.fondoClaro)
  doc.rect(margin, y, pageWidth - margin * 2, 16, 'F')
  doc.setDrawColor(...COLORES.borde)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, pageWidth - margin * 2, 16)

  y += 4

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORES.primario)
  doc.text('CLIENTE', margin + 3, y)
  y += 4

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORES.texto)
  doc.text(factura.receptor_nombre || 'Consumidor Final', margin + 3, y)
  y += 4

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORES.gris)
  const tipoDocNombre = obtenerNombreTipoDoc(factura.receptor_tipo_doc)
  const docInfo = factura.receptor_nro_doc && factura.receptor_nro_doc !== '0'
    ? `${tipoDocNombre}: ${factura.receptor_nro_doc}`
    : 'Consumidor Final'
  doc.text(`${docInfo}  |  Condición IVA: Consumidor Final`, margin + 3, y)

  y += 8

  return y
}

/**
 * Dibuja encabezado simplificado para páginas siguientes
 */
function dibujarEncabezadoSimplificado(doc, factura, config, margin, pageWidth, pagina, totalPaginas) {
  let y = margin

  doc.setFillColor(...COLORES.primario)
  doc.rect(0, 0, pageWidth, 3, 'F')

  y = 10

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORES.texto)
  const nombreComprobante = getNombreTipoComprobante(factura.tipo_comprobante)
  const numeroFormateado = formatearNumeroComprobante(factura.punto_venta, factura.numero_comprobante)
  doc.text(`${nombreComprobante} N° ${numeroFormateado}`, margin, y)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORES.gris)
  doc.text(`Página ${pagina} de ${totalPaginas}`, pageWidth - margin, y, { align: 'right' })

  y += 6

  doc.setDrawColor(...COLORES.borde)
  doc.line(margin, y, pageWidth - margin, y)

  return y + 4
}

/**
 * Dibuja la tabla de items
 */
function dibujarTablaItems(doc, items, y, margin, pageWidth, esPrimeraPagina) {
  // Cabecera de tabla
  doc.setFillColor(...COLORES.primario)
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('DESCRIPCIÓN', margin + 3, y + 4)
  doc.text('CANT.', pageWidth - 65, y + 4, { align: 'right' })
  doc.text('P. UNIT.', pageWidth - 40, y + 4, { align: 'right' })
  doc.text('SUBTOTAL', pageWidth - margin - 3, y + 4, { align: 'right' })
  y += 8

  // Items
  doc.setFont('helvetica', 'normal')
  items.forEach((item, idx) => {
    // Alternar fondo
    if (idx % 2 === 0) {
      doc.setFillColor(252, 252, 253)
      doc.rect(margin, y - 2, pageWidth - margin * 2, 6, 'F')
    }

    doc.setFontSize(8)
    doc.setTextColor(...COLORES.texto)

    // Descripción (truncar si es muy larga)
    const descripcion = item.descripcion || 'Servicio'
    const descCorta = descripcion.length > 55 ? descripcion.substring(0, 52) + '...' : descripcion
    doc.text(descCorta, margin + 3, y + 2)

    doc.setTextColor(...COLORES.gris)
    doc.text(String(item.cantidad || 1), pageWidth - 65, y + 2, { align: 'right' })
    doc.text(`$${formatearMonto(item.precioUnitario || item.subtotal)}`, pageWidth - 40, y + 2, { align: 'right' })

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORES.texto)
    doc.text(`$${formatearMonto(item.subtotal)}`, pageWidth - margin - 3, y + 2, { align: 'right' })
    doc.setFont('helvetica', 'normal')

    y += 6
  })

  y += 2
  doc.setDrawColor(...COLORES.borde)
  doc.line(margin, y, pageWidth - margin, y)

  return y + 4
}

/**
 * Dibuja la sección de totales
 */
function dibujarTotales(doc, factura, y, margin, pageWidth) {
  // Cuadro de total
  const totalBoxWidth = 65
  const totalBoxX = pageWidth - margin - totalBoxWidth

  doc.setFillColor(...COLORES.primario)
  doc.roundedRect(totalBoxX, y, totalBoxWidth, 12, 2, 2, 'F')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL', totalBoxX + 4, y + 5)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`$ ${formatearMonto(factura.importe_total)}`, totalBoxX + totalBoxWidth - 4, y + 9, { align: 'right' })

  y += 16

  // Período de servicio
  if (factura.fecha_servicio_desde || factura.fecha_servicio_hasta) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...COLORES.grisClaro)
    doc.text(
      `Período: ${formatearFecha(factura.fecha_servicio_desde)} al ${formatearFecha(factura.fecha_servicio_hasta)}`,
      margin,
      y
    )
    y += 6
  }

  return y
}

/**
 * Dibuja la sección CAE y QR
 */
async function dibujarSeccionCAE(doc, factura, config, y, margin, pageWidth, pageHeight) {
  // Fondo para sección CAE
  const caeBoxHeight = 28
  doc.setFillColor(...COLORES.fondoClaro)
  doc.rect(margin, y, pageWidth - margin * 2, caeBoxHeight, 'F')
  doc.setDrawColor(...COLORES.borde)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, pageWidth - margin * 2, caeBoxHeight)

  y += 4

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORES.primario)
  doc.text('COMPROBANTE ELECTRÓNICO', margin + 3, y)
  y += 5

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORES.texto)
  doc.text('CAE:', margin + 3, y)
  doc.setFont('helvetica', 'bold')
  doc.text(factura.cae, margin + 14, y)
  y += 4

  doc.setFont('helvetica', 'normal')
  doc.text('Vto. CAE:', margin + 3, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatearFecha(factura.cae_vencimiento), margin + 20, y)

  // QR Code - MÁS PEQUEÑO
  try {
    const qrData = generarDatosQR(factura, config)
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: 150,
      margin: 1,
      errorCorrectionLevel: 'M'
    })

    const qrSize = 22 // Reducido de 32
    const qrX = pageWidth - margin - qrSize - 3
    const qrY = y - 13

    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

    doc.setFontSize(5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORES.grisClaro)
    doc.text('Verificar AFIP', qrX + qrSize / 2, qrY + qrSize + 2, { align: 'center' })
  } catch (error) {
    console.error('Error generando QR:', error)
  }

  return y + 12
}

/**
 * Dibuja el pie de página
 */
function dibujarPiePagina(doc, pageWidth, pageHeight, pagina, totalPaginas) {
  // Barra inferior (más alta para dos líneas de texto)
  doc.setFillColor(...COLORES.primario)
  doc.rect(0, pageHeight - 14, pageWidth, 14, 'F')

  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)

  // Línea 1: Validez del comprobante
  doc.text(
    'Comprobante electrónico válido según RG 4291/2018 AFIP',
    pageWidth / 2,
    pageHeight - 9,
    { align: 'center' }
  )

  // Línea 2: Crédito a mimonotributo.ar
  doc.text(
    'Emitido con www.mimonotributo.ar - Herramientas y contabilidad fácil para monotributistas',
    pageWidth / 2,
    pageHeight - 4,
    { align: 'center' }
  )

  // Número de página si hay más de una
  if (totalPaginas > 1) {
    doc.text(`Pág. ${pagina}/${totalPaginas}`, pageWidth - 15, pageHeight - 4, { align: 'right' })
  }
}

/**
 * Descarga el PDF de la factura
 */
export async function descargarFacturaPDF(factura, config, negocio = null) {
  const doc = await generarFacturaPDF(factura, config, negocio)
  const cuitEmisor = config?.cuit || ''
  const nombreArchivo = `${getNombreTipoComprobante(factura.tipo_comprobante).replace(/ /g, '_')}_${formatearNumeroComprobante(factura.punto_venta, factura.numero_comprobante)}_${cuitEmisor}.pdf`
  doc.save(nombreArchivo)
}

/**
 * Abre el PDF en una nueva pestaña
 */
export async function verFacturaPDF(factura, config, negocio = null) {
  const doc = await generarFacturaPDF(factura, config, negocio)
  const pdfBlob = doc.output('blob')
  const pdfUrl = URL.createObjectURL(pdfBlob)
  window.open(pdfUrl, '_blank')
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function obtenerLetraComprobante(tipo) {
  switch (tipo) {
    case TIPOS_COMPROBANTE.FACTURA_C:
    case TIPOS_COMPROBANTE.NOTA_CREDITO_C:
    case TIPOS_COMPROBANTE.NOTA_DEBITO_C:
      return 'C'
    default:
      return 'X'
  }
}

function obtenerNombreTipoDoc(tipo) {
  switch (tipo) {
    case 80: return 'CUIT'
    case 86: return 'CUIL'
    case 87: return 'CDI'
    case 96: return 'DNI'
    case 99: return 'Doc'
    default: return 'Doc'
  }
}

function formatearCuit(cuit) {
  if (!cuit || cuit.length !== 11) return cuit
  return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`
}

function formatearFecha(fecha) {
  if (!fecha) return '-'
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatearMonto(monto) {
  return Number(monto).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function generarDatosQR(factura, config) {
  const data = {
    ver: 1,
    fecha: factura.fecha_comprobante,
    cuit: parseInt(config.cuit),
    ptoVta: factura.punto_venta,
    tipoCmp: factura.tipo_comprobante,
    nroCmp: factura.numero_comprobante,
    importe: parseFloat(factura.importe_total),
    moneda: 'PES',
    ctz: 1,
    tipoDocRec: factura.receptor_tipo_doc || 99,
    nroDocRec: factura.receptor_nro_doc ? parseInt(factura.receptor_nro_doc) : 0,
    tipoCodAut: 'E',
    codAut: parseInt(factura.cae)
  }

  const jsonStr = JSON.stringify(data)
  const base64 = btoa(jsonStr)
  return `https://www.afip.gob.ar/fe/qr/?p=${base64}`
}

async function cargarImagenBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = url
  })
}
