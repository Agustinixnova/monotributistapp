import { useState, useRef } from 'react'
import { X, Camera, Upload, FileText, Check, Loader2, Image } from 'lucide-react'
import { subirComprobantePago, marcarCuotaPagada } from '../services/cuotaService'
import { formatearMoneda } from '../utils/formatters'

export function ModalSubirComprobante({
  clientId,
  userId,
  anio,
  mes,
  montoCuota,
  mesNombre,
  estaPagada,
  onClose,
  onSuccess
}) {
  const [archivo, setArchivo] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar tipo
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!tiposPermitidos.includes(file.type)) {
      setError('Solo se permiten imagenes JPG, PNG o archivos PDF')
      return
    }

    // Validar tamano (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar los 10MB')
      return
    }

    setArchivo(file)
    setError(null)

    // Preview para imagenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  const handleSubir = async () => {
    if (!archivo) {
      setError('Selecciona un archivo primero')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Si no esta pagada, primero marcar como pagada
      if (!estaPagada) {
        await marcarCuotaPagada(clientId, anio, mes, userId)
      }

      // Subir comprobante
      await subirComprobantePago(clientId, anio, mes, archivo)

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Error subiendo comprobante:', err)
      setError('Error al subir el comprobante. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const limpiarArchivo = () => {
    setArchivo(null)
    setPreview(null)
    setError(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col safe-area-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            Subir comprobante
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {success ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                Comprobante subido
              </h4>
              <p className="text-sm text-gray-500">
                Tu contadora lo verificara pronto
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info de la cuota */}
              <div className="bg-violet-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-violet-600">Cuota {mesNombre}</p>
                    <p className="text-lg font-bold text-violet-700">
                      {formatearMoneda(montoCuota)}
                    </p>
                  </div>
                  {estaPagada && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                      Pagada
                    </span>
                  )}
                </div>
              </div>

              {/* Preview del archivo o botones de seleccion */}
              {archivo ? (
                <div className="space-y-3">
                  {/* Preview */}
                  <div className="relative rounded-xl overflow-hidden bg-gray-100">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Comprobante"
                        className="w-full h-48 object-contain"
                      />
                    ) : (
                      <div className="w-full h-48 flex flex-col items-center justify-center">
                        <FileText className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 font-medium truncate max-w-[200px]">
                          {archivo.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {(archivo.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Boton cambiar */}
                  <button
                    onClick={limpiarArchivo}
                    className="w-full text-sm text-gray-500 hover:text-violet-600 py-2 transition-colors"
                  >
                    Cambiar archivo
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 text-center">
                    Adjunta una foto o PDF del comprobante de pago
                  </p>

                  {/* Botones de accion */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Tomar foto */}
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors min-h-touch active:scale-95"
                    >
                      <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                        <Camera className="w-6 h-6 text-violet-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Tomar foto</span>
                    </button>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    {/* Subir archivo */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors min-h-touch active:scale-95"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Upload className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Subir archivo</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Formatos aceptados */}
                  <p className="text-xs text-gray-400 text-center">
                    Formatos: JPG, PNG, PDF (max 10MB)
                  </p>
                </>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con boton de subir */}
        {!success && archivo && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleSubir}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl transition-colors font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Subir comprobante
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
