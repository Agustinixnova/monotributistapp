import { useState, useRef, useCallback } from 'react'
import { X, AlertTriangle, AlertCircle, Upload, Paperclip, Image, FileText, File, Trash2 } from 'lucide-react'
import { TIPOS_REPORTE, getIcon } from '../../utils/config'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 5

/**
 * Formulario para crear nuevo reporte de bug/error
 */
export function FormReporte({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    ubicacion: '',
    tipo: 'error',
    descripcion: ''
  })
  const [archivos, setArchivos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Procesar archivos (desde input, drag&drop o paste)
  const processFiles = useCallback((files) => {
    const newFiles = []

    for (const file of files) {
      // Validar tamaño
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} es muy grande (máx 10MB)`)
        continue
      }

      // Validar cantidad
      if (archivos.length + newFiles.length >= MAX_FILES) {
        setError(`Máximo ${MAX_FILES} archivos`)
        break
      }

      // Crear preview para imágenes
      const fileObj = {
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        type: file.type,
        size: file.size,
        preview: null
      }

      if (file.type.startsWith('image/')) {
        fileObj.preview = URL.createObjectURL(file)
      }

      newFiles.push(fileObj)
    }

    if (newFiles.length > 0) {
      setArchivos(prev => [...prev, ...newFiles])
      setError(null)
    }
  }, [archivos.length])

  // Manejar input de archivos
  const handleFileInput = (e) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files))
    }
    e.target.value = ''
  }

  // Manejar drag & drop
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

    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files))
    }
  }

  // Eliminar archivo
  const removeFile = (id) => {
    setArchivos(prev => {
      const updated = prev.filter(f => f.id !== id)
      // Liberar URL de preview
      const removed = prev.find(f => f.id === id)
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return updated
    })
  }

  // Obtener icono según tipo de archivo
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return Image
    if (type === 'application/pdf') return FileText
    return File
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.descripcion.trim()) {
      setError('Describí qué está pasando')
      return
    }

    setLoading(true)
    setError(null)

    // Preparar datos para enviar
    const dataToSubmit = {
      ...formData,
      submodulo: formData.ubicacion, // Usar ubicacion como submodulo
      archivos: archivos.map(a => a.file)
    }

    const result = await onSubmit(dataToSubmit)

    if (result.error) {
      setError(result.error.message || 'Error al crear el reporte')
      setLoading(false)
    }
  }

  const tipoSeleccionado = TIPOS_REPORTE.find(t => t.id === formData.tipo)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Reportar problema</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Tipo de reporte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Qué tipo de problema es?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS_REPORTE.map(t => {
                const IconComponent = getIcon(t.icon)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleChange('tipo', t.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                      formData.tipo === t.id
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="w-6 h-6" />
                    <span className="text-xs font-medium">{t.nombre}</span>
                  </button>
                )
              })}
            </div>
            {tipoSeleccionado && (
              <p className="mt-2 text-xs text-gray-500">{tipoSeleccionado.descripcion}</p>
            )}
          </div>

          {/* Ubicación - Campo de texto libre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿En qué parte de la app pasa?
            </label>
            <input
              type="text"
              value={formData.ubicacion}
              onChange={(e) => handleChange('ubicacion', e.target.value)}
              placeholder="Ej: Pantalla de login, Configuración > Planes, Dashboard..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contanos qué pasa *
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Describí el problema, qué estabas haciendo, qué esperabas que pase..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-y"
            />
          </div>

          {/* Zona de archivos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjuntar archivos
            </label>

            {/* Dropzone */}
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                ${isDragging
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
              <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-violet-500' : 'text-gray-400'}`} />
              <p className="text-sm text-gray-600">
                Arrastrá archivos aquí o hacé click para seleccionar
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Imágenes, PDFs o archivos de texto (máx 10MB)
              </p>
            </div>

            {/* Lista de archivos */}
            {archivos.length > 0 && (
              <div className="mt-3 space-y-2">
                {archivos.map(archivo => {
                  const FileIcon = getFileIcon(archivo.type)
                  return (
                    <div
                      key={archivo.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg group"
                    >
                      {/* Preview o icono */}
                      {archivo.preview ? (
                        <img
                          src={archivo.preview}
                          alt={archivo.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                          <FileIcon className="w-5 h-5 text-gray-500" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{archivo.name}</p>
                        <p className="text-xs text-gray-400">
                          {(archivo.size / 1024).toFixed(0)} KB
                        </p>
                      </div>

                      {/* Eliminar */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(archivo.id)
                        }}
                        className="p-1.5 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Enviar reporte
          </button>
        </div>
      </div>
    </div>
  )
}

export default FormReporte
