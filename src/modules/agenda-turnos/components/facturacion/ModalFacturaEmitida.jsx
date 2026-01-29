/**
 * Modal de resultado de facturación
 * Muestra las facturas emitidas y errores
 */

import { useState } from 'react'
import { X, CheckCircle, XCircle, Receipt, FileText, Download, Eye, Loader2, FileX2 } from 'lucide-react'
import { formatearMonto } from '../../utils/formatters'
import { formatearNumeroComprobante, getConfiguracionAfip } from '../../services/afipService'
import { descargarFacturaPDF } from '../../services/facturasPdfService'
import { getEffectiveUserId } from '../../../caja-diaria/services/empleadosService'
import { getNegocio } from '../../services/negocioService'
import ModalPrevisualizarFactura from './ModalPrevisualizarFactura'

export default function ModalFacturaEmitida({
  isOpen,
  onClose,
  resultado
}) {
  const [descargando, setDescargando] = useState(null) // ID de factura descargando
  const [facturaPreview, setFacturaPreview] = useState(null)

  if (!isOpen || !resultado) return null

  const { tipo, resultados = [], errores = [] } = resultado
  const esNotaCredito = tipo === 'nota_credito'

  // Descargar PDF de una factura
  const handleDescargarPDF = async (resultadoItem) => {
    const facturaInfo = resultadoItem.factura
    try {
      setDescargando(facturaInfo.numero)

      const { userId } = await getEffectiveUserId()
      if (!userId) throw new Error('No hay usuario autenticado')

      // Obtener configuración AFIP
      const config = await getConfiguracionAfip(userId)
      if (!config) throw new Error('No hay configuración AFIP')

      // Obtener datos del negocio para incluir en el PDF
      const { data: negocio } = await getNegocio()

      // Formatear fecha de vencimiento CAE (viene en formato YYYYMMDD)
      let caeVencimiento = facturaInfo.caeVencimiento
      if (caeVencimiento && caeVencimiento.length === 8 && !caeVencimiento.includes('-')) {
        caeVencimiento = `${caeVencimiento.slice(0, 4)}-${caeVencimiento.slice(4, 6)}-${caeVencimiento.slice(6, 8)}`
      }

      // Obtener descripción del servicio
      const descripcionServicio = resultadoItem.servicio_nombre || facturaInfo.descripcion || 'Servicio profesional'

      // Construir objeto factura para el PDF
      // Usar tipo de comprobante del resultado o default a Factura C (11)
      const tipoComprobante = resultadoItem.tipoComprobante || 11

      const facturaParaPDF = {
        tipo_comprobante: tipoComprobante,
        punto_venta: facturaInfo.puntoVenta,
        numero_comprobante: facturaInfo.numero,
        fecha_comprobante: facturaInfo.fecha,
        cae: facturaInfo.cae,
        cae_vencimiento: caeVencimiento,
        receptor_tipo_doc: 99, // Consumidor Final por defecto
        receptor_nro_doc: '0',
        receptor_nombre: resultadoItem.cliente || 'Consumidor Final',
        importe_total: resultadoItem.total || facturaInfo.importeTotal,
        descripcion: resultadoItem.descripcion || descripcionServicio,
        fecha_servicio_desde: facturaInfo.fecha,
        fecha_servicio_hasta: facturaInfo.fecha,
        // Para N/C, incluir referencia a factura anulada
        factura_anulada: resultadoItem.facturaAnulada
      }

      await descargarFacturaPDF(facturaParaPDF, config, negocio)
    } catch (error) {
      console.error('Error descargando PDF:', error)
      alert('Error al descargar el PDF: ' + error.message)
    } finally {
      setDescargando(null)
    }
  }
  const hayExito = resultados.length > 0
  const hayErrores = errores.length > 0

  // Calcular total facturado
  const totalFacturado = resultados.reduce((sum, r) => sum + r.total, 0)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className={`px-5 py-4 text-white flex items-center justify-between flex-shrink-0 ${
            esNotaCredito && hayExito && !hayErrores
              ? 'bg-gradient-to-r from-red-500 to-rose-500'
              : hayExito && !hayErrores
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : hayErrores && !hayExito
                  ? 'bg-gradient-to-r from-red-500 to-rose-500'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                {esNotaCredito && hayExito ? (
                  <FileX2 className="w-5 h-5" />
                ) : hayExito && !hayErrores ? (
                  <CheckCircle className="w-5 h-5" />
                ) : hayErrores && !hayExito ? (
                  <XCircle className="w-5 h-5" />
                ) : (
                  <Receipt className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg">
                  {esNotaCredito && hayExito
                    ? 'Nota de Crédito emitida'
                    : hayExito && !hayErrores
                      ? 'Facturación exitosa'
                      : hayErrores && !hayExito
                        ? 'Error en facturación'
                        : 'Facturación parcial'
                  }
                </h3>
                <p className="text-white/80 text-sm">
                  {esNotaCredito && hayExito
                    ? 'Factura anulada correctamente'
                    : hayExito
                      ? `${resultados.length} factura${resultados.length !== 1 ? 's' : ''} emitida${resultados.length !== 1 ? 's' : ''}`
                      : 'No se pudieron emitir facturas'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Advertencias (si la factura se emitió pero no se guardó en DB) */}
            {resultados.some(r => r.advertencia) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Receipt className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Atención</p>
                    <p className="text-sm text-amber-700 mt-1">
                      {resultados.find(r => r.advertencia)?.advertencia}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Resumen de éxito */}
            {hayExito && (
              <>
                <div className={`${esNotaCredito ? 'bg-red-50' : 'bg-green-50'} rounded-xl p-4`}>
                  <div className="flex items-center justify-between">
                    <span className={`${esNotaCredito ? 'text-red-600' : 'text-green-600'} font-medium`}>
                      {esNotaCredito ? 'Total acreditado' : 'Total facturado'}
                    </span>
                    <span className={`text-xl font-bold ${esNotaCredito ? 'text-red-700' : 'text-green-700'}`}>
                      {esNotaCredito ? '- ' : ''}{formatearMonto(totalFacturado)}
                    </span>
                  </div>
                </div>

                {/* Lista de facturas/NC emitidas */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    {esNotaCredito ? (
                      <FileX2 className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {esNotaCredito ? 'Nota de Crédito emitida' : 'Facturas emitidas'}
                  </h4>
                  <div className="space-y-2">
                    {resultados.map((resultado, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">
                                {esNotaCredito ? 'Nota de Crédito C' : 'Factura C'} {formatearNumeroComprobante(
                                  resultado.factura.puntoVenta,
                                  resultado.factura.numero
                                )}
                              </p>
                              {resultado.tipo === 'agrupado' && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                  Agrupada
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{resultado.cliente}</p>
                            {resultado.tipo === 'agrupado' && (
                              <p className="text-xs text-gray-500">
                                {resultado.turnos} turno{resultado.turnos !== 1 ? 's' : ''} agrupado{resultado.turnos !== 1 ? 's' : ''}
                              </p>
                            )}
                            {resultado.facturaAnulada && (
                              <p className="text-xs text-red-600 mt-1">
                                Anula Factura C {resultado.facturaAnulada}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              CAE: {resultado.factura.cae}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${esNotaCredito ? 'text-red-600' : 'text-gray-900'}`}>
                              {esNotaCredito ? '- ' : ''}{formatearMonto(resultado.total)}
                            </p>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => setFacturaPreview({
                              factura: resultado.factura,
                              cliente: resultado.cliente,
                              total: resultado.total,
                              tipoComprobante: resultado.tipoComprobante,
                              descripcion: resultado.descripcion,
                              facturaAnulada: resultado.facturaAnulada
                            })}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Previsualizar
                          </button>
                          <button
                            onClick={() => handleDescargarPDF(resultado)}
                            disabled={descargando === resultado.factura.numero}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                          >
                            {descargando === resultado.factura.numero ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            Descargar PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Errores */}
            {hayErrores && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  Errores ({errores.length})
                </h4>
                <div className="space-y-2">
                  {errores.map((error, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="font-medium text-red-800">{error.cliente}</p>
                      <p className="text-sm text-red-600">{error.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de previsualización */}
      <ModalPrevisualizarFactura
        isOpen={!!facturaPreview}
        onClose={() => setFacturaPreview(null)}
        factura={facturaPreview?.factura}
        cliente={facturaPreview?.cliente}
        total={facturaPreview?.total}
        tipoComprobante={facturaPreview?.tipoComprobante}
        descripcion={facturaPreview?.descripcion}
        facturaAnulada={facturaPreview?.facturaAnulada}
      />
    </div>
  )
}
