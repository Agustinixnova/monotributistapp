/**
 * Lista de gastos del mes
 */

import { formatearMonto, formatearFechaCorta } from '../utils/formatters'
import { getCategoriaColor, getCategoriaIcono } from '../utils/categoriasConfig'
import { getMetodoPago } from '../utils/metodoPagoConfig'
import { ChevronRight, Receipt } from 'lucide-react'

export default function ListaGastos({ gastos, onEditarGasto }) {
  if (!gastos || gastos.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
        <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <div className="text-gray-500">No hay gastos registrados</div>
      </div>
    )
  }

  // Agrupar gastos por fecha
  const gastosPorFecha = gastos.reduce((acc, gasto) => {
    const fecha = gasto.fecha
    if (!acc[fecha]) {
      acc[fecha] = []
    }
    acc[fecha].push(gasto)
    return acc
  }, {})

  // Ordenar fechas de mas reciente a mas antiguo
  const fechasOrdenadas = Object.keys(gastosPorFecha).sort((a, b) =>
    new Date(b) - new Date(a)
  )

  return (
    <div className="space-y-4">
      {fechasOrdenadas.map(fecha => (
        <div key={fecha}>
          <div className="text-xs font-medium text-gray-500 uppercase mb-2 px-1">
            {formatearFechaCorta(fecha)}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {gastosPorFecha[fecha].map(gasto => (
              <GastoItem
                key={gasto.id}
                gasto={gasto}
                onClick={() => onEditarGasto?.(gasto)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function GastoItem({ gasto, onClick }) {
  const categoria = gasto.fp_categorias || {}
  const colors = getCategoriaColor(categoria.color || 'gray')
  const metodoPago = getMetodoPago(gasto.metodo_pago)
  const IconComponent = getCategoriaIcono(categoria.nombre)

  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
    >
      {/* Icono categoria */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.bg}`}>
        <IconComponent className={`w-5 h-5 ${colors.text}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">
          {gasto.nota || categoria.nombre || 'Sin descripcion'}
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span>{categoria.nombre}</span>
          {metodoPago && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="capitalize">{gasto.metodo_pago}</span>
            </>
          )}
        </div>
      </div>

      {/* Monto */}
      <div className="text-right">
        <div className="font-semibold text-gray-900">
          -{formatearMonto(gasto.monto)}
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </button>
  )
}
