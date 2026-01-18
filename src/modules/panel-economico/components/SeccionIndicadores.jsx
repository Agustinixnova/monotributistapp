/**
 * Seccion de indicadores economicos
 * Inflacion, UVA, Riesgo Pais, Tasas
 */

import { useState } from 'react'
import { TrendingUp, TrendingDown, Percent, Building, AlertTriangle, Landmark, HelpCircle } from 'lucide-react'
import { useInflacion } from '../hooks/useInflacion'
import { useIndicadores } from '../hooks/useIndicadores'
import { formatearMoneda, formatearPorcentaje, formatearRiesgoPais } from '../utils/formatters'
import { getNombreMes } from '../utils/calculosIPC'
import ModalHistorico from './ModalHistorico'
import TooltipModal from './TooltipModal'
import { EXPLICACIONES } from '../utils/tooltipsExplicaciones'

/**
 * Card individual de indicador
 */
function CardIndicador({ titulo, valor, subtitulo, icono: Icono, color = 'violet', tendencia, onClick, tipo }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const explicacion = tipo ? EXPLICACIONES[tipo] : null

  const colores = {
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  }

  const c = colores[color] || colores.violet
  const isClickable = !!onClick

  return (
    <>
      <div
        className={`rounded-xl border ${c.border} bg-white p-4 ${isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        onClick={onClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      >
        <div className="flex items-start justify-between mb-2">
          <div className={`w-10 h-10 rounded-full ${c.bg} flex items-center justify-center`}>
            <Icono className={`w-5 h-5 ${c.text}`} />
          </div>
          <div className="flex items-center gap-1">
            {/* Botón de info */}
            {explicacion && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowTooltip(true)
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Más información"
              >
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
            {/* Tendencia */}
            {tendencia && (
              <div className={`flex items-center gap-1 text-xs ${
                tendencia === 'sube' ? 'text-red-500' :
                tendencia === 'baja' ? 'text-emerald-500' : 'text-gray-400'
              }`}>
                {tendencia === 'sube' ? <TrendingUp className="w-3 h-3" /> :
                 tendencia === 'baja' ? <TrendingDown className="w-3 h-3" /> : null}
              </div>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-500 mb-1">{titulo}</div>
        <div className={`text-2xl font-bold ${c.text}`}>{valor}</div>
        {subtitulo && (
          <div className="text-xs text-gray-500 mt-1">{subtitulo}</div>
        )}
      </div>

      {/* Tooltip Modal */}
      {explicacion && (
        <TooltipModal
          isOpen={showTooltip}
          onClose={() => setShowTooltip(false)}
          titulo={explicacion.titulo}
          texto={explicacion.texto}
        />
      )}
    </>
  )
}

/**
 * Skeleton de indicador
 */
function CardIndicadorSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-200 mb-2" />
      <div className="w-20 h-3 bg-gray-200 rounded mb-2" />
      <div className="w-24 h-6 bg-gray-200 rounded" />
    </div>
  )
}

export default function SeccionIndicadores() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedIndicador, setSelectedIndicador] = useState(null)

  const { ultimaInflacion, inflacionMesAnterior, ultimaInteranual, loading: loadingInflacion } = useInflacion()
  const { uva, riesgoPais, tasaBancoNacion, loading: loadingIndicadores } = useIndicadores()

  const handleOpenModal = (indicador) => {
    setSelectedIndicador(indicador)
    setModalOpen(true)
  }

  const loading = loadingInflacion || loadingIndicadores

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-heading font-semibold text-gray-900">Indicadores</h3>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => <CardIndicadorSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  // Determinar tendencia de inflacion
  const tendenciaInflacion = ultimaInflacion && inflacionMesAnterior
    ? (ultimaInflacion.valor > inflacionMesAnterior.valor ? 'sube' : 'baja')
    : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-heading font-semibold text-gray-900">Indicadores</h3>
      </div>

      {/* Grid de indicadores */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Inflacion mensual */}
        <CardIndicador
          titulo={`Inflacion ${ultimaInflacion ? getNombreMes(ultimaInflacion.fecha).split(' ')[0] : ''}`}
          valor={ultimaInflacion ? formatearPorcentaje(ultimaInflacion.valor, 1, false) : '-'}
          subtitulo={inflacionMesAnterior ? `vs ${inflacionMesAnterior.valor.toFixed(1)}% mes ant.` : null}
          icono={Percent}
          color="amber"
          tendencia={tendenciaInflacion}
          onClick={() => handleOpenModal('inflacion')}
          tipo="inflacion"
        />

        {/* Inflacion interanual */}
        <CardIndicador
          titulo="Inflacion Anual"
          valor={ultimaInteranual ? formatearPorcentaje(ultimaInteranual.valor, 1, false) : '-'}
          subtitulo={ultimaInteranual ? getNombreMes(ultimaInteranual.fecha) : null}
          icono={TrendingUp}
          color="red"
          onClick={() => handleOpenModal('inflacion')}
          tipo="inflacionInteranual"
        />

        {/* UVA */}
        <CardIndicador
          titulo="Indice UVA"
          valor={uva?.valor ? formatearMoneda(uva.valor, 2) : '-'}
          subtitulo={uva?.fecha ? `Al ${new Date(uva.fecha).toLocaleDateString('es-AR')}` : null}
          icono={Building}
          color="blue"
          onClick={() => handleOpenModal('uva')}
          tipo="uva"
        />

        {/* Riesgo Pais */}
        <CardIndicador
          titulo="Riesgo Pais"
          valor={riesgoPais?.valor ? formatearRiesgoPais(riesgoPais.valor) : '-'}
          subtitulo={riesgoPais?.fecha ? new Date(riesgoPais.fecha).toLocaleDateString('es-AR') : null}
          icono={AlertTriangle}
          color={riesgoPais?.valor > 1500 ? 'red' : riesgoPais?.valor > 1000 ? 'amber' : 'emerald'}
          onClick={() => handleOpenModal('riesgoPais')}
          tipo="riesgoPais"
        />

        {/* Tasa Plazo Fijo */}
        <CardIndicador
          titulo="Plazo Fijo (TNA)"
          valor={tasaBancoNacion?.tna ? formatearPorcentaje(tasaBancoNacion.tna, 1, false) : '-'}
          subtitulo={tasaBancoNacion?.entidad || 'Banco Nacion'}
          icono={Landmark}
          color="emerald"
          onClick={() => handleOpenModal('tasas')}
          tipo="tasas"
        />
      </div>

      {/* Modal de historico */}
      <ModalHistorico
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tipo={selectedIndicador}
        categoria="indicador"
      />
    </div>
  )
}
