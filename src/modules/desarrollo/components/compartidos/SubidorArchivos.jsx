import { useRef, useState } from 'react'
import { Upload, X, FileText, Image, File } from 'lucide-react'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/json'
]

/**
 * Componente para subir archivos
 */
export function SubidorArchivos({ onUpload, multiple = false, className = '' }) {
  const inputRef = useRef(null)
  const [archivos, setArchivos] = useState([])
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e) => {
    const files = Array.from(e.target.files || [])
    setError(null)

    // Validar archivos
    const archivosValidos = []
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} es muy grande (máx 10MB)`)
        continue
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`${file.name} no es un tipo permitido`)
        continue
      }
      archivosValidos.push(file)
    }

    if (multiple) {
      setArchivos(prev => [...prev, ...archivosValidos])
    } else {
      setArchivos(archivosValidos.slice(0, 1))
    }

    // Reset input
    e.target.value = ''
  }

  const handleRemove = (index) => {
    setArchivos(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (archivos.length === 0) return

    setUploading(true)
    setError(null)

    try {
      for (const archivo of archivos) {
        await onUpload(archivo)
      }
      setArchivos([])
    } catch (err) {
      setError(err.message || 'Error al subir')
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (tipo) => {
    if (tipo.startsWith('image/')) return Image
    if (tipo === 'application/pdf') return FileText
    return File
  }

  return (
    <div className={className}>
      {/* Área de drop / click */}
      <div
        onClick={handleClick}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleChange}
          className="hidden"
        />
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">
          Click para seleccionar {multiple ? 'archivos' : 'un archivo'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Imágenes, PDF o texto (máx 10MB)
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}

      {/* Lista de archivos seleccionados */}
      {archivos.length > 0 && (
        <div className="mt-3 space-y-2">
          {archivos.map((archivo, index) => {
            const Icon = getFileIcon(archivo.type)
            return (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
              >
                <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate flex-1">
                  {archivo.name}
                </span>
                <span className="text-xs text-gray-400">
                  {(archivo.size / 1024).toFixed(0)} KB
                </span>
                <button
                  onClick={() => handleRemove(index)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )
          })}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full mt-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Subir {archivos.length > 1 ? `${archivos.length} archivos` : 'archivo'}
          </button>
        </div>
      )}
    </div>
  )
}

export default SubidorArchivos
