/**
 * Card que muestra el resumen total del día
 */

import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatearMonto } from '../utils/formatters'

export default function ResumenDia({ resumen }) {
  if (!resumen) return null

  const saldo = parseFloat(resumen.saldo || 0)
  const esPositivo = saldo >= 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-heading font-semibold text-gray-900 mb-4">
        Total del Día
      </h3>

      <div className="space-y-3">
        {/* Entradas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-700">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Entradas</span>
          </div>
          <span className="font-bold text-emerald-700">
            {formatearMonto(resumen.total_entradas)}
          </span>
        </div>

        {/* Salidas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-medium">Salidas</span>
          </div>
          <span className="font-bold text-red-700">
            {formatearMonto(resumen.total_salidas)}
          </span>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-gray-200 my-2"></div>

        {/* Saldo */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Saldo</span>
          <span className={`text-xl font-bold ${esPositivo ? 'text-emerald-700' : 'text-red-700'}`}>
            {formatearMonto(saldo)}
          </span>
        </div>
      </div>
    </div>
  )
}
