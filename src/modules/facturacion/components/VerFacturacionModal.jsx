import { useState } from 'react'
import { X, FileText, Download, ExternalLink, Calendar, DollarSign, User, Clock } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { formatearMoneda } from '../utils/formatters'
import { getNombreMes } from '../utils/calculosFacturacion'

/**
 * Modal para ver detalles de facturación mensual (solo lectura)
 */
export function VerFacturacionModal({ facturacion, onClose }) {
  const [downloading, setDownloading] = useState(null)

  if (!facturacion) return null

  const handleDownload = async (archivo) => {
    setDownloading(archivo.nombre)
    try {
      const { data, error } = await supabase.storage
        .from('facturas')
        .download(archivo.path)

      if (error) throw error

      // Crear URL y descargar
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = archivo.nombre
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error descargando archivo:', err)
      alert('Error al descargar el archivo')
    } finally {
      setDownloading(null)
    }
  }

  const handleViewFile = async (archivo) => {
    try {
      const { data, error } = await supabase.storage
        .from('facturas')
        .createSignedUrl(archivo.path, 60) // URL válida por 60 segundos

      if (error) throw error

      window.open(data.signedUrl, '_blank')
    } catch (err) {
      console.error('Error obteniendo URL:', err)
      alert('Error al abrir el archivo')
    }
  }

  const archivos = facturacion.archivos_adjuntos || []

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {getNombreMes(facturacion.mes)} {facturacion.anio}
            </h2>
            <p className="text-sm text-gray-500">Detalle de facturación</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Monto */}
          <div className={`rounded-xl p-4 ${facturacion.monto < 0 ? 'bg-red-50' : 'bg-violet-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${facturacion.monto < 0 ? 'bg-red-100' : 'bg-violet-100'}`}>
                <DollarSign className={`w-6 h-6 ${facturacion.monto < 0 ? 'text-red-600' : 'text-violet-600'}`} />
              </div>
              <div>
                <div className={`text-sm ${facturacion.monto < 0 ? 'text-red-600' : 'text-violet-600'}`}>
                  {facturacion.monto < 0 ? 'Nota de crédito' : 'Monto facturado'}
                </div>
                <div className={`text-2xl font-bold ${facturacion.monto < 0 ? 'text-red-700' : 'text-violet-700'}`}>
                  {formatearMoneda(facturacion.monto)}
                </div>
              </div>
            </div>
          </div>

          {/* Info adicional */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Período:</span>
              <span className="font-medium">{getNombreMes(facturacion.mes)} {facturacion.anio}</span>
            </div>
            {facturacion.created_at && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Cargado:</span>
                <span className="font-medium">
                  {new Date(facturacion.created_at).toLocaleDateString('es-AR')}
                </span>
              </div>
            )}
          </div>

          {/* Fecha de comprobantes */}
          {facturacion.fecha_carga && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Fecha de comprobantes:</span>
              <span className="font-medium">
                {new Date(facturacion.fecha_carga).toLocaleDateString('es-AR')}
              </span>
            </div>
          )}

          {/* Cantidad de comprobantes */}
          {facturacion.cantidad_comprobantes > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Comprobantes:</span>
              <span className="font-medium">{facturacion.cantidad_comprobantes}</span>
            </div>
          )}

          {/* Nota/Descripción */}
          {facturacion.nota && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Nota</h3>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                {facturacion.nota}
              </div>
            </div>
          )}

          {/* Archivos adjuntos */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Archivos adjuntos ({archivos.length})
            </h3>

            {archivos.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">
                No hay archivos adjuntos
              </div>
            ) : (
              <div className="space-y-2">
                {archivos.map((archivo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {archivo.nombre}
                        </p>
                        {archivo.size && (
                          <p className="text-xs text-gray-500">
                            {(archivo.size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewFile(archivo)}
                        className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        title="Ver archivo"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(archivo)}
                        disabled={downloading === archivo.nombre}
                        className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Descargar"
                      >
                        {downloading === archivo.nombre ? (
                          <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estado de revisión */}
          {facturacion.estado_revision && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Estado:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                facturacion.estado_revision === 'aprobado'
                  ? 'bg-green-100 text-green-700'
                  : facturacion.estado_revision === 'pendiente'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
              }`}>
                {facturacion.estado_revision === 'aprobado' ? 'Aprobado' :
                 facturacion.estado_revision === 'pendiente' ? 'Pendiente de revisión' :
                 facturacion.estado_revision}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerFacturacionModal
