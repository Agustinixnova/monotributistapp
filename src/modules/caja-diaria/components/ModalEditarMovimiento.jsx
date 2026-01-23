/**
 * Modal para editar o anular un movimiento de cuenta corriente
 */

import { useState, useEffect } from 'react'
import { X, Check, Trash2, AlertTriangle, Edit3 } from 'lucide-react'
import InputMonto from './InputMonto'
import { formatearMonto, formatearFechaCorta, formatearHora } from '../utils/formatters'

export default function ModalEditarMovimiento({
  isOpen,
  onClose,
  movimiento,
  onEditar,
  onAnular
}) {
  const [monto, setMonto] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [confirmandoAnular, setConfirmandoAnular] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && movimiento) {
      setMonto(movimiento.monto || 0)
      setError('')
      setConfirmandoAnular(false)
    }
  }, [isOpen, movimiento])

  const handleGuardar = async () => {
    if (monto <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    setGuardando(true)
    setError('')

    const result = await onEditar(movimiento.tipo, movimiento.id, monto)

    setGuardando(false)

    if (result.success) {
      onClose()
    } else {
      setError(result.error?.message || 'Error al guardar')
    }
  }

  const handleAnular = async () => {
    setGuardando(true)
    setError('')

    const result = await onAnular(movimiento.tipo, movimiento.id)

    setGuardando(false)

    if (result.success) {
      onClose()
    } else {
      setError(result.error?.message || 'Error al anular')
    }
  }

  if (!isOpen || !movimiento) return null

  const esFiado = movimiento.tipo === 'fiado'
  const tipoTexto = esFiado ? 'Cuenta Corriente' : 'Pago'
  const colorTipo = esFiado ? 'red' : 'emerald'

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm">
          {/* Header */}
          <div className={`bg-${colorTipo}-600 px-5 py-4 text-white flex items-center justify-between rounded-t-xl`}
               style={{ backgroundColor: esFiado ? '#dc2626' : '#059669' }}>
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              <h3 className="font-heading font-semibold text-lg">
                Editar {tipoTexto}
              </h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Info del movimiento */}
          <div className="px-5 py-4 bg-gray-50 border-b">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">
                {formatearFechaCorta(movimiento.fecha)} {formatearHora(movimiento.hora)}
              </span>
              <span className={`font-semibold ${esFiado ? 'text-red-600' : 'text-emerald-600'}`}>
                Actual: {formatearMonto(movimiento.monto)}
              </span>
            </div>
            {movimiento.descripcion && (
              <p className="text-sm text-gray-600 mt-1">{movimiento.descripcion}</p>
            )}
          </div>

          {/* Contenido */}
          {!confirmandoAnular ? (
            <div className="p-5 space-y-4">
              {/* Nuevo monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo monto
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400">$</span>
                  <InputMonto
                    value={monto}
                    onChange={setMonto}
                    placeholder="0"
                    className={`w-full pl-8 pr-4 py-3 text-2xl font-bold border-2 rounded-xl focus:ring-2 text-right ${
                      esFiado
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 text-red-600'
                        : 'border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-600'
                    }`}
                  />
                </div>
                {monto !== movimiento.monto && monto > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Diferencia: {monto > movimiento.monto ? '+' : ''}{formatearMonto(monto - movimiento.monto)}
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmandoAnular(true)}
                  className="flex items-center justify-center gap-1 px-3 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Anular
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={guardando || monto <= 0 || monto === movimiento.monto}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-white disabled:bg-gray-300 ${
                    esFiado
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Check className="w-5 h-5" />
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            /* Confirmación de anular */
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800">Anular movimiento</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Esta acción eliminará el {tipoTexto.toLowerCase()} de {formatearMonto(movimiento.monto)}.
                    {!esFiado && ' También se eliminará el movimiento de caja asociado.'}
                  </p>
                  <p className="text-sm text-red-700 mt-2 font-medium">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmandoAnular(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAnular}
                  disabled={guardando}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                  {guardando ? 'Anulando...' : 'Confirmar anular'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
