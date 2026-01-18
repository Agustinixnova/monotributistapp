/**
 * Grafico historico del dolar con Recharts
 */

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { useHistoricoDolar } from '../hooks/useHistoricoDolar'
import { formatearMoneda, formatearFecha, formatearPorcentaje } from '../utils/formatters'

const PERIODOS = [
  { key: 30, label: '30 dias' },
  { key: 90, label: '90 dias' },
  { key: 365, label: '1 año' },
]

/**
 * Tooltip personalizado para el grafico
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <div className="text-xs text-gray-500 mb-1">
        {formatearFecha(label, 'largo')}
      </div>
      <div className="text-lg font-bold text-blue-600">
        {formatearMoneda(payload[0]?.value, 2)}
      </div>
    </div>
  )
}

export default function GraficoHistoricoDolar() {
  const [dias, setDias] = useState(30)
  const { datosGrafico, estadisticas, loading, error } = useHistoricoDolar('blue', dias)

  // Icono de tendencia
  const IconoTendencia = estadisticas.variacion > 0 ? TrendingUp :
                         estadisticas.variacion < 0 ? TrendingDown : Minus

  const colorTendencia = estadisticas.variacion > 0 ? 'text-red-500' :
                         estadisticas.variacion < 0 ? 'text-emerald-500' : 'text-gray-400'

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-red-600">Error cargando historico</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-gray-900">Evolucion Dolar Blue</h3>
            {!loading && estadisticas.variacion !== null && (
              <div className={`flex items-center gap-1 text-sm ${colorTendencia}`}>
                <IconoTendencia className="w-4 h-4" />
                <span>{formatearPorcentaje(estadisticas.variacion, 1)} en el periodo</span>
              </div>
            )}
          </div>

          {/* Selector de periodo */}
          <div className="flex gap-1">
            {PERIODOS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setDias(key)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  dias === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grafico */}
      <div className="p-4">
        {loading ? (
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
        ) : datosGrafico.length > 0 ? (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="fechaCorta"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="venta"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Estadisticas */}
            {estadisticas.minimo && estadisticas.maximo && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-sm">
                <div className="text-center">
                  <div className="text-gray-500">Minimo</div>
                  <div className="font-semibold text-emerald-600">
                    {formatearMoneda(estadisticas.minimo.valor, 0)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatearFecha(estadisticas.minimo.fecha, 'corto')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Promedio</div>
                  <div className="font-semibold text-gray-700">
                    {formatearMoneda(estadisticas.promedio, 0)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Maximo</div>
                  <div className="font-semibold text-red-600">
                    {formatearMoneda(estadisticas.maximo.valor, 0)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatearFecha(estadisticas.maximo.fecha, 'corto')}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No hay datos disponibles
          </div>
        )}
      </div>
    </div>
  )
}
