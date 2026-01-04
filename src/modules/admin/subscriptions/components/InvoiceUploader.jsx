import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import { adminSubscriptionService } from '../services/adminSubscriptionService'

/**
 * Componente para subir PDFs de facturas
 * Soporta drag & drop y selección de archivo
 *
 * @param {string} invoiceId - ID de la factura
 * @param {Function} onSuccess - Callback después de subir exitosamente
 * @param {string} currentFileName - Nombre del archivo actual si ya tiene
 */
export function InvoiceUploader({ invoiceId, onSuccess, currentFileName }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0])
    }
  }

  const handleUpload = async (file) => {
    // Validaciones
    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar 10MB')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      await adminSubscriptionService.uploadInvoiceFile(invoiceId, file)
      setSuccess(true)

      // Llamar callback después de 1 segundo
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        }
      }, 1000)
    } catch (err) {
      console.error('Error uploading invoice:', err)
      setError(err.message || 'Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  // Estado de éxito
  if (success) {
    return (
      <div className="p-6 border-2 border-green-300 border-dashed rounded-xl bg-green-50 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-green-700 font-medium">Factura subida correctamente</p>
      </div>
    )
  }

  // Estado de carga
  if (uploading) {
    return (
      <div className="p-6 border-2 border-blue-300 border-dashed rounded-xl bg-blue-50 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-blue-700 font-medium">Subiendo...</p>
      </div>
    )
  }

  // Si ya tiene archivo
  if (currentFileName) {
    return (
      <div className="p-4 border-2 border-gray-200 rounded-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{currentFileName}</p>
              <p className="text-xs text-gray-500">Archivo actual</p>
            </div>
          </div>
          <button
            onClick={handleClick}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Reemplazar
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }

  // Zona de drop
  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
        dragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Upload className={`w-10 h-10 mx-auto mb-3 ${
        dragActive ? 'text-blue-500' : 'text-gray-400'
      }`} />

      <p className={`font-medium mb-1 ${
        dragActive ? 'text-blue-700' : 'text-gray-700'
      }`}>
        {dragActive
          ? 'Soltá el archivo aquí'
          : 'Arrastrá el PDF o hacé clic para seleccionar'}
      </p>

      <p className="text-sm text-gray-500">
        Máximo 10MB
      </p>

      {error && (
        <div className="mt-4 flex items-center justify-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export default InvoiceUploader
