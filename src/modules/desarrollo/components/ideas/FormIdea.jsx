import { useState, useRef, useCallback } from 'react'
import { X, Lightbulb, AlertCircle, Upload, Image, FileText, File, Trash2 } from 'lucide-react'
import { PRIORIDADES, getIcon } from '../../utils/config'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 5

/**
 * Formulario para crear nueva idea
 */
export function FormIdea({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    titulo: '',
    que_queremos_hacer: '',
    para_quien: '',
    por_que_importa: '',
    prioridad: 'normal'
  })
  const [archivos, setArchivos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  // Procesar archivos
  const processFiles = useCallback((files) => {
    const newFiles = []

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} es muy grande (máx 10MB)`)
        continue
      }

      if (archivos.length + newFiles.length >= MAX_FILES) {
        setError(`Máximo ${MAX_FILES} archivos`)
        break
      }

      const fileObj = {
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        type: file.type,
        size: file.size,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      }

      newFiles.push(fileObj)
    }

    if (newFiles.length > 0) {
      setArchivos(prev => [...prev, ...newFiles])
      setError(null)
    }
  }, [archivos.length])

  const handleFileInput = (e) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files))
    }
    e.target.value = ''
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
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files))
    }
  }

  const removeFile = (id) => {
    setArchivos(prev => {
      const removed = prev.find(f => f.id === id)
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return Image
    if (type === 'application/pdf') return FileText
    return File
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.titulo.trim() || !formData.que_queremos_hacer.trim()) {
      setError('Completá el título y la descripción')
      return
    }

    setLoading(true)
    setError(null)

    // Incluir archivos en el submit
    const dataToSubmit = {
      ...formData,
      archivos: archivos.map(a => a.file)
    }

    const result = await onSubmit(dataToSubmit)

    if (result.error) {
      setError(result.error.message || 'Error al crear la idea')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Nueva Idea</h2>
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
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              placeholder="Ej: Agregar calculadora de recategorización"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          {/* Qué queremos hacer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿Qué queremos hacer? *
            </label>
            <textarea
              value={formData.que_queremos_hacer}
              onChange={(e) => handleChange('que_queremos_hacer', e.target.value)}
              placeholder="Describí la funcionalidad o cambio que querés..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
            />
          </div>

          {/* Para quién */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿Para quién es?
            </label>
            <select
              value={formData.para_quien}
              onChange={(e) => handleChange('para_quien', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="">Seleccionar...</option>
              <option value="monotributista">Monotributista</option>
              <option value="contadora">Contadora</option>
              <option value="todos">Todos</option>
            </select>
          </div>

          {/* Por qué importa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿Por qué es importante?
            </label>
            <textarea
              value={formData.por_que_importa}
              onChange={(e) => handleChange('por_que_importa', e.target.value)}
              placeholder="Explicá el valor que aporta..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
            />
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prioridad
            </label>
            <div className="flex gap-2">
              {PRIORIDADES.map(p => {
                const IconComponent = getIcon(p.icon)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleChange('prioridad', p.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${
                      formData.prioridad === p.id
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-sm">{p.nombre}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Archivos adjuntos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivos adjuntos
            </label>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                Arrastrá archivos o hacé clic para seleccionar
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Máximo {MAX_FILES} archivos, 10MB cada uno
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />

            {/* Lista de archivos */}
            {archivos.length > 0 && (
              <div className="mt-3 space-y-2">
                {archivos.map(archivo => {
                  const FileIcon = getFileIcon(archivo.type)
                  return (
                    <div
                      key={archivo.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      {archivo.preview ? (
                        <img
                          src={archivo.preview}
                          alt={archivo.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <FileIcon className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{archivo.name}</p>
                        <p className="text-xs text-gray-400">
                          {(archivo.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(archivo.id)
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-gray-500" />
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
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Crear idea
          </button>
        </div>
      </div>
    </div>
  )
}

export default FormIdea
