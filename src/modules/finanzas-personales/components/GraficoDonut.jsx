/**
 * Grafico donut con categorias
 * Usa Recharts PieChart
 */

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { getCategoriaColor, getCategoriaIcono } from '../utils/categoriasConfig'
import { formatearMonto } from '../utils/formatters'

// Colores para el grafico
const CHART_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
  '#06b6d4', // cyan
]

export default function GraficoDonut({ categorias, total }) {
  if (!categorias || categorias.length === 0) {
    return null
  }

  // Preparar datos para el grafico
  const data = categorias.map((cat, index) => ({
    name: cat.nombre,
    value: cat.total,
    porcentaje: cat.porcentaje,
    color: CHART_COLORS[index % CHART_COLORS.length]
  }))

  // Custom label dentro del donut
  const renderCenterLabel = () => (
    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="central"
    >
      <tspan x="50%" dy="-0.5em" className="text-lg font-bold fill-gray-900">
        {formatearMonto(total)}
      </tspan>
      <tspan x="50%" dy="1.5em" className="text-xs fill-gray-500">
        Total
      </tspan>
    </text>
  )

  return (
    <div className="w-full">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda personalizada */}
      <div className="mt-4 space-y-2">
        {data.slice(0, 5).map((item, index) => {
          const IconComponent = getCategoriaIcono(item.name)
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: item.color }}
                >
                  <IconComponent className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-700 truncate max-w-[120px]">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {formatearMonto(item.value)}
                </span>
                <span className="text-xs text-gray-500">
                  ({item.porcentaje?.toFixed(0)}%)
                </span>
              </div>
            </div>
          )
        })}
        {data.length > 5 && (
          <div className="text-xs text-gray-400 text-center pt-1">
            +{data.length - 5} categorias mas
          </div>
        )}
      </div>
    </div>
  )
}
