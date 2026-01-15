import { useState, useEffect } from 'react'
import { Clock, User, FileEdit } from 'lucide-react'
import { obtenerHistorialCambios } from '../../services/historialCambiosService'

/**
 * Componente para mostrar el historial de cambios de un cliente
 * Lee de la tabla historial_cambios_cliente
 */
export function HistorialCambiosCliente({ userId, clientFiscalDataId }) {
  const [cambios, setCambios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchHistorial() {
      try {
        setLoading(true)

        // Usar el servicio que ya maneja el join correctamente
        const data = await obtenerHistorialCambios(clientFiscalDataId, { limit: 50 })

        setCambios(data)
      } catch (err) {
        console.error('Error cargando historial:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (clientFiscalDataId) {
      fetchHistorial()
    }
  }, [userId, clientFiscalDataId])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
        <p className="text-gray-500 text-sm mt-2">Cargando historial...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p className="text-sm">Error al cargar historial: {error}</p>
      </div>
    )
  }

  if (cambios.length === 0) {
    return (
      <div className="text-center py-8">
        <FileEdit className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No hay cambios registrados</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {cambios.map((cambio, index) => (
        <div
          key={cambio.id || index}
          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <FileEdit className="w-4 h-4 text-indigo-600" />
            </div>

            <div className="flex-1 min-w-0">
              {/* Campo modificado */}
              <div className="font-medium text-gray-900 text-sm mb-1">
                {cambio.campo}
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                <div>
                  <span className="text-gray-500">Anterior:</span>
                  <div className="text-gray-700 mt-0.5">
                    {cambio.valor_anterior || <span className="text-gray-400 italic">vacío</span>}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Nuevo:</span>
                  <div className="text-gray-900 font-medium mt-0.5">
                    {cambio.valor_nuevo || <span className="text-gray-400 italic">vacío</span>}
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>
                    {cambio.realizado_por_nombre && cambio.realizado_por_apellido
                      ? `${cambio.realizado_por_nombre} ${cambio.realizado_por_apellido}`
                      : 'Sistema'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(cambio.created_at).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {cambio.tipo_cambio && cambio.tipo_cambio !== 'otros' && (
                  <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs">
                    {cambio.tipo_cambio}
                  </span>
                )}
              </div>

              {/* Motivo si existe */}
              {cambio.metadata?.motivo && (
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                  <span className="font-medium">Motivo:</span> {cambio.metadata.motivo}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
