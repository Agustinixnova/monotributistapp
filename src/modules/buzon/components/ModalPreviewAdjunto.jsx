import { X, Download, FileText, Video, FileSpreadsheet, File as FileIcon, Image as ImageIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getAdjuntoUrl } from '../services/adjuntosService'

export function ModalPreviewAdjunto({ adjunto, onClose, onDownload }) {
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const esImagen = adjunto.type.startsWith('image/')
  const esPDF = adjunto.type === 'application/pdf'
  const esVideo = adjunto.type.startsWith('video/')
  const puedePrevisualizarse = esImagen || esPDF || esVideo

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        setLoading(true)
        const signedUrl = await getAdjuntoUrl(adjunto.path, 3600)
        setUrl(signedUrl)
      } catch (err) {
        console.error('Error obteniendo URL del adjunto:', err)
        setError('Error al cargar el archivo')
      } finally {
        setLoading(false)
      }
    }

    if (puedePrevisualizarse) {
      fetchUrl()
    } else {
      setLoading(false)
    }
  }, [adjunto.path, puedePrevisualizarse])

  const getFileIcon = () => {
    if (esImagen) return ImageIcon
    if (esVideo) return Video
    if (adjunto.type.includes('spreadsheet') || adjunto.type.includes('excel')) return FileSpreadsheet
    if (adjunto.type.includes('pdf') || adjunto.type.includes('word') || adjunto.type.includes('document')) return FileText
    return FileIcon
  }

  const Icon = getFileIcon()

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">{adjunto.name}</h2>
              <p className="text-sm text-gray-500">
                {(adjunto.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(adjunto.path, adjunto.name)}
              className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              title="Descargar"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Icon className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-sm">{error}</p>
            </div>
          ) : puedePrevisualizarse && url ? (
            <>
              {esImagen && (
                <div className="flex items-center justify-center h-full">
                  <img
                    src={url}
                    alt={adjunto.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              )}
              {esPDF && (
                <iframe
                  src={url}
                  className="w-full h-full min-h-[600px] rounded-lg shadow-lg bg-white"
                  title={adjunto.name}
                />
              )}
              {esVideo && (
                <div className="flex items-center justify-center h-full">
                  <video
                    src={url}
                    controls
                    className="max-w-full max-h-full rounded-lg shadow-lg"
                  >
                    Tu navegador no soporta la reproducción de videos.
                  </video>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Icon className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-sm font-medium mb-2">No se puede previsualizar este tipo de archivo</p>
              <p className="text-xs text-gray-400 mb-4">{adjunto.type}</p>
              <button
                onClick={() => onDownload(adjunto.path, adjunto.name)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar archivo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
