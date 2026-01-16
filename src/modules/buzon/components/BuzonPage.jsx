import { useState, useEffect, useRef } from 'react'
import { Layout } from '../../../components/layout/Layout'
import { useAuth } from '../../../auth/hooks/useAuth'
import EmojiPicker from 'emoji-picker-react'
import {
  MessageSquare,
  Plus,
  ChevronLeft,
  Send,
  Loader2,
  Circle,
  CheckCircle,
  Archive,
  Clock,
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  File as FileIcon,
  Smile,
  X,
  Reply,
  Trash2
} from 'lucide-react'
import {
  getConversaciones,
  getConversacion,
  marcarComoLeida,
  responderConversacion
} from '../services/buzonService'
import { ModalEnviarMensaje } from './ModalEnviarMensaje'
import { ModalPreviewAdjunto } from './ModalPreviewAdjunto'
import { descargarAdjunto, subirAdjunto, validarArchivo } from '../services/adjuntosService'

export function BuzonPage() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const [conversaciones, setConversaciones] = useState([])
  const [conversacionActiva, setConversacionActiva] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingConversacion, setLoadingConversacion] = useState(false)
  const [showNuevoMensaje, setShowNuevoMensaje] = useState(false)
  const [respuesta, setRespuesta] = useState('')
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false)
  const [adjuntoPreview, setAdjuntoPreview] = useState(null)

  // Estados para adjuntos en respuesta
  const [adjuntosRespuesta, setAdjuntosRespuesta] = useState([])

  // Estados para emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Estado para responder a mensaje específico
  const [mensajeCitado, setMensajeCitado] = useState(null)

  // Helper para obtener icono de archivo
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return ImageIcon
    if (type.startsWith('video/')) return Video
    if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet
    if (type.includes('pdf') || type.includes('word') || type.includes('document')) return FileText
    return FileIcon
  }

  // Manejar descarga de adjunto
  const handleDescargarAdjunto = async (path, nombre) => {
    try {
      await descargarAdjunto(path, nombre)
    } catch (err) {
      console.error('Error descargando adjunto:', err)
      alert('Error al descargar el archivo')
    }
  }

  // Manejar selección de archivos para respuesta
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    agregarArchivosRespuesta(files)
  }

  // Agregar archivos a la respuesta
  const agregarArchivosRespuesta = (files) => {
    for (const file of files) {
      const validacion = validarArchivo(file)
      if (!validacion.valid) {
        alert(validacion.error)
        continue
      }

      // Crear preview para imágenes
      let preview = null
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      setAdjuntosRespuesta(prev => [...prev, {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview
      }])
    }
  }

  // Eliminar adjunto de respuesta
  const eliminarAdjuntoRespuesta = (index) => {
    setAdjuntosRespuesta(prev => {
      const nuevo = [...prev]
      if (nuevo[index].preview) {
        URL.revokeObjectURL(nuevo[index].preview)
      }
      nuevo.splice(index, 1)
      return nuevo
    })
  }

  // Insertar emoji
  const onEmojiClick = (emojiObject) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = respuesta
    const newText = text.substring(0, start) + emojiObject.emoji + text.substring(end)

    setRespuesta(newText)

    // Restaurar posición del cursor
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emojiObject.emoji.length
      textarea.focus()
    }, 0)
  }

  // Responder a mensaje específico
  const handleResponderMensaje = (mensaje) => {
    console.log('Respondiendo a mensaje:', mensaje)
    console.log('enviadoPor:', mensaje.enviadoPor)
    setMensajeCitado(mensaje)

    // Hacer scroll al textarea y enfocar
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      textareaRef.current?.focus()
    }, 100)
  }

  // Cancelar cita
  const handleCancelarCita = () => {
    setMensajeCitado(null)
  }

  const fetchConversaciones = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const data = await getConversaciones(user.id)
      setConversaciones(data)
    } catch (err) {
      console.error('Error cargando conversaciones:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // Fetch inicial
  useEffect(() => {
    if (user?.id) {
      fetchConversaciones()
    }
  }, [user?.id])

  // Auto-sync silencioso cada 2 minutos
  useEffect(() => {
    if (!user?.id) return

    const syncInterval = setInterval(async () => {
      // Actualizar lista de conversaciones en silencio
      await fetchConversaciones(true)

      // Si hay conversación activa, actualizar sus mensajes
      if (conversacionActiva?.id) {
        try {
          const data = await getConversacion(conversacionActiva.id)
          setConversacionActiva(data)
        } catch (err) {
          console.error('Error en auto-sync de conversación:', err)
        }
      }
    }, 2 * 60 * 1000) // 2 minutos

    return () => clearInterval(syncInterval)
  }, [user?.id, conversacionActiva?.id])

  // Debug: Log cuando cambia mensajeCitado
  useEffect(() => {
    if (mensajeCitado) {
      console.log('mensajeCitado actualizado:', mensajeCitado)
      console.log('enviadoPor:', mensajeCitado.enviadoPor)
    }
  }, [mensajeCitado])

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
    if ((!respuesta.trim() && adjuntosRespuesta.length === 0) || !conversacionActiva) return

    setEnviandoRespuesta(true)
    try {
      // 1. Subir adjuntos si hay
      let adjuntosData = []
      if (adjuntosRespuesta.length > 0) {
        const uploadPromises = adjuntosRespuesta.map(adj => subirAdjunto(adj.file, conversacionActiva.id))
        adjuntosData = await Promise.all(uploadPromises)
      }

      // 2. Enviar respuesta
      await responderConversacion(
        conversacionActiva.id,
        user.id,
        respuesta.trim() || '(Archivo adjunto)',
        adjuntosData,
        mensajeCitado?.id || null
      )

      // 3. Limpiar estados
      setRespuesta('')
      setAdjuntosRespuesta([])
      setMensajeCitado(null)
      setShowEmojiPicker(false)

      // 4. Recargar conversacion
      const data = await getConversacion(conversacionActiva.id)
      setConversacionActiva(data)

      // 5. Actualizar lista
      fetchConversaciones()
    } catch (err) {
      console.error('Error enviando respuesta:', err)
      alert('Error al enviar el mensaje')
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
                          De: {conv.iniciadoPor?.nombre && conv.iniciadoPor?.apellido
                            ? `${conv.iniciadoPor.nombre} ${conv.iniciadoPor.apellido}`
                            : conv.iniciadoPor?.nombre || conv.iniciadoPor?.email || 'Usuario'}
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
                        Iniciado por {conversacionActiva.iniciadoPor?.nombre && conversacionActiva.iniciadoPor?.apellido
                          ? `${conversacionActiva.iniciadoPor.nombre} ${conversacionActiva.iniciadoPor.apellido}`
                          : conversacionActiva.iniciadoPor?.nombre || conversacionActiva.iniciadoPor?.email || 'Usuario'}
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
                          {esMio ? 'Tu' : (msg.enviadoPor?.nombre && msg.enviadoPor?.apellido
                            ? `${msg.enviadoPor.nombre} ${msg.enviadoPor.apellido}`
                            : msg.enviadoPor?.nombre || msg.enviadoPor?.email || 'Usuario')}
                          {!esMio && esContadora && (
                            <span className="ml-1 text-violet-600">(Mimonotributo)</span>
                          )}
                        </p>

                        {/* Burbuja del mensaje */}
                        <div className={`rounded-2xl px-4 py-2 ${
                          esMio
                            ? 'bg-violet-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}>
                          {/* Mensaje citado dentro de la burbuja */}
                          {msg.mensajeRespondido && (
                            <div className={`mb-2 pb-2 border-l-2 pl-2 ${
                              esMio ? 'border-violet-400' : 'border-gray-400'
                            }`}>
                              <p className={`text-xs font-medium ${esMio ? 'text-violet-200' : 'text-gray-600'}`}>
                                {msg.mensajeRespondido.enviadoPor?.nombre && msg.mensajeRespondido.enviadoPor?.apellido
                                  ? `${msg.mensajeRespondido.enviadoPor.nombre} ${msg.mensajeRespondido.enviadoPor.apellido}`
                                  : msg.mensajeRespondido.enviadoPor?.nombre || 'Usuario'}
                              </p>
                              <p className={`text-xs ${esMio ? 'text-violet-100' : 'text-gray-500'} truncate`}>
                                {msg.mensajeRespondido.contenido}
                              </p>
                            </div>
                          )}

                          <p className="text-sm whitespace-pre-wrap">{msg.contenido}</p>

                          {/* Adjuntos */}
                          {msg.adjuntos && msg.adjuntos.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-opacity-20" style={{ borderColor: esMio ? 'white' : '#000' }}>
                              <div className="space-y-2">
                                {msg.adjuntos.map((adjunto, idx) => {
                                  const Icon = getFileIcon(adjunto.type)
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => setAdjuntoPreview(adjunto)}
                                      className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                                        esMio
                                          ? 'bg-violet-700 hover:bg-violet-800'
                                          : 'bg-white hover:bg-gray-50'
                                      }`}
                                    >
                                      <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                                        esMio ? 'bg-violet-800' : 'bg-gray-100'
                                      }`}>
                                        <Icon className={`w-4 h-4 ${esMio ? 'text-white' : 'text-gray-600'}`} />
                                      </div>
                                      <div className="flex-1 min-w-0 text-left">
                                        <p className={`text-xs font-medium truncate ${esMio ? 'text-white' : 'text-gray-900'}`}>
                                          {adjunto.name}
                                        </p>
                                        <p className={`text-xs ${esMio ? 'text-violet-200' : 'text-gray-500'}`}>
                                          {(adjunto.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                      </div>
                                      <Download className={`w-4 h-4 flex-shrink-0 ${esMio ? 'text-violet-200' : 'text-gray-400'}`} />
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Hora y botón responder */}
                        <div className={`flex items-center gap-2 mt-1 ${esMio ? 'justify-end' : 'justify-start'}`}>
                          <p className="text-xs text-gray-400">
                            {new Date(msg.created_at).toLocaleString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {conversacionActiva.estado === 'abierta' && (
                            <button
                              onClick={() => handleResponderMensaje(msg)}
                              className="text-xs text-gray-400 hover:text-violet-600 flex items-center gap-1 transition-colors"
                            >
                              <Reply className="w-3 h-3" />
                              Responder
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Input de respuesta */}
              {conversacionActiva.estado === 'abierta' && (
                <div className="p-4 border-t border-gray-100 space-y-3">
                  {/* Mensaje citado */}
                  {mensajeCitado && (
                    <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 flex items-start gap-2">
                      <Reply className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-violet-700">
                          Respondiendo a {mensajeCitado.enviadoPor?.nombre && mensajeCitado.enviadoPor?.apellido
                            ? `${mensajeCitado.enviadoPor.nombre} ${mensajeCitado.enviadoPor.apellido}`
                            : mensajeCitado.enviadoPor?.nombre || 'Usuario'}
                        </p>
                        <p className="text-xs text-violet-600 truncate mt-1">
                          {mensajeCitado.contenido}
                        </p>
                      </div>
                      <button
                        onClick={handleCancelarCita}
                        className="p-1 hover:bg-violet-100 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-violet-600" />
                      </button>
                    </div>
                  )}

                  {/* Adjuntos en respuesta */}
                  {adjuntosRespuesta.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {adjuntosRespuesta.map((adj, idx) => {
                        const Icon = getFileIcon(adj.type)
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2 pr-3 max-w-[200px]"
                          >
                            <div className="w-8 h-8 bg-violet-100 rounded flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4 text-violet-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">
                                {adj.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(adj.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <button
                              onClick={() => eliminarAdjuntoRespuesta(idx)}
                              className="p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Input principal */}
                  <div className="flex gap-2">
                    {/* File input hidden */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpeg,.jpg,.xlsx,.xls,.doc,.docx,.mp4,.mov,.avi,.webm,.mkv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Botones de acción */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Adjuntar archivo"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Agregar emoji"
                        >
                          <Smile className="w-5 h-5" />
                        </button>
                        {showEmojiPicker && (
                          <div className="absolute bottom-full left-0 mb-2 z-50">
                            <EmojiPicker
                              onEmojiClick={onEmojiClick}
                              width={320}
                              height={400}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Textarea */}
                    <textarea
                      ref={textareaRef}
                      value={respuesta}
                      onChange={(e) => setRespuesta(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleEnviarRespuesta()
                        }
                      }}
                      placeholder="Escribe tu respuesta..."
                      rows={1}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                      style={{ minHeight: '40px', maxHeight: '120px' }}
                    />

                    {/* Botón enviar */}
                    <button
                      onClick={handleEnviarRespuesta}
                      disabled={enviandoRespuesta || (!respuesta.trim() && adjuntosRespuesta.length === 0)}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 disabled:opacity-50 text-white rounded-xl transition-colors flex items-center justify-center"
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

      {/* Modal preview adjunto */}
      {adjuntoPreview && (
        <ModalPreviewAdjunto
          adjunto={adjuntoPreview}
          onClose={() => setAdjuntoPreview(null)}
          onDownload={handleDescargarAdjunto}
        />
      )}
    </Layout>
  )
}
