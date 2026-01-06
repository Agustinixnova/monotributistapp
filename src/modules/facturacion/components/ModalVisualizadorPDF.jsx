import { useState, useEffect } from 'react'
import { X, Download, ExternalLink } from 'lucide-react'
import { getSignedUrl } from '../services/storageFacturasService'

export function ModalVisualizadorPDF({ archivo, onClose }) {
  const [signedUrl, setSignedUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!archivo) return

    const obtenerUrl = async () => {
      setLoading(true)
      setError(null)
      try {
        // archivo puede ser un objeto con path o un string directo
        const path = typeof archivo === 'string' ? archivo : archivo.path
        if (!path) {
          throw new Error('No se encontro el path del archivo')
        }
        const url = await getSignedUrl(path, 3600) // 1 hora
        setSignedUrl(url)
      } catch (err) {
        console.error('Error obteniendo URL firmada:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    obtenerUrl()
  }, [archivo])

  if (!archivo) return null

  const fileName = typeof archivo === 'string'
    ? archivo.split('/').pop()
    : (archivo.fileName || archivo.nombre || 'Comprobante')

  const isPDF = fileName?.toLowerCase().endsWith('.pdf')

  const handleOpenNewTab = () => {
    if (signedUrl) {
      window.open(signedUrl, '_blank')
    }
  }

  const handleDownload = async () => {
    if (!signedUrl) return

    try {
      const response = await fetch(signedUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error descargando:', err)
      // Fallback: abrir en nueva pestaña
      window.open(signedUrl, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-gray-900 truncate pr-4">
            {fileName}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-auto bg-gray-100 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
              <div className="text-center text-red-500 p-4">
                <p>Error cargando archivo</p>
                <p className="text-sm mt-2">{error}</p>
              </div>
            </div>
          ) : isPDF ? (
            <iframe
              src={`${signedUrl}#toolbar=0`}
              className="w-full h-full min-h-[60vh]"
              title="Vista previa PDF"
            />
          ) : (
            <div className="flex items-center justify-center h-full p-8">
              <img
                src={signedUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:justify-end flex-shrink-0">
          <button
            onClick={handleOpenNewTab}
            disabled={!signedUrl}
            className="flex items-center justify-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir en nueva pestana
          </button>
          <button
            onClick={handleDownload}
            disabled={!signedUrl}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Descargar
          </button>
        </div>
      </div>
    </div>
  )
}
