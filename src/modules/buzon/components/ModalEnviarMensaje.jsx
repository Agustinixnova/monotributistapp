import { useState } from 'react'
import { X, Send, Loader2, MessageSquare } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { crearConversacion } from '../services/buzonService'

/**
 * Modal reutilizable para enviar mensajes al buzon
 *
 * Props:
 * - asunto: Asunto predefinido (opcional, editable si asuntoEditable=true)
 * - asuntoEditable: Si el asunto se puede editar (default: true)
 * - origen: De donde se origina el mensaje ('facturacion', 'exclusion', etc.)
 * - origenReferencia: Datos adicionales del contexto (objeto JSON)
 * - onClose: Funcion para cerrar el modal
 * - onSuccess: Funcion llamada al enviar exitosamente (recibe conversacionId)
 */
export function ModalEnviarMensaje({
  asunto: asuntoInicial = '',
  asuntoEditable = true,
  origen = 'general',
  origenReferencia = null,
  onClose,
  onSuccess
}) {
  const { user } = useAuth()
  const [asunto, setAsunto] = useState(asuntoInicial)
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleEnviar = async () => {
    if (!asunto.trim()) {
      setError('El asunto es requerido')
      return
    }
    if (!mensaje.trim()) {
      setError('El mensaje es requerido')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const conversacionId = await crearConversacion(
        user.id,
        asunto.trim(),
        mensaje.trim(),
        origen,
        origenReferencia
      )

      setSuccess(true)

      setTimeout(() => {
        onSuccess?.(conversacionId)
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Error enviando mensaje:', err)
      setError('Error al enviar el mensaje. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col safe-area-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-violet-600" />
            <h3 className="font-semibold text-gray-900">Enviar mensaje</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {success ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                Mensaje enviado
              </h4>
              <p className="text-sm text-gray-500">
                Tu contadora lo vera pronto
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Asunto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asunto
                </label>
                {asuntoEditable ? (
                  <input
                    type="text"
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    placeholder="Escribe el asunto..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                    {asunto}
                  </div>
                )}
              </div>

              {/* Mensaje */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje
                </label>
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Info */}
              <p className="text-xs text-gray-500">
                Tu mensaje sera enviado a tu contadora y podras ver las respuestas en tu Buzon de mensajes.
              </p>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="p-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleEnviar}
              disabled={loading || !asunto.trim() || !mensaje.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl transition-colors font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
