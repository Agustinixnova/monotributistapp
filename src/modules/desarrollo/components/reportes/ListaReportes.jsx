import { useState } from 'react'
import { Plus, RefreshCw, Bug } from 'lucide-react'
import { TarjetaReporte } from './TarjetaReporte'
import { FiltrosReporte } from './FiltrosReporte'
import { FormReporte } from './FormReporte'
import { puedeCrearReporte } from '../../utils/permisos'

/**
 * Lista de reportes con filtros
 */
export function ListaReportes({ reportes, loading, onRefresh, onCrear, onSelectReporte, miRol }) {
  const [filtros, setFiltros] = useState({ tipo: 'todos', estado: 'todos' })
  const [showFormNuevo, setShowFormNuevo] = useState(false)

  const handleCrear = async (datos) => {
    const result = await onCrear(datos)
    if (!result.error) {
      setShowFormNuevo(false)
    }
    return result
  }

  // Filtrar reportes
  const reportesFiltrados = reportes.filter(r => {
    if (filtros.tipo !== 'todos' && r.tipo !== filtros.tipo) return false
    if (filtros.estado !== 'todos' && r.estado !== filtros.estado) return false
    return true
  })

  // Agrupar por estado
  const pendientes = reportesFiltrados.filter(r => r.estado === 'pendiente')
  const abiertos = reportesFiltrados.filter(r => r.estado === 'abierto' || r.estado === 'en_curso')
  const paraProbar = reportesFiltrados.filter(r => r.estado === 'para_probar')
  const resueltos = reportesFiltrados.filter(r => r.estado === 'resuelto')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-500">
            {reportes.length} reporte{reportes.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <FiltrosReporte filtros={filtros} onChange={setFiltros} />

          {puedeCrearReporte(miRol) && (
            <button
              onClick={() => setShowFormNuevo(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Reportar
            </button>
          )}
        </div>
      </div>

      {/* Lista de reportes */}
      {reportesFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <Bug className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay reportes</p>
          {puedeCrearReporte(miRol) && (
            <button
              onClick={() => setShowFormNuevo(true)}
              className="mt-4 text-violet-600 hover:text-violet-700 font-medium"
            >
              Crear el primero
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pendientes (sin abrir) */}
          {pendientes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                Nuevos ({pendientes.length})
              </h3>
              <div className="space-y-2">
                {pendientes.map(r => (
                  <TarjetaReporte key={r.id} reporte={r} onClick={onSelectReporte} />
                ))}
              </div>
            </div>
          )}

          {/* Abiertos / En curso */}
          {abiertos.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                En progreso ({abiertos.length})
              </h3>
              <div className="space-y-2">
                {abiertos.map(r => (
                  <TarjetaReporte key={r.id} reporte={r} onClick={onSelectReporte} />
                ))}
              </div>
            </div>
          )}

          {/* Para probar */}
          {paraProbar.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Para probar ({paraProbar.length})
              </h3>
              <div className="space-y-2">
                {paraProbar.map(r => (
                  <TarjetaReporte key={r.id} reporte={r} onClick={onSelectReporte} />
                ))}
              </div>
            </div>
          )}

          {/* Resueltos */}
          {resueltos.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Resueltos ({resueltos.length})
              </h3>
              <div className="space-y-2">
                {resueltos.map(r => (
                  <TarjetaReporte key={r.id} reporte={r} onClick={onSelectReporte} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal nuevo reporte */}
      {showFormNuevo && (
        <FormReporte
          onSubmit={handleCrear}
          onCancel={() => setShowFormNuevo(false)}
        />
      )}
    </div>
  )
}

export default ListaReportes
