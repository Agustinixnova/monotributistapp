/**
 * Top categorias con barra de progreso
 */

import { getCategoriaColor, getCategoriaIcono } from '../utils/categoriasConfig'
import { formatearMonto } from '../utils/formatters'

export default function TopCategorias({ categorias }) {
  if (!categorias || categorias.length === 0) {
    return null
  }

  // El maximo para la barra de progreso
  const maxTotal = Math.max(...categorias.map(c => c.total))

  return (
    <div className="space-y-4">
      {categorias.map((cat, index) => {
        const colors = getCategoriaColor(cat.color)
        const porcentajeBarra = (cat.total / maxTotal) * 100
        const IconComponent = getCategoriaIcono(cat.nombre)

        return (
          <div key={cat.id || index}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${colors.bg}`}>
                  <IconComponent className={`w-4 h-4 ${colors.text}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{cat.nombre}</span>
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {formatearMonto(cat.total)}
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${porcentajeBarra}%`, backgroundColor: colors.fill }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {cat.porcentaje?.toFixed(1)}% del total
            </div>
          </div>
        )
      })}
    </div>
  )
}
