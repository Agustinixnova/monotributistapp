/**
 * Tarjeta individual para mostrar el estado de un servicio
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { COLORES, TEXTOS_ESTADO } from '../utils/umbrales'

export default function TarjetaServicio({ servicio }) {
  const [expandido, setExpandido] = useState(false)

  const { nombre, estado, latencia, mensaje, detalles } = servicio
  const colores = COLORES[estado]

  return (
    <div
      className={`rounded-lg border ${colores.border} ${colores.bg} overflow-hidden transition-all`}
    >
      {/* Header de la tarjeta */}
      <div
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-center gap-3">
          {/* Indicador de estado (semáforo) */}
          <div className={`w-3 h-3 rounded-full ${colores.dot} animate-pulse`} />

          <div>
            <h4 className="font-medium text-white">{nombre}</h4>
            <p className={`text-sm ${colores.text}`}>{mensaje}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Latencia */}
          {latencia !== null && (
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <Clock className="w-3 h-3" />
              <span>{latencia}ms</span>
            </div>
          )}

          {/* Estado */}
          <span className={`text-xs font-medium px-2 py-1 rounded ${colores.bg} ${colores.text}`}>
            {TEXTOS_ESTADO[estado]}
          </span>

          {/* Chevron */}
          {detalles && (
            expandido
              ? <ChevronUp className="w-4 h-4 text-gray-400" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Detalles expandibles */}
      {expandido && detalles && (
        <div className="px-4 pb-4 pt-0">
          <div className="bg-gray-800/50 rounded p-3 font-mono text-xs text-gray-300">
            <pre className="whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(detalles, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
