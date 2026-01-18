/**
 * Seccion de proximos feriados con aviso de vencimientos
 */

import { Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { useFeriados } from '../hooks/useFeriados'
import { getConfigTipoFeriado, getDiasRestantes } from '../utils/feriadosUtils'
import { formatearFecha } from '../utils/formatters'

export default function ProximosFeriados() {
  const {
    proximosFeriados,
    vencimientoMonotributo,
    loading,
    error
  } = useFeriados()

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-600" />
            <h3 className="font-heading font-semibold text-gray-900">Proximos Feriados</h3>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>Error cargando feriados</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-violet-600" />
          <h3 className="font-heading font-semibold text-gray-900">Proximos Feriados</h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Aviso de vencimiento monotributo */}
        {vencimientoMonotributo && (
          <div className={`rounded-lg p-3 ${
            vencimientoMonotributo.esHabil
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-amber-50 border border-amber-200'
          }`}>
            <div className="flex items-start gap-2">
              {vencimientoMonotributo.esHabil ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
              )}
              <div>
                <div className={`text-sm font-medium ${
                  vencimientoMonotributo.esHabil ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  Vencimiento Monotributo (dia 20)
                </div>
                <div className={`text-xs ${
                  vencimientoMonotributo.esHabil ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {vencimientoMonotributo.mensaje}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de feriados */}
        {proximosFeriados.length > 0 ? (
          <div className="space-y-2">
            {proximosFeriados.map((feriado, index) => {
              const config = getConfigTipoFeriado(feriado.tipo)
              const diasRestantes = getDiasRestantes(feriado.fecha)
              const fecha = new Date(feriado.fecha + 'T00:00:00')

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${config.bgLight}`}
                >
                  {/* Indicador de tipo */}
                  <div className={`w-2 h-2 rounded-full ${config.color}`} />

                  {/* Fecha */}
                  <div className="w-14 text-center">
                    <div className={`text-lg font-bold ${config.textColor}`}>
                      {fecha.getDate()}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">
                      {fecha.toLocaleDateString('es-AR', { month: 'short' })}
                    </div>
                  </div>

                  {/* Nombre */}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {feriado.nombre}
                    </div>
                    <div className="text-xs text-gray-500">
                      {config.label}
                    </div>
                  </div>

                  {/* Dias restantes */}
                  {diasRestantes !== null && diasRestantes >= 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {diasRestantes === 0 ? 'Hoy' :
                       diasRestantes === 1 ? 'Mañana' :
                       `${diasRestantes} dias`}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            No hay feriados proximos
          </div>
        )}

        {/* Leyenda */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Inamovible</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Puente</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Trasladable</span>
          </div>
        </div>
      </div>
    </div>
  )
}
