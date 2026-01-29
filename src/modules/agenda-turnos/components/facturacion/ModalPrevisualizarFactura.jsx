/**
 * Modal de previsualización de factura
 * Muestra datos resumidos de la factura con opciones para ver PDF o descargar
 */

import { X, Download, Eye, FileText, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { formatearMonto } from '../../utils/formatters'
import { formatearNumeroComprobante, getConfiguracionAfip } from '../../services/afipService'
import { generarFacturaPDF, descargarFacturaPDF } from '../../services/facturasPdfService'
import { getEffectiveUserId } from '../../../caja-diaria/services/empleadosService'
import { getNegocio } from '../../services/negocioService'

export default function ModalPrevisualizarFactura({
  isOpen,
  onClose,
  factura,
  cliente,
  total,
  tipoComprobante,
  descripcion,
  facturaAnulada
}) {
  const [descargando, setDescargando] = useState(false)
  const [mostrarPDF, setMostrarPDF] = useState(false)
  const [cargandoPDF, setCargandoPDF] = useState(false)
  const [pdfUrl, setPdfUrl] = useState(null)

  if (!isOpen || !factura) return null

  const puntoVenta = factura.puntoVenta || factura.punto_venta
  const numero = factura.numero || factura.numero_comprobante
  const fecha = factura.fecha || factura.fecha_comprobante
  const cae = factura.cae
  const caeVto = factura.caeVencimiento || factura.cae_vencimiento
  const importe = total || factura.importeTotal || factura.importe_total

  // Determinar tipo de comprobante (default: Factura C = 11)
  const tipoComp = tipoComprobante || factura.tipo_comprobante || 11
  const esNotaCredito = tipoComp === 13
  const nombreComprobante = esNotaCredito ? 'Nota de Crédito C' : 'Factura C'

  // Construir objeto factura para PDF
  const construirFacturaParaPDF = async () => {
    const { userId } = await getEffectiveUserId()
    if (!userId) throw new Error('No hay usuario autenticado')

    const config = await getConfiguracionAfip(userId)
    if (!config) throw new Error('No hay configuración AFIP')

    // Obtener datos del negocio para incluir en el PDF
    const { data: negocio } = await getNegocio()

    let caeVencimiento = factura.caeVencimiento || factura.cae_vencimiento
    if (caeVencimiento && caeVencimiento.length === 8 && !caeVencimiento.includes('-')) {
      caeVencimiento = `${caeVencimiento.slice(0, 4)}-${caeVencimiento.slice(4, 6)}-${caeVencimiento.slice(6, 8)}`
    }

    // Obtener descripción del servicio desde props o factura
    const descripcionServicio = descripcion || factura.descripcion || factura.servicio_nombre || 'Servicio profesional'

    const facturaParaPDF = {
      tipo_comprobante: tipoComp,
      punto_venta: puntoVenta,
      numero_comprobante: numero,
      fecha_comprobante: fecha,
      cae: cae,
      cae_vencimiento: caeVencimiento,
      receptor_tipo_doc: 99,
      receptor_nro_doc: '0',
      receptor_nombre: cliente || 'Consumidor Final',
      importe_total: importe,
      descripcion: descripcionServicio,
      fecha_servicio_desde: fecha,
      fecha_servicio_hasta: fecha,
      // Para N/C, incluir referencia a factura anulada
      factura_anulada: facturaAnulada
    }

    return { facturaParaPDF, config, negocio }
  }

  const handleVerPDF = async () => {
    try {
      setCargandoPDF(true)
      const { facturaParaPDF, config, negocio } = await construirFacturaParaPDF()
      const doc = await generarFacturaPDF(facturaParaPDF, config, negocio)
      const pdfBlob = doc.output('blob')
      const url = URL.createObjectURL(pdfBlob)
      setPdfUrl(url)
      setMostrarPDF(true)
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el PDF: ' + error.message)
    } finally {
      setCargandoPDF(false)
    }
  }

  const handleDescargarPDF = async () => {
    try {
      setDescargando(true)
      const { facturaParaPDF, config, negocio } = await construirFacturaParaPDF()
      await descargarFacturaPDF(facturaParaPDF, config, negocio)
    } catch (error) {
      console.error('Error descargando PDF:', error)
      alert('Error al descargar el PDF: ' + error.message)
    } finally {
      setDescargando(false)
    }
  }

  const handleCerrarPDF = () => {
    setMostrarPDF(false)
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }
  }

  const handleCerrar = () => {
    handleCerrarPDF()
    onClose()
  }

  // Modal de visualización del PDF
  if (mostrarPDF && pdfUrl) {
    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCerrarPDF} />

        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className={`${esNotaCredito ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} px-5 py-4 text-white flex items-center justify-between flex-shrink-0`}>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" />
                <h3 className="font-heading font-semibold text-lg">
                  {nombreComprobante} - {formatearNumeroComprobante(puntoVenta, numero)}
                </h3>
              </div>
              <button
                onClick={handleCerrarPDF}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PDF embebido */}
            <div className="flex-1 bg-gray-100">
              <iframe
                src={pdfUrl}
                className="w-full h-[70vh] border-0"
                title="Factura PDF"
              />
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-5 py-4 flex gap-3 flex-shrink-0">
              <button
                onClick={handleCerrarPDF}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleDescargarPDF}
                disabled={descargando}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {descargando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Descargar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Modal principal con datos resumidos
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCerrar} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className={`${esNotaCredito ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} px-5 py-4 text-white flex items-center justify-between`}>
            <h3 className="font-heading font-semibold text-lg">
              {nombreComprobante}
            </h3>
            <button
              onClick={handleCerrar}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - Datos resumidos */}
          <div className="p-5">
            {/* Número de comprobante */}
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500">Comprobante Nro.</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatearNumeroComprobante(puntoVenta, numero)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Fecha: {fecha ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR') : '-'}
              </p>
            </div>

            {/* Datos del receptor */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">Cliente</p>
              <p className="font-medium text-gray-900">{cliente || 'Consumidor Final'}</p>
            </div>

            {/* Importe */}
            <div className={`${esNotaCredito ? 'bg-red-50' : 'bg-blue-50'} rounded-lg p-4 mb-4`}>
              <div className="flex items-center justify-between">
                <span className={`${esNotaCredito ? 'text-red-600' : 'text-blue-600'} font-medium`}>
                  {esNotaCredito ? 'Total acreditado' : 'Total'}
                </span>
                <span className={`text-2xl font-bold ${esNotaCredito ? 'text-red-700' : 'text-blue-700'}`}>
                  {esNotaCredito ? '- ' : ''}{formatearMonto(importe)}
                </span>
              </div>
              {facturaAnulada && (
                <p className="text-xs text-red-600 mt-2">
                  Anula Factura C {facturaAnulada}
                </p>
              )}
            </div>

            {/* CAE */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">CAE</span>
                <span className="font-mono text-sm font-medium text-gray-900">{cae}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Vencimiento CAE</span>
                <span className="text-sm text-gray-900">
                  {caeVto ? new Date(caeVto + 'T12:00:00').toLocaleDateString('es-AR') : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer con botones */}
          <div className="border-t border-gray-200 px-5 py-4 space-y-2">
            {/* Botones principales en una fila */}
            <div className="flex gap-2">
              <button
                onClick={handleVerPDF}
                disabled={cargandoPDF}
                className="flex-1 px-4 py-3 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cargandoPDF ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                Ver PDF
              </button>
              <button
                onClick={handleDescargarPDF}
                disabled={descargando}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {descargando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Descargar
              </button>
            </div>
            {/* Botón cerrar abajo */}
            <button
              onClick={handleCerrar}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
