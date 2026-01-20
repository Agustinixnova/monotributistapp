/**
 * Modal de aviso cuando un cliente supera su límite de crédito
 */

import { AlertTriangle, X } from 'lucide-react'
import { formatearMonto } from '../utils/formatters'

export default function ModalAvisoLimite({
  isOpen,
  onClose,
  onConfirmar,
  cliente,
  montoFiado
}) {
  if (!isOpen || !cliente) return null

  const nombreCompleto = `${cliente.nombre} ${cliente.apellido || ''}`.trim()
  const deudaActual = cliente.deuda_actual || 0
  const deudaNueva = deudaActual + montoFiado
  const limiteCredito = cliente.limite_credito || 0
  const excedente = deudaNueva - limiteCredito

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm">
          {/* Header con icono de advertencia */}
          <div className="bg-orange-500 px-5 py-4 text-white flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-heading font-semibold text-lg">Limite superado</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-5 space-y-4">
            <p className="text-gray-700">
              <span className="font-semibold">{nombreCompleto}</span> superará su límite de crédito con esta operación.
            </p>

            {/* Detalle de montos */}
            <div className="bg-orange-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Límite de crédito:</span>
                <span className="font-medium text-gray-900">{formatearMonto(limiteCredito)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Deuda actual:</span>
                <span className="font-medium text-gray-900">{formatearMonto(deudaActual)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Nuevo cargo:</span>
                <span className="font-medium text-gray-900">{formatearMonto(montoFiado)}</span>
              </div>
              <div className="border-t border-orange-200 pt-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nueva deuda total:</span>
                  <span className="font-bold text-orange-600">{formatearMonto(deudaNueva)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Excede en:</span>
                  <span className="font-bold text-red-600">{formatearMonto(excedente)}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              ¿Querés cargar a la cuenta corriente de todas formas?
            </p>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
