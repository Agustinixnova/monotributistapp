/**
 * Modal con desglose detallado de entradas y salidas por método de pago
 */

import { X, TrendingUp, TrendingDown } from 'lucide-react'
import { formatearMonto } from '../utils/formatters'
import IconoDinamico from './IconoDinamico'

export default function ModalDetalleResumen({ isOpen, onClose, totalesPorMetodo, fecha }) {
  if (!isOpen) return null

  // Separar entradas y salidas (los campos vienen como metodo_id, metodo_nombre, metodo_icono)
  const entradas = totalesPorMetodo.filter(t => parseFloat(t.total_entradas || 0) > 0)
  const salidas = totalesPorMetodo.filter(t => parseFloat(t.total_salidas || 0) > 0)

  // Totales generales
  const totalEntradas = entradas.reduce((sum, t) => sum + parseFloat(t.total_entradas || 0), 0)
  const totalSalidas = salidas.reduce((sum, t) => sum + parseFloat(t.total_salidas || 0), 0)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-semibold text-lg">Detalle del Día</h3>
                {fecha && (
                  <p className="text-sm text-violet-100 mt-0.5">
                    {new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'long'
                    })}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* ENTRADAS */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h4 className="font-heading font-semibold text-gray-900">Entradas</h4>
              </div>

              {entradas.length > 0 ? (
                <div className="space-y-2">
                  {entradas.map(metodo => (
                    <div
                      key={metodo.metodo_id}
                      className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <IconoDinamico
                          nombre={metodo.metodo_icono}
                          className="w-5 h-5 text-emerald-600"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {metodo.metodo_nombre}
                        </span>
                      </div>
                      <span className="font-bold text-emerald-700">
                        {formatearMonto(metodo.total_entradas)}
                      </span>
                    </div>
                  ))}

                  {/* Total entradas */}
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                    <span className="text-sm font-semibold text-emerald-700">Total Entradas</span>
                    <span className="text-lg font-bold text-emerald-700">
                      {formatearMonto(totalEntradas)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No hay entradas registradas</p>
              )}
            </div>

            {/* SALIDAS */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <h4 className="font-heading font-semibold text-gray-900">Salidas</h4>
              </div>

              {salidas.length > 0 ? (
                <div className="space-y-2">
                  {salidas.map(metodo => (
                    <div
                      key={metodo.metodo_id}
                      className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <IconoDinamico
                          nombre={metodo.metodo_icono}
                          className="w-5 h-5 text-red-600"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {metodo.metodo_nombre}
                        </span>
                      </div>
                      <span className="font-bold text-red-700">
                        {formatearMonto(metodo.total_salidas)}
                      </span>
                    </div>
                  ))}

                  {/* Total salidas */}
                  <div className="flex items-center justify-between pt-2 border-t border-red-200">
                    <span className="text-sm font-semibold text-red-700">Total Salidas</span>
                    <span className="text-lg font-bold text-red-700">
                      {formatearMonto(totalSalidas)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No hay salidas registradas</p>
              )}
            </div>

            {/* SALDO FINAL */}
            <div className="border-t-2 border-gray-300 pt-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="font-heading font-semibold text-gray-900">Saldo del Día</span>
                <span className={`text-2xl font-bold ${
                  totalEntradas - totalSalidas >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  {formatearMonto(totalEntradas - totalSalidas)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
