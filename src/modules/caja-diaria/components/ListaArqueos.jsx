/**
 * Lista de arqueos del día (colapsable)
 */

import { useState } from 'react'
import { Calculator, Trash2, CheckCircle, AlertCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { formatearMonto, formatearHora } from '../utils/formatters'

export default function ListaArqueos({
  arqueos = [],
  loading = false,
  onEliminar = null
}) {
  const [expandido, setExpandido] = useState(false)

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (arqueos.length === 0) {
    return null // No mostrar nada si no hay arqueos
  }

  // Calcular resumen para mostrar en header
  const ultimoArqueo = arqueos[0]
  const totalDiferencia = arqueos.reduce((sum, a) => sum + parseFloat(a.diferencia || 0), 0)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header clickeable */}
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full px-4 py-3 bg-amber-50 flex items-center justify-between hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber-600" />
          <h3 className="font-heading font-semibold text-amber-900">
            Arqueos del día ({arqueos.length})
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {/* Resumen compacto cuando está colapsado */}
          {!expandido && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Último: {formatearHora(ultimoArqueo.hora)}</span>
              <span className={`font-medium ${
                totalDiferencia === 0 ? 'text-emerald-600' : totalDiferencia > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {totalDiferencia >= 0 ? '+' : ''}{formatearMonto(totalDiferencia)}
              </span>
            </div>
          )}
          {expandido ? (
            <ChevronUp className="w-5 h-5 text-amber-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-amber-600" />
          )}
        </div>
      </button>

      {/* Lista (colapsable) */}
      {expandido && (
        <div className="divide-y divide-gray-100">
          {arqueos.map((arqueo, index) => {
            const diferencia = parseFloat(arqueo.diferencia || 0)
            const esUltimo = index === 0

            return (
              <div
                key={arqueo.id}
                className={`p-4 ${esUltimo ? 'bg-amber-50/50' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {formatearHora(arqueo.hora)}
                      </span>
                      {esUltimo && (
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                          Último
                        </span>
                      )}
                    </div>

                    {/* Nombre del creador */}
                    {arqueo.creador_nombre && (
                      <div className="text-xs text-gray-500 mb-2">
                        Por: {arqueo.creador_nombre}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500 text-xs">Esperado</span>
                        <p className="font-medium">{formatearMonto(arqueo.efectivo_esperado)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Real</span>
                        <p className="font-medium">{formatearMonto(arqueo.efectivo_real)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Diferencia</span>
                        <div className="flex items-center gap-1">
                          {diferencia === 0 ? (
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <AlertCircle className={`w-3 h-3 ${diferencia > 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                          )}
                          <p className={`font-medium ${
                            diferencia === 0
                              ? 'text-emerald-600'
                              : diferencia > 0
                                ? 'text-emerald-600'
                                : 'text-red-600'
                          }`}>
                            {diferencia >= 0 ? '+' : ''}{formatearMonto(diferencia)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Motivo diferencia */}
                    {arqueo.motivo_diferencia && (
                      <p className="text-xs text-gray-500 mt-2 italic">
                        Motivo: {arqueo.motivo_diferencia}
                      </p>
                    )}

                    {/* Notas */}
                    {arqueo.notas && (
                      <p className="text-xs text-gray-500 mt-1">
                        {arqueo.notas}
                      </p>
                    )}
                  </div>

                  {/* Botón eliminar */}
                  {onEliminar && (
                    <button
                      onClick={() => onEliminar(arqueo.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar arqueo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
