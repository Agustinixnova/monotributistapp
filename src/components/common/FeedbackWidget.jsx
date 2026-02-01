/**
 * Widget de Feedback
 * - Desktop: Botón flotante
 * - Mobile: Se accede desde el sidebar
 */

import { useState } from 'react'
import { MessageSquarePlus, X, Send, Bug, Lightbulb, HelpCircle, MessageCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const TIPOS_FEEDBACK = [
  { id: 'bug', label: 'Reportar error', icon: Bug, color: 'text-red-500' },
  { id: 'sugerencia', label: 'Sugerencia', icon: Lightbulb, color: 'text-yellow-500' },
  { id: 'pregunta', label: 'Pregunta', icon: HelpCircle, color: 'text-blue-500' },
  { id: 'comentario', label: 'Comentario', icon: MessageCircle, color: 'text-green-500' }
]

export default function FeedbackWidget({ showButton = true }) {
  const [modalAbierto, setModalAbierto] = useState(false)

  return (
    <>
      {/* Botón flotante - solo desktop */}
      {showButton && (
        <button
          onClick={() => setModalAbierto(true)}
          className="hidden md:flex fixed bottom-6 right-6 z-40 items-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg transition-all hover:scale-105"
          title="Enviar feedback"
        >
          <MessageSquarePlus size={20} />
          <span className="text-sm font-medium">Feedback</span>
        </button>
      )}

      {/* Modal */}
      {modalAbierto && (
        <ModalFeedback onClose={() => setModalAbierto(false)} />
      )}
    </>
  )
}

/**
 * Componente para abrir el modal desde el sidebar
 */
export function FeedbackSidebarItem({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2 text-left text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <MessageSquarePlus size={20} />
      <span>Enviar feedback</span>
    </button>
  )
}

/**
 * Hook para usar el modal de feedback desde cualquier lugar
 */
export function useFeedbackModal() {
  const [isOpen, setIsOpen] = useState(false)

  const openFeedback = () => setIsOpen(true)
  const closeFeedback = () => setIsOpen(false)

  const FeedbackModal = () => isOpen ? <ModalFeedback onClose={closeFeedback} /> : null

  return { openFeedback, closeFeedback, FeedbackModal }
}

/**
 * Modal de Feedback
 */
function ModalFeedback({ onClose }) {
  const [tipo, setTipo] = useState(null)
  const [descripcion, setDescripcion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState(null)

  const enviarFeedback = async () => {
    if (!tipo || !descripcion.trim()) return

    setEnviando(true)
    setError(null)

    try {
      // Capturar contexto
      const contexto = {
        url_origen: window.location.href,
        navegador: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        modulo: window.location.pathname.split('/')[1] || 'home'
      }

      const { error: err } = await supabase.rpc('enviar_feedback', {
        p_tipo: tipo,
        p_descripcion: descripcion.trim(),
        p_url_origen: contexto.url_origen,
        p_navegador: contexto.navegador,
        p_viewport: contexto.viewport,
        p_modulo: contexto.modulo
      })

      if (err) throw err

      setEnviado(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      console.error('Error enviando feedback:', err)
      setError('No se pudo enviar. Intentá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquarePlus size={24} />
            <div>
              <h3 className="font-heading font-semibold">Envianos tu feedback</h3>
              <p className="text-white/80 text-sm">Tu opinión nos ayuda a mejorar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5">
          {enviado ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="text-green-500" size={32} />
              </div>
              <h4 className="font-heading font-semibold text-lg text-gray-900">¡Gracias!</h4>
              <p className="text-gray-600 mt-1">Tu mensaje fue enviado correctamente.</p>
            </div>
          ) : (
            <>
              {/* Tipo de feedback */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Qué querés contarnos?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS_FEEDBACK.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTipo(t.id)}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        tipo === t.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <t.icon size={20} className={tipo === t.id ? 'text-orange-500' : t.color} />
                      <span className={`text-sm font-medium ${tipo === t.id ? 'text-orange-700' : 'text-gray-700'}`}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contanos más
                </label>
                <textarea
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder={
                    tipo === 'bug' ? '¿Qué pasó? ¿Qué esperabas que pasara?' :
                    tipo === 'sugerencia' ? '¿Qué te gustaría que agreguemos o mejoremos?' :
                    tipo === 'pregunta' ? '¿En qué podemos ayudarte?' :
                    'Dejanos tu comentario...'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  rows={4}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Botón enviar */}
              <button
                onClick={enviarFeedback}
                disabled={!tipo || !descripcion.trim() || enviando}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Enviar feedback
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-3">
                Se guardará automáticamente tu usuario y la página actual para entender mejor el contexto.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
