import { useState } from 'react'
import { Bell, RefreshCw, AlertCircle, Check, Filter, X } from 'lucide-react'
import { useSugerenciasPendientes } from '../hooks/useSugerencias'
import { TarjetaSugerencia } from './TarjetaSugerencia'

/**
 * Panel de sugerencias pendientes para la contadora
 * Puede usarse como componente independiente o dentro de un dashboard
 */
export function PanelSugerenciasPendientes({
  maxItems,
  showHeader = true,
  compact = false
}) {
  const {
    sugerencias,
    loading,
    error,
    procesando,
    aceptar,
    rechazar,
    refetch,
    cantidad
  } = useSugerenciasPendientes()

  const [filtroCliente, setFiltroCliente] = useState('')

  // Filtrar por nombre de cliente
  const sugerenciasFiltradas = filtroCliente
    ? sugerencias.filter(s =>
        s.cliente?.user?.full_name?.toLowerCase().includes(filtroCliente.toLowerCase()) ||
        s.cliente?.razon_social?.toLowerCase().includes(filtroCliente.toLowerCase()) ||
        s.cliente?.cuit?.includes(filtroCliente)
      )
    : sugerencias

  // Limitar si se especifica maxItems
  const sugerenciasMostrar = maxItems
    ? sugerenciasFiltradas.slice(0, maxItems)
    : sugerenciasFiltradas

  const handleAceptar = async (sugerenciaId, valorModificado) => {
    await aceptar(sugerenciaId, valorModificado)
  }

  const handleRechazar = async (sugerenciaId, nota) => {
    await rechazar(sugerenciaId, nota)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="text-red-800 font-medium">Error cargando sugerencias</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={refetch}
            className="mt-2 text-red-700 hover:text-red-800 text-sm flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={compact ? '' : 'bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden'}>
      {/* Header */}
      {showHeader && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-violet-600" />
            <h3 className="font-medium text-gray-900">Sugerencias pendientes</h3>
            {cantidad > 0 && (
              <span className="px-2 py-0.5 bg-violet-600 text-white text-xs rounded-full">
                {cantidad}
              </span>
            )}
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {/* Filtro */}
      {sugerencias.length > 3 && (
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="relative">
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              placeholder="Filtrar por cliente..."
              className="w-full pl-9 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
            {filtroCliente && (
              <button
                onClick={() => setFiltroCliente('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lista de sugerencias */}
      <div className={compact ? 'space-y-3' : 'p-4 space-y-4'}>
        {sugerenciasMostrar.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-gray-900 font-medium mb-1">Todo al dia</h3>
            <p className="text-gray-500 text-sm">
              {filtroCliente
                ? 'No hay sugerencias para este cliente'
                : 'No hay sugerencias pendientes de revision'
              }
            </p>
          </div>
        ) : (
          <>
            {sugerenciasMostrar.map(sugerencia => (
              <TarjetaSugerencia
                key={sugerencia.id}
                sugerencia={sugerencia}
                onAceptar={handleAceptar}
                onRechazar={handleRechazar}
                procesando={procesando}
              />
            ))}

            {/* Ver mas */}
            {maxItems && sugerenciasFiltradas.length > maxItems && (
              <div className="text-center pt-2">
                <span className="text-sm text-gray-500">
                  Mostrando {maxItems} de {sugerenciasFiltradas.length} sugerencias
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
