import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { formatearMoneda } from '../utils/formatters'

export function ModalObservacion({ carga, onClose, onConfirmar }) {
  const [nota, setNota] = useState(carga.nota_observacion || '')
  const [loading, setLoading] = useState(false)

  const handleConfirmar = async () => {
    if (!nota.trim()) return

    setLoading(true)
    try {
      await onConfirmar(nota.trim())
    } finally {
      setLoading(false)
    }
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-900">Agregar observacion</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Info del comprobante */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                carga.tipo_comprobante === 'FC' ? 'bg-green-100 text-green-700' :
                carga.tipo_comprobante === 'NC' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {carga.tipo_comprobante}-{carga.letra_comprobante}
              </span>
              <span className="font-medium">{formatearMoneda(carga.monto)}</span>
              <span className="text-sm text-gray-400">{formatearFecha(carga.fecha_emision)}</span>
            </div>
          </div>

          {/* Campo de nota */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Que observacion tenes?
            </label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: El monto no coincide con el PDF, verificar..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              El cliente recibira una notificacion con esta observacion.
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={!nota.trim() || loading}
              className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
