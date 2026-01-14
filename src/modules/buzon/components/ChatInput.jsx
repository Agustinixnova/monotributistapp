import { useState, useRef, useEffect } from 'react'
import { Send, Smile, Paperclip, X, File, Image as ImageIcon, FileSpreadsheet, Loader2, Reply } from 'lucide-react'
import { subirAdjunto, validarArchivo } from '../services/adjuntosService'

const EMOJIS_COMUNES = [
  '👍', '👎', '❤️', '😊', '😂', '😢', '😮', '😡',
  '🎉', '🎊', '✅', '❌', '⚠️', '📄', '📊', '💰',
  '📅', '🔔', '📧', '📞', '✏️', '📌', '🔍', '💡'
]

export function ChatInput({ conversacionId, onEnviar, disabled, mensajeRespondiendo, onCancelarRespuesta }) {
  const [mensaje, setMensaje] = useState('')
  const [adjuntos, setAdjuntos] = useState([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  // Enfocar input cuando se selecciona mensaje para responder
  useEffect(() => {
    if (mensajeRespondiendo) {
      textareaRef.current?.focus()
    }
  }, [mensajeRespondiendo])

  const handleEmojiClick = (emoji) => {
    setMensaje(prev => prev + emoji)
    textareaRef.current?.focus()
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    agregarArchivos(files)
  }

  const agregarArchivos = (files) => {
    const nuevosAdjuntos = []

    for (const file of files) {
      const validacion = validarArchivo(file)
      if (!validacion.valid) {
        setError(validacion.error)
        setTimeout(() => setError(null), 3000)
        continue
      }

      // Evitar duplicados por nombre
      if (adjuntos.some(a => a.file.name === file.name)) {
        continue
      }

      nuevosAdjuntos.push({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      })
    }

    setAdjuntos(prev => [...prev, ...nuevosAdjuntos])
  }

  const eliminarAdjunto = (index) => {
    setAdjuntos(prev => {
      const nuevo = [...prev]
      // Liberar URL del preview
      if (nuevo[index].preview) {
        URL.revokeObjectURL(nuevo[index].preview)
      }
      nuevo.splice(index, 1)
      return nuevo
    })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    agregarArchivos(files)
  }

  const handleEnviar = async () => {
    if ((!mensaje.trim() && adjuntos.length === 0) || enviando) return

    setEnviando(true)
    setError(null)

    try {
      // Subir adjuntos primero
      const adjuntosSubidos = []
      for (const adjunto of adjuntos) {
        const resultado = await subirAdjunto(adjunto.file, conversacionId)
        adjuntosSubidos.push(resultado)
      }

      // Enviar mensaje con adjuntos y referencia al mensaje citado
      await onEnviar(mensaje.trim(), adjuntosSubidos, mensajeRespondiendo?.id || null)

      // Limpiar
      setMensaje('')
      setAdjuntos([])
      setShowEmojiPicker(false)
      onCancelarRespuesta?.()
    } catch (err) {
      console.error('Error enviando mensaje:', err)
      setError('Error al enviar el mensaje. Intenta nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return ImageIcon
    if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet
    return File
  }

  return (
    <div className="border-t border-gray-100">
      {/* Preview del mensaje al que se responde */}
      {mensajeRespondiendo && (
        <div className="px-4 py-2 bg-violet-50 border-b border-violet-100 flex items-start gap-2">
          <Reply className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-violet-700">
              Respondiendo a {mensajeRespondiendo.enviadoPor
                ? `${mensajeRespondiendo.enviadoPor.nombre || ''} ${mensajeRespondiendo.enviadoPor.apellido || ''}`.trim() || 'Usuario'
                : 'Usuario'}
            </p>
            <p className="text-xs text-violet-600 truncate">
              {mensajeRespondiendo.contenido || 'Mensaje'}
            </p>
          </div>
          <button
            onClick={onCancelarRespuesta}
            className="p-1 text-violet-400 hover:text-violet-600 hover:bg-violet-100 rounded transition-colors"
            title="Cancelar respuesta"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preview de adjuntos */}
      {adjuntos.length > 0 && (
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {adjuntos.map((adjunto, index) => {
              const Icon = getFileIcon(adjunto.file.type)
              return (
                <div
                  key={index}
                  className="relative group bg-white border border-gray-200 rounded-lg p-2 flex items-center gap-2 max-w-[200px]"
                >
                  {adjunto.preview ? (
                    <img
                      src={adjunto.preview}
                      alt={adjunto.file.name}
                      className="w-10 h-10 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-violet-50 rounded flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-violet-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {adjunto.file.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(adjunto.file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => eliminarAdjunto(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Picker de emojis */}
      {showEmojiPicker && (
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-wrap gap-1">
            {EMOJIS_COMUNES.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className="w-8 h-8 hover:bg-white rounded transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Zona de drag & drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-4 transition-colors ${
          isDragging ? 'bg-violet-50' : ''
        }`}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-violet-100/50 border-2 border-dashed border-violet-400 rounded-xl flex items-center justify-center z-10">
            <p className="text-violet-600 font-medium">Suelta los archivos aquí</p>
          </div>
        )}

        <div className="flex gap-2">
          {/* Botones de acciones */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              title="Emojis"
            >
              <Smile className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              title="Adjuntar archivo"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Input de texto */}
          <textarea
            ref={textareaRef}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleEnviar()
              }
            }}
            placeholder="Escribe un mensaje..."
            rows={1}
            disabled={disabled || enviando}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none disabled:bg-gray-50"
          />

          {/* Botón enviar */}
          <button
            onClick={handleEnviar}
            disabled={disabled || enviando || (!mensaje.trim() && adjuntos.length === 0)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            {enviando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Ayuda */}
        <p className="text-xs text-gray-400 mt-2">
          Arrastra archivos aquí o usa el clip para adjuntar. Max 10MB • PDF, JPG, PNG, XLSX
        </p>
      </div>
    </div>
  )
}
