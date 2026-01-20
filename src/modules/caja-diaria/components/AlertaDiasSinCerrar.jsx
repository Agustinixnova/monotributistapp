/**
 * Componente de alerta para días sin cerrar
 */

import { useState } from 'react'
import { AlertTriangle, X, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { formatearMonto } from '../utils/formatters'

export default function AlertaDiasSinCerrar({ diasSinCerrar, onIrAFecha }) {
  const [expandido, setExpandido] = useState(false)
  const [cerrado, setCerrado] = useState(false)

  if (diasSinCerrar.length === 0 || cerrado) return null

  // Formatear fecha para mostrar
  const formatearFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const primerDia = diasSinCerrar[0]

  return (
    <div className="mb-6 bg-amber-50 border border-amber-300 rounded-xl overflow-hidden">
      {/* Header de la alerta */}
      <div className="flex items-start gap-3 p-4">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-amber-800">
                {diasSinCerrar.length === 1
                  ? 'Hay 1 día sin cerrar'
                  : `Hay ${diasSinCerrar.length} días sin cerrar`}
              </h3>
              <p className="text-sm text-amber-700 mt-0.5">
                {diasSinCerrar.length === 1
                  ? `El ${formatearFecha(primerDia.fecha)} tiene movimientos sin cierre de caja.`
                  : `Desde el ${formatearFecha(diasSinCerrar[diasSinCerrar.length - 1].fecha)} hasta el ${formatearFecha(primerDia.fecha)}.`}
              </p>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={() => setCerrado(true)}
              className="p-1 hover:bg-amber-200 rounded-lg transition-colors flex-shrink-0"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4 text-amber-600" />
            </button>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => onIrAFecha(primerDia.fecha)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Ir al {formatearFecha(primerDia.fecha)}
            </button>

            {diasSinCerrar.length > 1 && (
              <button
                onClick={() => setExpandido(!expandido)}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-sm font-medium rounded-lg transition-colors"
              >
                Ver todos
                {expandido ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista expandida de días */}
      {expandido && diasSinCerrar.length > 1 && (
        <div className="border-t border-amber-200 bg-amber-100/50">
          <div className="max-h-48 overflow-y-auto">
            {diasSinCerrar.map((dia) => (
              <button
                key={dia.fecha}
                onClick={() => onIrAFecha(dia.fecha)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-amber-100 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    {formatearFecha(dia.fecha)}
                  </span>
                </div>
                <div className="text-xs text-amber-600">
                  {dia.total_movimientos} mov. |{' '}
                  <span className="text-emerald-600">+{formatearMonto(dia.total_entradas)}</span>
                  {' / '}
                  <span className="text-red-600">-{formatearMonto(dia.total_salidas)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
