/**
 * Modal para recortar logo de facturación
 *
 * Permite al usuario ajustar el área de recorte:
 * - Zoom (agrandar/achicar)
 * - Posición (mover el logo)
 * - Vista previa del resultado
 *
 * Dimensiones recomendadas: 400x200 px (ratio 2:1)
 */

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from 'lucide-react'

// Dimensiones del logo para facturas (ratio 2:1)
const LOGO_WIDTH = 400
const LOGO_HEIGHT = 200
const ASPECT_RATIO = LOGO_WIDTH / LOGO_HEIGHT

export default function ModalRecortarLogo({ imagenOriginal, onGuardar, onCerrar }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleGuardar = async () => {
    if (!croppedAreaPixels) return

    try {
      setGuardando(true)
      const imagenRecortada = await recortarImagen(imagenOriginal, croppedAreaPixels)
      onGuardar(imagenRecortada)
    } catch (error) {
      console.error('Error recortando imagen:', error)
    } finally {
      setGuardando(false)
    }
  }

  const resetZoom = () => {
    setZoom(1)
    setCrop({ x: 0, y: 0 })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-heading font-semibold text-gray-900">Ajustar Logo</h3>
            <p className="text-sm text-gray-500">
              Dimensiones recomendadas: {LOGO_WIDTH}x{LOGO_HEIGHT} px
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Área de recorte */}
        <div className="relative h-80 bg-gray-900">
          <Cropper
            image={imagenOriginal}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT_RATIO}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="rect"
            showGrid={true}
            style={{
              containerStyle: {
                backgroundColor: '#1f2937'
              }
            }}
          />
        </div>

        {/* Controles de zoom */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 w-16">Zoom:</span>
            <button
              onClick={() => setZoom(z => Math.max(1, z - 0.1))}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
              title="Alejar"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <button
              onClick={() => setZoom(z => Math.min(3, z + 0.1))}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
              title="Acercar"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={resetZoom}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
              title="Resetear"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Info */}
          <p className="text-xs text-gray-500 mt-3 text-center">
            Arrastrá la imagen para moverla. Usá el control de zoom para ajustar el tamaño.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t">
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            {guardando ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Aplicar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Recorta la imagen según el área seleccionada
 * y la redimensiona a las dimensiones del logo
 */
async function recortarImagen(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // Tamaño final del logo
  canvas.width = LOGO_WIDTH
  canvas.height = LOGO_HEIGHT

  // Dibujar la imagen recortada y redimensionada
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    LOGO_WIDTH,
    LOGO_HEIGHT
  )

  // Convertir a blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          // Crear archivo desde blob
          const file = new File([blob], 'logo.png', { type: 'image/png' })
          resolve(file)
        } else {
          reject(new Error('Error creando imagen'))
        }
      },
      'image/png',
      0.95
    )
  })
}

/**
 * Crea un elemento Image desde una URL
 */
function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })
}
