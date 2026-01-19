/**
 * Modal para agregar/editar comentario de un movimiento
 */

import { useState, useEffect, useRef } from 'react'
import { X, MessageSquare } from 'lucide-react'

export default function ModalComentario({
  isOpen,
  onClose,
  comentarioActual = '',
  onGuardar
}) {
  const [comentario, setComentario] = useState('')
  const [guardando, setGuardando] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setComentario(comentarioActual || '')
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen, comentarioActual])

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      await onGuardar(comentario)
      onClose()
    } catch (err) {
      console.error('Error guardando comentario:', err)
    } finally {
      setGuardando(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-violet-600" />
              <h3 className="font-heading font-semibold text-gray-900">
                {comentarioActual ? 'Editar comentario' : 'Agregar comentario'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-5">
            <textarea
              ref={textareaRef}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Escribí un comentario o nota sobre este movimiento..."
              maxLength={200}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {comentario.length}/200
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-5 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
