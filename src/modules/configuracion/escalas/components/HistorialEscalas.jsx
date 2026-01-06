import { useState } from 'react'
import { Calendar, ChevronRight, X, Eye } from 'lucide-react'
import { formatFecha, formatMoneda, getCategoriaColor } from '../utils/escalasUtils'

/**
 * Lista de escalas anteriores (historico)
 */
export function HistorialEscalas({ historial, loading, onVerDetalle }) {
  const [selectedPeriodo, setSelectedPeriodo] = useState(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [categoriasPeriodo, setCategoriasPeriodo] = useState([])

  const handleVerDetalle = async (periodo) => {
    setSelectedPeriodo(periodo)
    setLoadingDetalle(true)
    try {
      const categorias = await onVerDetalle(periodo.vigente_desde, periodo.vigente_hasta)
      setCategoriasPeriodo(categorias)
    } catch (err) {
      console.error('Error loading detalle:', err)
    } finally {
      setLoadingDetalle(false)
    }
  }

  const closeDetalle = () => {
    setSelectedPeriodo(null)
    setCategoriasPeriodo([])
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (historial.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Sin historial</h3>
        <p className="text-gray-500">
          Aun no hay escalas anteriores registradas en el sistema.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-3">
        {historial.map((periodo, index) => (
          <div
            key={index}
            onClick={() => handleVerDetalle(periodo)}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-violet-300 hover:bg-violet-50/30 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {formatFecha(periodo.vigente_desde)} - {formatFecha(periodo.vigente_hasta)}
                </p>
                <p className="text-sm text-gray-500">
                  {periodo.categorias?.length || 11} categorias
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        ))}
      </div>

      {/* Modal de detalle */}
      {selectedPeriodo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Escala historica</h2>
                <p className="text-sm text-gray-500">
                  Vigente: {formatFecha(selectedPeriodo.vigente_desde)} - {formatFecha(selectedPeriodo.vigente_hasta)}
                </p>
              </div>
              <button
                onClick={closeDetalle}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetalle ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Cat.</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Tope Facturacion</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Cuota Serv.</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Cuota Prod.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {categoriasPeriodo.map((cat) => (
                        <tr key={cat.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs ${getCategoriaColor(cat.categoria)}`}>
                              {cat.categoria}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900">
                            {formatMoneda(cat.tope_facturacion_anual)}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">
                            {formatMoneda(cat.cuota_total_servicios)}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">
                            {formatMoneda(cat.cuota_total_productos)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeDetalle}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HistorialEscalas
