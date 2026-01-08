import { useState, useRef } from 'react'
import {
  Upload, X, Trash2, Download, FileText, FileSpreadsheet,
  Image as ImageIcon, File, Loader2, Pencil, Check
} from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import {
  subirAdjunto,
  eliminarAdjunto,
  actualizarTituloAdjunto,
  formatFileSize
} from '../services/educacionStorageService'

const TIPOS_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
]

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Obtener icono segun tipo MIME
 */
function getIcon(mimeType) {
  if (!mimeType) return File
  if (mimeType.startsWith('image/')) return ImageIcon
  if (mimeType === 'application/pdf') return FileText
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet
  if (mimeType.includes('word') || mimeType.includes('document')) return FileText
  return File
}

/**
 * Componente para gestionar adjuntos de un articulo
 */
export function AdjuntosManager({ articuloId, adjuntos = [], onAdjuntosChange }) {
  const { user } = useAuth()
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState(null)
  const [editandoTitulo, setEditandoTitulo] = useState(null)
  const [tituloTemp, setTituloTemp] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validar archivos
    for (const file of files) {
      if (!TIPOS_PERMITIDOS.includes(file.type)) {
        setError(`Tipo de archivo no permitido: ${file.name}`)
        return
      }
      if (file.size > MAX_SIZE) {
        setError(`Archivo muy grande (max 10MB): ${file.name}`)
        return
      }
    }

    // Subir archivos
    try {
      setSubiendo(true)
      setError(null)

      const nuevosAdjuntos = []
      for (const file of files) {
        const adjunto = await subirAdjunto(file, articuloId, user.id)
        nuevosAdjuntos.push(adjunto)
      }

      onAdjuntosChange?.([...adjuntos, ...nuevosAdjuntos])
    } catch (err) {
      console.error('Error subiendo archivo:', err)
      setError(err.message || 'Error al subir archivo')
    } finally {
      setSubiendo(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleEliminar = async (adjunto) => {
    if (!confirm('¿Eliminar este archivo?')) return

    try {
      await eliminarAdjunto(adjunto.id)
      onAdjuntosChange?.(adjuntos.filter(a => a.id !== adjunto.id))
    } catch (err) {
      console.error('Error eliminando adjunto:', err)
      setError(err.message || 'Error al eliminar')
    }
  }

  const handleEditarTitulo = (adjunto) => {
    setEditandoTitulo(adjunto.id)
    setTituloTemp(adjunto.titulo || adjunto.nombre_original || '')
  }

  const handleGuardarTitulo = async (adjuntoId) => {
    try {
      await actualizarTituloAdjunto(adjuntoId, tituloTemp)
      onAdjuntosChange?.(
        adjuntos.map(a =>
          a.id === adjuntoId ? { ...a, titulo: tituloTemp } : a
        )
      )
      setEditandoTitulo(null)
      setTituloTemp('')
    } catch (err) {
      console.error('Error guardando titulo:', err)
      setError(err.message || 'Error al guardar titulo')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Material descargable</h3>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={subiendo || !articuloId}
          className="flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors text-sm disabled:opacity-50"
        >
          {subiendo ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Subir archivo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {!articuloId && (
        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
          Guarda el articulo primero para poder adjuntar archivos
        </p>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <X className="w-4 h-4 text-red-600" />
          <span className="text-red-700 text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {adjuntos.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <File className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No hay archivos adjuntos</p>
          <p className="text-gray-400 text-xs mt-1">
            PDF, Word, Excel, imagenes (max 10MB)
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {adjuntos.map((adjunto) => {
            const IconComponent = getIcon(adjunto.mime_type)
            const isEditing = editandoTitulo === adjunto.id

            return (
              <div
                key={adjunto.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <IconComponent className="w-5 h-5 text-gray-600" />
                </div>

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tituloTemp}
                        onChange={(e) => setTituloTemp(e.target.value)}
                        placeholder="Titulo del archivo"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleGuardarTitulo(adjunto.id)
                          if (e.key === 'Escape') setEditandoTitulo(null)
                        }}
                      />
                      <button
                        onClick={() => handleGuardarTitulo(adjunto.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditandoTitulo(null)}
                        className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {adjunto.titulo || adjunto.nombre_original}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(adjunto.tamanio)}
                      </p>
                    </>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditarTitulo(adjunto)}
                      className="p-1.5 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded"
                      title="Editar titulo"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <a
                      href={adjunto.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Descargar"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleEliminar(adjunto)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
