import { useState, useEffect } from 'react'
import { Layout } from '../../../components/layout/Layout'
import { useAuth } from '../../../auth/hooks/useAuth'
import {
  MessageSquare,
  Plus,
  ChevronLeft,
  Send,
  Loader2,
  Circle,
  CheckCircle,
  Archive,
  Clock
} from 'lucide-react'
import {
  getConversaciones,
  getConversacion,
  marcarComoLeida,
  responderConversacion
} from '../services/buzonService'
import { ModalEnviarMensaje } from './ModalEnviarMensaje'

export function BuzonPage() {
  const { user } = useAuth()
  const [conversaciones, setConversaciones] = useState([])
  const [conversacionActiva, setConversacionActiva] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingConversacion, setLoadingConversacion] = useState(false)
  const [showNuevoMensaje, setShowNuevoMensaje] = useState(false)
  const [respuesta, setRespuesta] = useState('')
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false)

  const fetchConversaciones = async () => {
    try {
      setLoading(true)
      const data = await getConversaciones(user.id)
      setConversaciones(data)
    } catch (err) {
      console.error('Error cargando conversaciones:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchConversaciones()
    }
  }, [user?.id])

  const handleSelectConversacion = async (conv) => {
    setLoadingConversacion(true)
    try {
      const data = await getConversacion(conv.id)
      setConversacionActiva(data)

      // Marcar como leida
      if (!conv.leido) {
        await marcarComoLeida(conv.id, user.id)
        setConversaciones(prev =>
          prev.map(c => c.id === conv.id ? { ...c, leido: true } : c)
        )
      }
    } catch (err) {
      console.error('Error cargando conversacion:', err)
    } finally {
      setLoadingConversacion(false)
    }
  }

  const handleEnviarRespuesta = async () => {
    if (!respuesta.trim() || !conversacionActiva) return

    setEnviandoRespuesta(true)
    try {
      await responderConversacion(conversacionActiva.id, user.id, respuesta.trim())

      // Recargar conversacion
      const data = await getConversacion(conversacionActiva.id)
      setConversacionActiva(data)
      setRespuesta('')

      // Actualizar lista
      fetchConversaciones()
    } catch (err) {
      console.error('Error enviando respuesta:', err)
    } finally {
      setEnviandoRespuesta(false)
    }
  }

  const handleNuevoMensajeSuccess = () => {
    fetchConversaciones()
  }

  const formatFecha = (fecha) => {
    const date = new Date(fecha)
    const hoy = new Date()
    const ayer = new Date(hoy)
    ayer.setDate(ayer.getDate() - 1)

    if (date.toDateString() === hoy.toDateString()) {
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    } else if (date.toDateString() === ayer.toDateString()) {
      return 'Ayer'
    } else {
      return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
    }
  }

  const getOrigenLabel = (origen) => {
    const labels = {
      facturacion: 'Facturacion',
      exclusion: 'Riesgo de exclusion',
      recategorizacion: 'Recategorizacion',
      general: 'General'
    }
    return labels[origen] || origen
  }

  const getOrigenColor = (origen) => {
    const colors = {
      exclusion: 'bg-red-100 text-red-700',
      recategorizacion: 'bg-yellow-100 text-yellow-700',
      facturacion: 'bg-blue-100 text-blue-700',
      general: 'bg-gray-100 text-gray-700'
    }
    return colors[origen] || colors.general
  }

  return (
    <Layout title="Buzon de mensajes">
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-180px)] min-h-[500px]">
        {/* Lista de conversaciones */}
        <div className={`${conversacionActiva ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 bg-white rounded-xl border border-gray-200 overflow-hidden`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Mensajes</h2>
            <button
              onClick={() => setShowNuevoMensaje(true)}
              className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              title="Nuevo mensaje"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
              </div>
            ) : conversaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Sin mensajes</p>
                <p className="text-sm text-gray-400 mt-1">
                  Tus conversaciones apareceran aqui
                </p>
                <button
                  onClick={() => setShowNuevoMensaje(true)}
                  className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                >
                  Nuevo mensaje
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conversaciones.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversacion(conv)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      conversacionActiva?.id === conv.id ? 'bg-violet-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Indicador de no leido */}
                      <div className="pt-1">
                        {conv.leido ? (
                          <Circle className="w-2 h-2 text-transparent" />
                        ) : (
                          <Circle className="w-2 h-2 text-violet-600 fill-violet-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${conv.leido ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                            {conv.asunto}
                          </p>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatFecha(conv.ultimoMensaje)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${getOrigenColor(conv.origen)}`}>
                            {getOrigenLabel(conv.origen)}
                          </span>
                          {conv.estado === 'cerrada' && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Cerrada
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 mt-1 truncate">
                          De: {conv.iniciadoPor?.nombre || conv.iniciadoPor?.email || 'Usuario'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detalle de conversacion */}
        <div className={`${conversacionActiva ? 'flex' : 'hidden lg:flex'} flex-col flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden`}>
          {loadingConversacion ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : conversacionActiva ? (
            <>
              {/* Header de conversacion */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setConversacionActiva(null)}
                    className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{conversacionActiva.asunto}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${getOrigenColor(conversacionActiva.origen)}`}>
                        {getOrigenLabel(conversacionActiva.origen)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Iniciado por {conversacionActiva.iniciadoPor?.nombre || 'Usuario'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversacionActiva.mensajes?.map((msg) => {
                  const esMio = msg.enviado_por === user.id
                  const esContadora = ['admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario'].includes(msg.enviadoPor?.roles?.name)

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${esMio ? 'order-2' : ''}`}>
                        {/* Nombre del remitente */}
                        <p className={`text-xs mb-1 ${esMio ? 'text-right' : 'text-left'} text-gray-500`}>
                          {esMio ? 'Tu' : (msg.enviadoPor?.nombre || 'Usuario')}
                          {!esMio && esContadora && (
                            <span className="ml-1 text-violet-600">(Contadora)</span>
                          )}
                        </p>

                        {/* Burbuja del mensaje */}
                        <div className={`rounded-2xl px-4 py-2 ${
                          esMio
                            ? 'bg-violet-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.contenido}</p>
                        </div>

                        {/* Hora */}
                        <p className={`text-xs mt-1 ${esMio ? 'text-right' : 'text-left'} text-gray-400`}>
                          {new Date(msg.created_at).toLocaleString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Input de respuesta */}
              {conversacionActiva.estado === 'abierta' && (
                <div className="p-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={respuesta}
                      onChange={(e) => setRespuesta(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleEnviarRespuesta()}
                      placeholder="Escribe tu respuesta..."
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleEnviarRespuesta}
                      disabled={enviandoRespuesta || !respuesta.trim()}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl transition-colors"
                    >
                      {enviandoRespuesta ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Conversacion cerrada */}
              {conversacionActiva.estado === 'cerrada' && (
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                    <Archive className="w-4 h-4" />
                    Esta conversacion esta cerrada
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium">Selecciona una conversacion</p>
              <p className="text-sm text-gray-400 mt-1">
                O crea un nuevo mensaje
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal nuevo mensaje */}
      {showNuevoMensaje && (
        <ModalEnviarMensaje
          onClose={() => setShowNuevoMensaje(false)}
          onSuccess={handleNuevoMensajeSuccess}
        />
      )}
    </Layout>
  )
}
