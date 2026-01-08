import { useState, useRef } from 'react'
import { Upload, X, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { subirImagen } from '../services/educacionStorageService'

/**
 * Componente para subir imagenes al editor
 */
export function ImageUploader({ articuloId, onUpload, onClose }) {
  const { user } = useAuth()
  const [modo, setModo] = useState('subir') // 'subir' | 'url'
  const [url, setUrl] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imagenes')
      return
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen no puede superar 10MB')
      return
    }

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)

    // Subir
    try {
      setSubiendo(true)
      setError(null)

      // Si no hay articuloId, usar uno temporal
      const targetId = articuloId || 'temp-' + Date.now()
      const result = await subirImagen(file, targetId)

      onUpload?.(result.url)
    } catch (err) {
      console.error('Error subiendo imagen:', err)
      setError(err.message || 'Error al subir la imagen')
    } finally {
      setSubiendo(false)
    }
  }

  const handleUrlSubmit = () => {
    if (!url) {
      setError('Ingresa una URL')
      return
    }

    // Validar que parece una URL de imagen
    try {
      new URL(url)
      onUpload?.(url)
    } catch {
      setError('URL invalida')
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setModo('subir')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
            modo === 'subir'
              ? 'bg-violet-100 text-violet-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Upload className="w-4 h-4" />
          Subir
        </button>
        <button
          type="button"
          onClick={() => setModo('url')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
            modo === 'url'
              ? 'bg-violet-100 text-violet-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          URL
        </button>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {modo === 'subir' ? (
        <div>
          {preview ? (
            <div className="relative mb-3">
              <img
                src={preview}
                alt="Preview"
                className="max-h-40 mx-auto rounded"
              />
              {subiendo && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-violet-400 transition-colors"
            >
              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">
                Haz clic o arrastra una imagen
              </p>
              <p className="text-gray-400 text-xs mt-1">
                JPG, PNG, GIF, WebP (max 10MB)
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="px-4 py-2 bg-violet-600 text-white rounded text-sm hover:bg-violet-700"
          >
            Insertar
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}
    </div>
  )
}
