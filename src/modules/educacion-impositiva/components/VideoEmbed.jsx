import { useState } from 'react'
import { X, Youtube, Play } from 'lucide-react'

/**
 * Componente para embeber videos de YouTube
 */
export function VideoEmbed({ onEmbed, onClose }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)

  const extractVideoId = (url) => {
    // Soportar varios formatos de URL de YouTube
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
      /youtube\.com\/shorts\/([^&\s?]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const handleUrlChange = (e) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    setError(null)

    const videoId = extractVideoId(newUrl)
    if (videoId) {
      setPreview(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`)
    } else {
      setPreview(null)
    }
  }

  const handleSubmit = () => {
    if (!url) {
      setError('Ingresa una URL de YouTube')
      return
    }

    const videoId = extractVideoId(url)
    if (!videoId) {
      setError('URL de YouTube no valida')
      return
    }

    // Pasar URL en formato que TipTap acepta
    onEmbed?.(`https://www.youtube.com/watch?v=${videoId}`)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Youtube className="w-5 h-5 text-red-600" />
          <span className="font-medium">Insertar video de YouTube</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <input
          type="url"
          value={url}
          onChange={handleUrlChange}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />

        {preview && (
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!preview}
            className="px-4 py-1.5 bg-violet-600 text-white rounded text-sm hover:bg-violet-700 disabled:opacity-50"
          >
            Insertar video
          </button>
        </div>
      </div>
    </div>
  )
}
