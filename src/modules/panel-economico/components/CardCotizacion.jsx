/**
 * Card individual de cotizacion
 */

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react'
import { getConfigCotizacion } from '../utils/coloresCotizaciones'
import { formatearNumero } from '../utils/formatters'
import { EXPLICACIONES } from '../utils/tooltipsExplicaciones'
import TooltipModal from './TooltipModal'

/**
 * Card de cotizacion de moneda
 * @param {string} tipo - Tipo de cotizacion (blue, oficial, etc)
 * @param {Object} cotizacion - Datos de la cotizacion
 * @param {Object} variacion - Variacion respecto al dia anterior
 * @param {Function} onClick - Callback al hacer click (abre modal historico)
 */
export default function CardCotizacion({ tipo, cotizacion, variacion, onClick }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const config = getConfigCotizacion(tipo)
  const IconoCotizacion = config.icon
  const explicacion = EXPLICACIONES[tipo]

  if (!cotizacion) {
    return (
      <div className={`rounded-xl border ${config.border} ${config.bgLight} p-4 opacity-60`}>
        <div className="flex items-center gap-2 mb-2">
          <IconoCotizacion className={`w-5 h-5 ${config.text}`} />
          <span className="font-medium text-gray-600">{config.nombre}</span>
        </div>
        <div className="text-gray-400 text-sm">No disponible</div>
      </div>
    )
  }

  const { compra, venta } = cotizacion

  // Icono de variacion
  const IconoVariacion = variacion?.direccion === 'sube' ? TrendingUp :
                         variacion?.direccion === 'baja' ? TrendingDown : Minus

  const colorVariacion = variacion?.direccion === 'sube' ? 'text-red-500' :
                         variacion?.direccion === 'baja' ? 'text-emerald-500' : 'text-gray-400'

  const isClickable = !!onClick

  return (
    <div
      className={`rounded-xl border ${config.border} bg-white transition-shadow p-3 sm:p-4 ${isClickable ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      {/* Header con icono y nombre */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${config.bgLight} flex items-center justify-center`}>
            <IconoCotizacion className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${config.text}`} />
          </div>
          <span className={`font-semibold text-sm sm:text-base ${config.text}`}>{config.nombreCorto}</span>

          {/* Botón de info - Solo si hay explicación */}
          {explicacion && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowTooltip(true)
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors -ml-0.5"
              aria-label="Más información"
            >
              <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Variacion */}
        {variacion && variacion.porcentaje !== 0 && (
          <div className={`flex items-center gap-1 text-xs ${colorVariacion}`}>
            <IconoVariacion className="w-3 h-3" />
            <span>{variacion.porcentaje > 0 ? '+' : ''}{variacion.porcentaje.toFixed(1)}%</span>
          </div>
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

      {/* Valores */}
      <div className="space-y-0.5 sm:space-y-1">
        {compra && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Compra</span>
            <span className="font-semibold text-gray-700 text-sm sm:text-base">${formatearNumero(compra, 2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Venta</span>
          <span className="font-bold text-gray-900 text-base sm:text-lg">${formatearNumero(venta, 2)}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton de carga para CardCotizacion
 */
export function CardCotizacionSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        <div className="w-16 h-4 bg-gray-200 rounded" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="w-12 h-3 bg-gray-200 rounded" />
          <div className="w-20 h-4 bg-gray-200 rounded" />
        </div>
        <div className="flex justify-between">
          <div className="w-12 h-3 bg-gray-200 rounded" />
          <div className="w-24 h-5 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}
