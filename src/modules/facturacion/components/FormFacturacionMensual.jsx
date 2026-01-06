import { useState } from 'react'
import { X, Upload, FileText, Trash2, AlertCircle } from 'lucide-react'
import { uploadMultipleFacturas } from '../services/storageFacturasService'
import { getNombreMes } from '../utils/calculosFacturacion'

export function FormFacturacionMensual({
  anio,
  mes,
  onClose,
  onSave,
  clientId,
  userId,
  existente = null // Para edición
}) {
  const [monto, setMonto] = useState(existente?.monto || '')
  const [esNotaCredito, setEsNotaCredito] = useState((existente?.monto || 0) < 0)
  const [fechaCarga, setFechaCarga] = useState(
    existente?.fecha_carga || new Date().toISOString().split('T')[0]
  )
  const [nota, setNota] = useState(existente?.nota || '')
  const [cantidadComprobantes, setCantidadComprobantes] = useState(existente?.cantidad_comprobantes || '')
  const [archivos, setArchivos] = useState([])
  const [archivosExistentes, setArchivosExistentes] = useState(existente?.archivos_adjuntos || [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    agregarArchivos(files)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    agregarArchivos(files)
  }

  const agregarArchivos = (files) => {
    // Filtrar solo PDF e imágenes, máximo 10MB
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
      const maxSize = 10 * 1024 * 1024 // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize
    })

    // Máximo 50 archivos
    const espacioDisponible = 50 - archivos.length - archivosExistentes.length
    const nuevosArchivos = validFiles.slice(0, espacioDisponible)

    setArchivos(prev => [...prev, ...nuevosArchivos])
  }

  const eliminarArchivo = (index) => {
    setArchivos(prev => prev.filter((_, i) => i !== index))
  }

  const eliminarArchivoExistente = (index) => {
    setArchivosExistentes(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const montoNumerico = parseFloat(monto)
    if (isNaN(montoNumerico) || montoNumerico === 0) {
      setError('Ingresa un monto valido')
      return
    }

    try {
      setSaving(true)

      // Subir archivos nuevos
      let archivosSubidos = [...archivosExistentes]
      if (archivos.length > 0) {
        setUploading(true)
        const resultados = await uploadMultipleFacturas(archivos, userId, anio, mes)
        const exitosos = resultados.filter(r => !r.error)
        archivosSubidos = [...archivosSubidos, ...exitosos]
        setUploading(false)
      }

      // El monto es negativo si es nota de crédito
      const montoFinal = esNotaCredito ? -Math.abs(montoNumerico) : Math.abs(montoNumerico)

      await onSave({
        anio,
        mes,
        monto: montoFinal,
        fechaCarga,
        nota: nota || null,
        cantidadComprobantes: cantidadComprobantes ? parseInt(cantidadComprobantes) : 0,
        archivosAdjuntos: archivosSubidos
      })

    } catch (err) {
      console.error('Error guardando:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {existente ? 'Editar carga' : 'Nueva carga'} - {getNombreMes(mes)} {anio}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Tipo: Factura o Nota de Crédito */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de comprobante
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEsNotaCredito(false)}
                className={`p-3 rounded-lg border-2 text-left ${
                  !esNotaCredito
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Facturación</div>
                <div className="text-xs text-gray-500">Suma al total</div>
              </button>
              <button
                type="button"
                onClick={() => setEsNotaCredito(true)}
                className={`p-3 rounded-lg border-2 text-left ${
                  esNotaCredito
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Nota de crédito</div>
                <div className="text-xs text-gray-500">Resta del total</div>
              </button>
            </div>
          </div>

          {/* Fecha de los comprobantes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de los comprobantes
            </label>
            <input
              type="date"
              value={fechaCarga}
              onChange={(e) => setFechaCarga(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto {esNotaCredito && <span className="text-red-500">(se restará)</span>} *
            </label>
            <div className="relative">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${esNotaCredito ? 'text-red-500' : 'text-gray-500'}`}>
                {esNotaCredito ? '-$' : '$'}
              </span>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 ${
                  esNotaCredito
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-violet-500'
                }`}
                required
              />
            </div>
          </div>

          {/* Cantidad de comprobantes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad de comprobantes (opcional)
            </label>
            <input
              type="number"
              value={cantidadComprobantes}
              onChange={(e) => setCantidadComprobantes(e.target.value)}
              placeholder="Ej: 5"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Nota / Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nota o descripción (opcional)
            </label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: Facturación primera quincena, NC por devolución..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          {/* Upload de archivos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjuntar comprobantes (opcional)
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-violet-400 transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Arrastra archivos o{' '}
                <label className="text-violet-600 cursor-pointer hover:underline">
                  seleccionalos
                  <input
                    type="file"
                    multiple
                    accept=".pdf,image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, JPG, PNG (max 10MB c/u)
              </p>
            </div>

            {/* Archivos existentes */}
            {archivosExistentes.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-500">Archivos guardados:</p>
                {archivosExistentes.map((archivo, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 truncate max-w-[200px]">
                        {archivo.nombre || archivo.fileName || 'Archivo'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarArchivoExistente(index)}
                      className="p-1 hover:bg-red-100 rounded text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Archivos nuevos */}
            {archivos.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-500">Archivos a subir:</p>
                {archivos.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-violet-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-violet-500" />
                      <span className="text-sm text-gray-600 truncate max-w-[200px]">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarArchivo(index)}
                      className="p-1 hover:bg-red-100 rounded text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                esNotaCredito
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-violet-600 hover:bg-violet-700'
              }`}
            >
              {uploading ? 'Subiendo archivos...' : saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
