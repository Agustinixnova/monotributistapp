import { X, AlertTriangle, Calendar } from 'lucide-react'
import { formatearMoneda } from '../utils/formatters'

export function ModalRecordatorioVencimiento({
  montoCuota,
  mesNombre,
  diasRestantes,
  onClose
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-xl">
        {/* Header con icono */}
        <div className="bg-amber-50 p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Recordatorio de pago
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            {diasRestantes === 0
              ? 'Tu cuota vence hoy'
              : diasRestantes === 1
                ? 'Tu cuota vence manana'
                : `Tu cuota vence en ${diasRestantes} dias`
            }
          </p>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          {/* Info de la cuota */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Cuota {mesNombre}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatearMoneda(montoCuota)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Vence</p>
                <p className="text-sm font-medium text-gray-900">20 de {mesNombre}</p>
              </div>
            </div>
          </div>

          {/* Mensaje de intereses */}
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              Despues del dia 20, se aplicaran <strong>intereses por mora</strong> al monto de tu cuota.
            </p>
          </div>

          {/* Boton */}
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
