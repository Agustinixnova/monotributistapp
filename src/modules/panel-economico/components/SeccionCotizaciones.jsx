/**
 * Seccion con grid de cotizaciones
 */

import { useState } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { useCotizaciones } from '../hooks/useCotizaciones'
import CardCotizacion, { CardCotizacionSkeleton } from './CardCotizacion'
import ModalHistorico from './ModalHistorico'
import { getOrdenCotizaciones } from '../utils/coloresCotizaciones'
import { formatearTiempoRelativo } from '../utils/formatters'

export default function SeccionCotizaciones() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState(null)

  const {
    cotizaciones,
    variaciones,
    loading,
    error,
    lastUpdate,
    refresh,
    canRefresh,
    cooldownRestante
  } = useCotizaciones()

  const ordenCotizaciones = getOrdenCotizaciones()

  // Segundos restantes para cooldown
  const segundosRestantes = Math.ceil(cooldownRestante / 1000)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-heading font-semibold text-gray-900">Cotizaciones</h3>
          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-0.5">
              Actualizado {formatearTiempoRelativo(lastUpdate)}
            </p>
          )}
        </div>

        <button
          onClick={refresh}
          disabled={!canRefresh || loading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            canRefresh && !loading
              ? 'bg-violet-50 text-violet-600 hover:bg-violet-100'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title={!canRefresh ? `Espera ${segundosRestantes}s` : 'Actualizar'}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {!canRefresh && segundosRestantes > 0 ? `${segundosRestantes}s` : 'Actualizar'}
        </button>
      </div>

      {/* Error */}
      {error && !cotizaciones && (
        <div className="p-4 bg-red-50 border-b border-red-100">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Error cargando cotizaciones</span>
          </div>
        </div>
      )}

      {/* Grid de cotizaciones */}
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {loading && !cotizaciones ? (
            // Skeletons de carga
            ordenCotizaciones.map(tipo => (
              <CardCotizacionSkeleton key={tipo} />
            ))
          ) : (
            // Cards de cotizaciones
            // Euro y Real no tienen datos historicos disponibles
            ordenCotizaciones.map(tipo => {
              const tieneHistorico = !['euro', 'real'].includes(tipo)
              return (
                <CardCotizacion
                  key={tipo}
                  tipo={tipo}
                  cotizacion={cotizaciones?.[tipo]}
                  variacion={variaciones?.[tipo]}
                  onClick={tieneHistorico ? () => {
                    setSelectedTipo(tipo)
                    setModalOpen(true)
                  } : undefined}
                />
              )
            })
          )}
        </div>
      </div>

      {/* Modal de historico */}
      <ModalHistorico
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tipo={selectedTipo}
        categoria="cotizacion"
      />
    </div>
  )
}
