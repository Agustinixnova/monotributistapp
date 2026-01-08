import { useState } from 'react'
import { X, Check, XCircle, Edit3, User, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Modal para procesar una sugerencia con mas detalle
 * Permite aceptar, modificar o rechazar
 */
export function ModalProcesarSugerencia({
  sugerencia,
  onAceptar,
  onRechazar,
  onClose,
  procesando = false
}) {
  const [modo, setModo] = useState('revisar') // revisar | modificar | rechazar
  const [valorModificado, setValorModificado] = useState(sugerencia?.valor_sugerido || '')
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [error, setError] = useState(null)

  if (!sugerencia) return null

  const clienteNombre = sugerencia.cliente?.user?.full_name ||
    sugerencia.cliente?.user?.nombre ||
    sugerencia.cliente?.razon_social ||
    'Cliente'

  const handleAceptar = async () => {
    setError(null)
    try {
      await onAceptar?.(sugerencia.id, null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAceptarModificado = async () => {
    setError(null)
    if (!valorModificado.trim()) {
      setError('Debes ingresar un valor')
      return
    }
    try {
      await onAceptar?.(sugerencia.id, valorModificado)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRechazar = async () => {
    setError(null)
    try {
      await onRechazar?.(sugerencia.id, motivoRechazo || null)
    } catch (err) {
      setError(err.message)
    }
  }

  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Procesar sugerencia
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-4">
          {/* Info del cliente */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <Link
                to={`/mi-cartera/${sugerencia.client_id}`}
                className="font-medium text-gray-900 hover:text-violet-600"
              >
                {clienteNombre}
              </Link>
              {sugerencia.cliente?.cuit && (
                <p className="text-sm text-gray-500">CUIT: {sugerencia.cliente.cuit}</p>
              )}
            </div>
          </div>

          {/* Campo y valores */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Campo:</span>
              <span className="font-medium text-violet-700 bg-violet-50 px-2 py-1 rounded">
                {sugerencia.campo_label || sugerencia.campo}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <span className="text-xs text-gray-500 block mb-1">Valor actual</span>
                <span className="text-gray-700">
                  {sugerencia.valor_actual || <em className="text-gray-400">Sin datos</em>}
                </span>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-xs text-gray-500 block mb-1">Valor sugerido</span>
                <span className="text-green-700 font-medium">
                  {sugerencia.valor_sugerido}
                </span>
              </div>
            </div>

            {/* Comentario del cliente */}
            {sugerencia.comentario && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-xs text-blue-600 block mb-1">Comentario del cliente:</span>
                <p className="text-blue-800 italic">"{sugerencia.comentario}"</p>
              </div>
            )}

            <p className="text-xs text-gray-500">
              Enviada el {formatFecha(sugerencia.created_at)}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Modos */}
          {modo === 'revisar' && (
            <div className="pt-2">
              <p className="text-sm text-gray-600 mb-3">¿Que deseas hacer con esta sugerencia?</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleAceptar}
                  disabled={procesando}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex flex-col items-center gap-1 disabled:opacity-50"
                >
                  <Check className="w-5 h-5" />
                  <span className="text-sm">Aceptar</span>
                </button>
                <button
                  onClick={() => setModo('modificar')}
                  disabled={procesando}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex flex-col items-center gap-1 disabled:opacity-50"
                >
                  <Edit3 className="w-5 h-5" />
                  <span className="text-sm">Modificar</span>
                </button>
                <button
                  onClick={() => setModo('rechazar')}
                  disabled={procesando}
                  className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex flex-col items-center gap-1 disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm">Rechazar</span>
                </button>
              </div>
            </div>
          )}

          {modo === 'modificar' && (
            <div className="pt-2 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor a aplicar
                </label>
                <input
                  type="text"
                  value={valorModificado}
                  onChange={(e) => setValorModificado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Ingresa el valor correcto"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El cliente sugirio: {sugerencia.valor_sugerido}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setModo('revisar')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Volver
                </button>
                <button
                  onClick={handleAceptarModificado}
                  disabled={procesando || !valorModificado.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {procesando ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Aplicar valor
                </button>
              </div>
            </div>
          )}

          {modo === 'rechazar' && (
            <div className="pt-2 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo del rechazo (opcional)
                </label>
                <textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Explica por que se rechaza la sugerencia..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setModo('revisar')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Volver
                </button>
                <button
                  onClick={handleRechazar}
                  disabled={procesando}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {procesando ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Rechazar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
