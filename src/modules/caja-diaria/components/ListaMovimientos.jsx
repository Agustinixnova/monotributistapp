/**
 * Lista de movimientos del día
 */

import { Clock } from 'lucide-react'
import MovimientoItem from './MovimientoItem'

export default function ListaMovimientos({ movimientos, loading, onAnular }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-heading font-semibold text-gray-900 mb-4">
          Últimos movimientos
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!movimientos || movimientos.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-heading font-semibold text-gray-900 mb-4">
          Últimos movimientos
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Clock className="w-12 h-12 mb-3" />
          <p className="text-sm">No hay movimientos registrados hoy</p>
        </div>
      </div>
    )
  }

  // Mostrar solo los últimos 5
  const ultimosMovimientos = movimientos.slice(0, 5)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-heading font-semibold text-gray-900 mb-4">
        Últimos movimientos
      </h3>

      <div className="space-y-3">
        {ultimosMovimientos.map(movimiento => (
          <MovimientoItem
            key={movimiento.id}
            movimiento={movimiento}
            onAnular={onAnular}
          />
        ))}
      </div>

      {movimientos.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <span className="text-sm text-gray-500">
            {movimientos.length - 5} movimientos más
          </span>
        </div>
      )}
    </div>
  )
}
