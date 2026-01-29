/**
 * Modal para confirmar emisión de Nota de Crédito
 * Muestra datos de la factura a anular y confirma la operación
 */

import { useState } from 'react'
import { X, AlertTriangle, FileX2, Loader2, CheckCircle } from 'lucide-react'
import { formatearMonto } from '../../utils/formatters'
import { formatearNumeroComprobante } from '../../services/afipService'

export default function ModalNotaCredito({
  isOpen,
  onClose,
  onConfirmar,
  turno,
  procesando
}) {
  if (!isOpen || !turno) return null

  const factura = turno.facturaInfo
  if (!factura) return null

  const numeroFactura = formatearNumeroComprobante(
    factura.punto_venta,
    factura.numero_comprobante
  )

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-rose-500 px-5 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <FileX2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg">
                  Emitir Nota de Crédito
                </h3>
                <p className="text-white/80 text-sm">
                  Anular factura
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={procesando}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Advertencia */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Atención</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Vas a emitir una Nota de Crédito que anula completamente la factura original.
                    Esta operación no se puede deshacer y quedará registrada en ARCA.
                  </p>
                </div>
              </div>
            </div>

            {/* Datos de la factura a anular */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h4 className="font-medium text-gray-700 text-sm">Factura a anular</h4>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Comprobante</span>
                <span className="font-mono font-medium text-gray-900">
                  Factura C {numeroFactura}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Cliente</span>
                <span className="text-gray-900">{turno.nombreCliente}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Servicio</span>
                <span className="text-gray-900 text-sm truncate max-w-[180px]">
                  {turno.serviciosNombres}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">Importe a acreditar</span>
                <span className="text-lg font-bold text-red-600">
                  - {formatearMonto(factura.importe_total || turno.totalPagos)}
                </span>
              </div>
            </div>

            {/* Nota de Crédito resultante */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700">
                Se emitirá una <strong>Nota de Crédito C</strong> por el mismo importe,
                asociada a la factura original.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4 flex gap-3">
            <button
              onClick={onClose}
              disabled={procesando}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirmar(turno)}
              disabled={procesando}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {procesando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <FileX2 className="w-4 h-4" />
                  Anular factura
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
