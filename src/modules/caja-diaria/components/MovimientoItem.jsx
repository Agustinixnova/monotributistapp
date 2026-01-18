/**
 * Item individual de movimiento en la lista
 */

import { ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react'
import { formatearMonto, formatearHora } from '../utils/formatters'
import DetalleMetodosPago from './DetalleMetodosPago'
import IconoDinamico from './IconoDinamico'

export default function MovimientoItem({ movimiento, onAnular }) {
  const esEntrada = movimiento.tipo === 'entrada'
  const Icon = esEntrada ? ArrowUpCircle : ArrowDownCircle
  const colorIcon = esEntrada ? 'text-emerald-600' : 'text-red-600'
  const colorMonto = esEntrada ? 'text-emerald-700' : 'text-red-700'

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        {/* Icono */}
        <div className={`mt-0.5 ${colorIcon}`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Primera línea: categoría y hora */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <IconoDinamico nombre={movimiento.categoria?.icono} className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">
                {movimiento.categoria?.nombre}
              </span>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatearHora(movimiento.hora)}
            </span>
          </div>

          {/* Descripción (si existe) */}
          {movimiento.descripcion && (
            <p className="text-sm text-gray-600 mt-0.5">
              {movimiento.descripcion}
            </p>
          )}

          {/* Monto */}
          <div className={`text-lg font-bold ${colorMonto} mt-1`}>
            {esEntrada ? '+' : '-'} {formatearMonto(movimiento.monto_total)}
          </div>

          {/* Detalle de métodos de pago */}
          <DetalleMetodosPago pagos={movimiento.pagos} />
        </div>

        {/* Botón anular */}
        {onAnular && (
          <button
            onClick={() => onAnular(movimiento.id)}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600"
            title="Anular movimiento"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
