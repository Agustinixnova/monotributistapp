/**
 * Inputs para split de pagos
 */

import InputMonto from './InputMonto'
import IconoDinamico from './IconoDinamico'
import { formatearMonto } from '../utils/formatters'

export default function InputsPago({ metodosPago, pagos, onChange }) {
  const handleChangeMonto = (metodoId, monto) => {
    const nuevosPagos = [...pagos]
    const index = nuevosPagos.findIndex(p => p.metodo_pago_id === metodoId)

    if (index >= 0) {
      if (monto > 0) {
        nuevosPagos[index].monto = monto
      } else {
        // Si el monto es 0, remover el pago
        nuevosPagos.splice(index, 1)
      }
    } else {
      if (monto > 0) {
        nuevosPagos.push({ metodo_pago_id: metodoId, monto })
      }
    }

    onChange(nuevosPagos)
  }

  const getMonto = (metodoId) => {
    const pago = pagos.find(p => p.metodo_pago_id === metodoId)
    return pago?.monto || 0
  }

  // Calcular total
  const total = pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)

  if (!metodosPago || metodosPago.length === 0) {
    return <div className="text-sm text-gray-500">No hay métodos de pago configurados</div>
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Formas de pago</h4>

      <div className="space-y-2">
        {metodosPago.map(metodo => (
          <div key={metodo.id} className="flex items-center gap-3">
            {/* Icono y nombre */}
            <div className="flex items-center gap-2 min-w-[140px]">
              <IconoDinamico nombre={metodo.icono} className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">{metodo.nombre}</span>
            </div>

            {/* Input */}
            <div className="flex-1">
              <InputMonto
                value={getMonto(metodo.id)}
                onChange={(monto) => handleChangeMonto(metodo.id, monto)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="border-t border-gray-200 pt-3 mt-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900">Total</span>
          <span className="text-2xl font-bold text-violet-700">
            {formatearMonto(total)}
          </span>
        </div>
      </div>
    </div>
  )
}
