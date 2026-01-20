/**
 * Muestra pills con los métodos de pago de un movimiento
 */

import { formatearMonto } from '../utils/formatters'
import IconoDinamico from './IconoDinamico'

export default function DetalleMetodosPago({ pagos, compact = false }) {
  if (!pagos || pagos.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? '' : 'mt-1'}`}>
      {pagos.map((pago, index) => (
        <span
          key={index}
          className={`group relative inline-flex items-center gap-1 bg-gray-100 text-gray-700 rounded cursor-default ${
            compact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
          }`}
          title={pago.metodo?.nombre || 'Método de pago'}
        >
          <IconoDinamico nombre={pago.metodo?.icono} className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
          <span>{formatearMonto(pago.monto)}</span>

          {/* Tooltip */}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            {pago.metodo?.nombre || 'Método de pago'}
            {/* Flecha del tooltip */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></span>
          </span>
        </span>
      ))}
    </div>
  )
}
