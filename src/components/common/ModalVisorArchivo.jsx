import { useState, useEffect } from 'react'
import { X, Download, ZoomIn, ZoomOut, RotateCw, FileText, Loader2 } from 'lucide-react'

/**
 * Modal para previsualizar archivos (imágenes, PDFs)
 * @param {Object} props
 * @param {string} props.url - URL del archivo
 * @param {string} props.nombre - Nombre del archivo
 * @param {string} props.tipo - Tipo MIME del archivo
 * @param {function} props.onClose - Función para cerrar el modal
 * @param {function} props.onDescargar - Función para descargar el archivo
 */
export function ModalVisorArchivo({ url, nombre, tipo, onClose, onDescargar }) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const esImagen = tipo?.startsWith('image/')
  const esPdf = tipo === 'application/pdf'

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleImageLoad = () => {
    setLoading(false)
  }

  const handleImageError = () => {
    setLoading(false)
    setError(true)
  }

  // Cerrar con Escape y zoom con teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === '+' || e.key === '=') setZoom(prev => Math.min(prev + 0.25, 3))
      if (e.key === '-') setZoom(prev => Math.max(prev - 0.25, 0.5))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Prevenir scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay oscuro */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal contenedor */}
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
          {/* Nombre del archivo */}
          <div className="flex items-center gap-2 text-gray-700 min-w-0">
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium truncate">
              {nombre}
            </span>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-1">
            {esImagen && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Alejar (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-gray-400 text-xs min-w-[2.5rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Acercar (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Rotar"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-gray-200 mx-1" />
              </>
            )}
            <button
              onClick={onDescargar}
              className="p-2 text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
              title="Descargar"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          {esImagen && (
            <>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                </div>
              )}
              {error ? (
                <div className="text-center text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No se pudo cargar la imagen</p>
                  <button
                    onClick={onDescargar}
                    className="mt-4 px-4 py-2 bg-violet-600 text-white hover:bg-violet-700 rounded-lg transition-colors"
                  >
                    Descargar archivo
                  </button>
                </div>
              ) : (
                <img
                  src={url}
                  alt={nombre}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  className="max-w-full max-h-[65vh] object-contain transition-transform duration-200 rounded-lg shadow-lg"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    opacity: loading ? 0 : 1
                  }}
                  draggable={false}
                />
              )}
            </>
          )}

          {esPdf && (
            <div className="w-full h-[65vh]">
              <iframe
                src={url}
                className="w-full h-full rounded-lg bg-white shadow-lg"
                title={nombre}
              />
            </div>
          )}

          {!esImagen && !esPdf && (
            <div className="text-center text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">{nombre}</p>
              <p className="text-sm text-gray-400 mb-4">
                Este tipo de archivo no se puede previsualizar
              </p>
              <button
                onClick={onDescargar}
                className="px-4 py-2 bg-violet-600 text-white hover:bg-violet-700 rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <Download className="w-5 h-5" />
                Descargar archivo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
