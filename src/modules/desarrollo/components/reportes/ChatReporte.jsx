import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Send, Paperclip, AlertCircle, Image, FileText, File, ExternalLink } from 'lucide-react'
import { getTipoReporte, getEstadoReporte, ESTADOS_REPORTE, getColorClasses, getIcon } from '../../utils/config'
import { puedeCambiarEstadoReporte } from '../../utils/permisos'
import { Avatar } from '../compartidos/Avatar'

/**
 * Vista de chat para un reporte
 */
export function ChatReporte({
  reporte,
  loading,
  onBack,
  onEnviarMensaje,
  onCambiarEstado,
  miRol
}) {
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const messagesEndRef = useRef(null)

  // Scroll al final cuando llegan mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [reporte?.mensajes])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!reporte) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Reporte no encontrado</p>
      </div>
    )
  }

  const tipo = getTipoReporte(reporte.tipo)
  const estado = getEstadoReporte(reporte.estado)
  const tipoColors = getColorClasses(tipo?.color || 'gray')
  const TipoIcon = getIcon(tipo?.icon)

  // Obtener icono según tipo de archivo
  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return Image
    if (mimeType === 'application/pdf') return FileText
    return File
  }

  const handleEnviar = async () => {
    if (!mensaje.trim() || enviando) return

    setEnviando(true)
    await onEnviarMensaje(mensaje.trim())
    setMensaje('')
    setEnviando(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnviar()
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>

          <div className="flex-1 min-w-0">
            {/* Tipo y Estado */}
            <div className="flex items-center gap-2 mb-1">
              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${tipoColors.bg} ${tipoColors.text}`}>
                <TipoIcon className="w-3 h-3" /> {tipo?.nombre}
              </span>
              {reporte.modulo && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {reporte.modulo.name}
                </span>
              )}
            </div>

            {/* Descripción */}
            <p className="text-sm text-gray-900 line-clamp-2">{reporte.descripcion}</p>
          </div>
        </div>

        {/* Botones de estado (solo dev) */}
        {puedeCambiarEstadoReporte(miRol) && (
          <div className="flex gap-2 mt-3 ml-11">
            {ESTADOS_REPORTE.map(e => {
              const colors = getColorClasses(e.color)
              const isActive = reporte.estado === e.id
              const EstadoIcon = getIcon(e.icon)
              return (
                <button
                  key={e.id}
                  onClick={() => !isActive && onCambiarEstado(e.id)}
                  disabled={isActive}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                    isActive
                      ? `${colors.bg} ${colors.text} font-medium`
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <EstadoIcon className="w-3 h-3" /> {e.nombre}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Mensaje inicial (descripción original) */}
        <div className="flex gap-3">
          {reporte.reportador && (
            <Avatar
              nombre={reporte.reportador.nombre}
              apellido={reporte.reportador.apellido}
              avatarUrl={reporte.reportador.avatar_url}
              size="md"
            />
          )}
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-medium text-sm text-gray-900">
                {reporte.reportador ? `${reporte.reportador.nombre || ''} ${reporte.reportador.apellido || ''}`.trim() || 'Usuario' : 'Usuario'}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(reporte.fecha_creacion).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{reporte.descripcion}</p>

              {/* Archivos adjuntos */}
              {reporte.archivos && reporte.archivos.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  {reporte.archivos.map(archivo => {
                    const FileIcon = getFileIcon(archivo.tipo_mime)
                    const isImage = archivo.tipo_mime?.startsWith('image/')

                    return (
                      <div key={archivo.id}>
                        {isImage ? (
                          <a
                            href={archivo.url_publica}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={archivo.url_publica}
                              alt={archivo.nombre}
                              className="max-w-xs rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                            />
                          </a>
                        ) : (
                          <a
                            href={archivo.url_publica}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <FileIcon className="w-5 h-5 text-gray-500" />
                            <span className="text-sm text-gray-700 flex-1 truncate">{archivo.nombre}</span>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de mensajes */}
        {reporte.mensajes?.map(msg => (
          <div key={msg.id} className="flex gap-3">
            {msg.autor && (
              <Avatar
                nombre={msg.autor.nombre}
                apellido={msg.autor.apellido}
                avatarUrl={msg.autor.avatar_url}
                size="md"
              />
            )}
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-medium text-sm text-gray-900">
                  {msg.autor ? `${msg.autor.nombre || ''} ${msg.autor.apellido || ''}`.trim() || 'Usuario' : 'Usuario'}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(msg.fecha).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.contenido}</p>
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Adjuntar archivo"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí un mensaje..."
            rows={1}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />

          <button
            onClick={handleEnviar}
            disabled={!mensaje.trim() || enviando}
            className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatReporte
