/**
 * Muestra pills con los métodos de pago de un movimiento
 */

import { formatearMonto } from '../utils/formatters'
import IconoDinamico from './IconoDinamico'

export default function DetalleMetodosPago({ pagos }) {
  if (!pagos || pagos.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {pagos.map((pago, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
        >
          <IconoDinamico nombre={pago.metodo?.icono} className="w-3 h-3" />
          <span>{formatearMonto(pago.monto)}</span>
        </span>
      ))}
    </div>
  )
}
