/**
 * Modal para reintegrar dinero de caja secundaria a caja principal
 */

import { useState } from 'react'
import { X, ArrowUpRight, Loader2 } from 'lucide-react'
import { formatearMonto } from '../utils/formatters'

export default function ModalReintegrarSecundaria({
  isOpen,
  onClose,
  onConfirmar,
  saldoDisponible = 0
}) {
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleConfirmar = async () => {
    const montoNum = parseFloat(monto)
    if (!montoNum || montoNum <= 0) {
      setError('Ingresá un monto válido')
      return
    }
    if (montoNum > saldoDisponible) {
      setError(`Saldo insuficiente. Disponible: ${formatearMonto(saldoDisponible)}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onConfirmar(montoNum, descripcion.trim())
      setMonto('')
      setDescripcion('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setMonto('')
    setDescripcion('')
    setError(null)
    onClose()
  }

  // Botón para transferir todo
  const handleTodo = () => {
    setMonto(saldoDisponible.toString())
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
          {/* Header */}
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg">
                  Reintegrar a Principal
                </h3>
                <p className="text-xs text-gray-500">
                  Disponible: {formatearMonto(saldoDisponible)}
                </p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              Este monto volverá de la caja secundaria a tu caja principal del día.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Monto */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Monto a reintegrar *
                </label>
                <button
                  type="button"
                  onClick={handleTodo}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Todo ({formatearMonto(saldoDisponible)})
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0"
                  max={saldoDisponible}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl font-semibold"
                  autoFocus
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Necesito cambio"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t bg-gray-50 flex gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={loading || !monto}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  Reintegrar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
