import { useState, useEffect } from 'react'
import { File, Image as ImageIcon, FileSpreadsheet, Download, Eye, Reply } from 'lucide-react'
import { getAdjuntoUrl, descargarAdjunto } from '../services/adjuntosService'
import { ModalVisorArchivo } from '../../../components/common/ModalVisorArchivo'

export function MensajeConAdjuntos({ mensaje, esMio, nombreRemitente, esContadora, onResponder }) {
  const [adjuntosConUrl, setAdjuntosConUrl] = useState([])
  const [archivoVisor, setArchivoVisor] = useState(null)

  useEffect(() => {
    console.log('🔍 MensajeConAdjuntos - mensaje completo:', mensaje)
    console.log('📎 MensajeConAdjuntos - adjuntos:', mensaje.adjuntos)

    if (!mensaje.adjuntos || mensaje.adjuntos.length === 0) {
      console.log('⚠️ No hay adjuntos en este mensaje')
      return
    }

    const cargarUrls = async () => {
      try {
        console.log('⬇️ Cargando URLs para adjuntos:', mensaje.adjuntos)
        const adjuntosPromises = mensaje.adjuntos.map(async (adj) => {
          const url = await getAdjuntoUrl(adj.path, 3600)
          return { ...adj, url }
        })

        const adjuntos = await Promise.all(adjuntosPromises)
        console.log('✅ Adjuntos con URLs:', adjuntos)
        setAdjuntosConUrl(adjuntos)
      } catch (err) {
        console.error('❌ Error cargando URLs de adjuntos:', err)
      }
    }

    cargarUrls()
  }, [mensaje.adjuntos])

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return ImageIcon
    if (type?.includes('spreadsheet') || type?.includes('excel')) return FileSpreadsheet
    return File
  }

  const handleDescargar = async (adjunto) => {
    try {
      await descargarAdjunto(adjunto.path, adjunto.name)
    } catch (err) {
      console.error('Error descargando:', err)
      alert('Error al descargar el archivo')
    }
  }

  const handlePreview = (adjunto) => {
    // Abrir el visor para imágenes y PDFs
    if (adjunto.type?.startsWith('image/') || adjunto.type === 'application/pdf') {
      setArchivoVisor(adjunto)
    } else {
      // Para otros archivos, descargar directamente
      handleDescargar(adjunto)
    }
  }

  return (
    <div className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${esMio ? 'order-2' : ''}`}>
        {/* Nombre del remitente */}
        <p className={`text-xs mb-1 ${esMio ? 'text-right' : 'text-left'} text-gray-500`}>
          {esMio ? 'Tú' : nombreRemitente}
          {!esMio && esContadora && (
            <span className="ml-1 text-violet-600 font-medium">(Contadora)</span>
          )}
        </p>

        {/* Burbuja del mensaje */}
        <div className={`rounded-2xl px-4 py-2 ${
          esMio
            ? 'bg-violet-600 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        }`}>
          {/* Mensaje citado */}
          {mensaje.mensajeCitado && (
            <div className={`mb-2 p-2 rounded-lg border-l-2 ${
              esMio
                ? 'bg-violet-700/50 border-violet-300'
                : 'bg-gray-200 border-gray-400'
            }`}>
              <p className={`text-xs font-medium ${esMio ? 'text-violet-200' : 'text-gray-600'}`}>
                {mensaje.mensajeCitado.enviadoPor
                  ? `${mensaje.mensajeCitado.enviadoPor.nombre || ''} ${mensaje.mensajeCitado.enviadoPor.apellido || ''}`.trim() || 'Usuario'
                  : 'Usuario'}
              </p>
              <p className={`text-xs line-clamp-2 ${esMio ? 'text-violet-100' : 'text-gray-500'}`}>
                {mensaje.mensajeCitado.contenido || 'Mensaje'}
              </p>
            </div>
          )}

          {mensaje.contenido && (
            <p className="text-sm whitespace-pre-wrap break-words">{mensaje.contenido}</p>
          )}

          {/* Adjuntos */}
          {adjuntosConUrl.length > 0 && (
            <div className={`space-y-2 ${mensaje.contenido ? 'mt-3' : ''}`}>
              {adjuntosConUrl.map((adjunto, index) => {
                const Icon = getFileIcon(adjunto.type)
                const esImagen = adjunto.type?.startsWith('image/')

                return (
                  <div
                    key={index}
                    className={`rounded-lg overflow-hidden ${
                      esMio ? 'bg-violet-700' : 'bg-white'
                    }`}
                  >
                    {esImagen && adjunto.url ? (
                      // Preview de imagen
                      <div className="relative group cursor-pointer" onClick={() => handlePreview(adjunto)}>
                        <img
                          src={adjunto.url}
                          alt={adjunto.name}
                          className="w-full max-w-[250px] rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ) : (
                      // Archivo no imagen
                      <div
                        className="flex items-center gap-2 p-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handlePreview(adjunto)}
                      >
                        <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                          esMio ? 'bg-violet-800' : 'bg-violet-50'
                        }`}>
                          <Icon className={`w-4 h-4 ${esMio ? 'text-violet-200' : 'text-violet-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${esMio ? 'text-white' : 'text-gray-900'}`}>
                            {adjunto.name}
                          </p>
                          <p className={`text-xs ${esMio ? 'text-violet-200' : 'text-gray-500'}`}>
                            {adjunto.size ? `${(adjunto.size / 1024).toFixed(0)} KB` : 'Archivo'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDescargar(adjunto)
                          }}
                          className={`p-1 rounded hover:bg-opacity-10 ${
                            esMio ? 'hover:bg-white text-white' : 'hover:bg-violet-600 text-violet-600'
                          }`}
                          title="Descargar"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Hora y botón responder */}
        <div className={`flex items-center gap-2 mt-1 ${esMio ? 'justify-end' : 'justify-start'}`}>
          {!esMio && onResponder && (
            <button
              onClick={() => onResponder(mensaje)}
              className="text-gray-400 hover:text-violet-600 transition-colors p-0.5"
              title="Responder a este mensaje"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
          )}
          <p className="text-xs text-gray-400">
            {new Date(mensaje.created_at).toLocaleString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          {esMio && onResponder && (
            <button
              onClick={() => onResponder(mensaje)}
              className="text-gray-400 hover:text-violet-600 transition-colors p-0.5"
              title="Responder a este mensaje"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Modal visor de archivo */}
      {archivoVisor && (
        <ModalVisorArchivo
          url={archivoVisor.url}
          nombre={archivoVisor.name}
          tipo={archivoVisor.type}
          onClose={() => setArchivoVisor(null)}
          onDescargar={() => handleDescargar(archivoVisor)}
        />
      )}
    </div>
  )
}
