/**
 * Modal para transferir dinero a caja secundaria
 */

import { useState } from 'react'
import { X, ArrowDownLeft, Loader2, Archive } from 'lucide-react'
import { formatearMonto } from '../utils/formatters'

export default function ModalTransferirSecundaria({
  isOpen,
  onClose,
  onConfirmar
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

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
          {/* Header */}
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-heading font-semibold text-lg">
                Transferir a Secundaria
              </h3>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              Este monto saldrá de tu caja principal y entrará a la caja secundaria.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto a transferir *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xl font-semibold"
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
                placeholder="Ej: Para pagar proveedor"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  Transferir
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
