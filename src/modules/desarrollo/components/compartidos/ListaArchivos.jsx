import { useState } from 'react'
import { FileText, Image, File, Download, Trash2, ExternalLink } from 'lucide-react'
import { archivosService } from '../../services/archivosService'

/**
 * Lista de archivos adjuntos
 */
export function ListaArchivos({ archivos = [], onDelete, canDelete = false }) {
  const [loadingUrl, setLoadingUrl] = useState(null)

  const getFileIcon = (tipoMime) => {
    if (tipoMime?.startsWith('image/')) return Image
    if (tipoMime === 'application/pdf') return FileText
    return File
  }

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDownload = async (archivo) => {
    setLoadingUrl(archivo.id)
    try {
      const url = await archivosService.getUrl(archivo.ruta_storage)
      if (url) {
        window.open(url, '_blank')
      }
    } catch (err) {
      console.error('Error al obtener URL:', err)
    } finally {
      setLoadingUrl(null)
    }
  }

  const handleDelete = async (archivo) => {
    if (!confirm('¿Eliminar este archivo?')) return
    await onDelete?.(archivo.id, archivo.ruta_storage)
  }

  if (archivos.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        Sin archivos adjuntos
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {archivos.map(archivo => {
        const Icon = getFileIcon(archivo.tipo_mime)
        const isLoading = loadingUrl === archivo.id

        return (
          <div
            key={archivo.id}
            className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg group"
          >
            <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-gray-500" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 truncate">{archivo.nombre}</p>
              <p className="text-xs text-gray-400">{formatSize(archivo.tamanio)}</p>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleDownload(archivo)}
                disabled={isLoading}
                className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                title="Ver archivo"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {canDelete && (
                <button
                  onClick={() => handleDelete(archivo)}
                  className="p-1.5 hover:bg-red-100 rounded transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ListaArchivos
