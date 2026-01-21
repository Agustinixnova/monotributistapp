/**
 * Modal de detalle de movimientos del día agrupados por categoría
 * Muestra todos los movimientos del día (sin paginación) agrupados por categoría
 */

import { X, TrendingUp, TrendingDown } from 'lucide-react'
import { formatearMonto } from '../utils/formatters'
import IconoDinamico from './IconoDinamico'

export default function ModalDetalleMovimientosDia({ isOpen, onClose, movimientos, fecha }) {
  if (!isOpen) return null

  // Agrupar movimientos por categoría y tipo
  const agrupadoIngresos = {}
  const agrupadoEgresos = {}

  movimientos.forEach(mov => {
    if (mov.anulado) return // Ignorar anulados

    const grupo = mov.tipo === 'entrada' ? agrupadoIngresos : agrupadoEgresos
    const catId = mov.categoria_id

    if (!grupo[catId]) {
      grupo[catId] = {
        categoria_id: catId,
        categoria_nombre: mov.categoria?.nombre || 'Sin categoría',
        categoria_icono: mov.categoria?.icono || 'HelpCircle',
        cantidad: 0,
        total: 0
      }
    }

    grupo[catId].cantidad++
    grupo[catId].total += parseFloat(mov.monto_total || 0)
  })

  // Convertir a arrays y ordenar por total descendente
  const ingresos = Object.values(agrupadoIngresos).sort((a, b) => b.total - a.total)
  const egresos = Object.values(agrupadoEgresos).sort((a, b) => b.total - a.total)

  const totalIngresos = ingresos.reduce((sum, cat) => sum + cat.total, 0)
  const totalEgresos = egresos.reduce((sum, cat) => sum + cat.total, 0)
  const balance = totalIngresos - totalEgresos

  // Formatear fecha
  const fechaFormateada = new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-semibold text-lg">Detalle del Día</h3>
                <p className="text-sm text-white/80 capitalize mt-1">{fechaFormateada}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Resumen General */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700 font-medium">Ingresos</span>
                </div>
                <p className="text-2xl font-bold text-emerald-700">{formatearMonto(totalIngresos)}</p>
                <p className="text-xs text-emerald-600 mt-1">{ingresos.length} categorías</p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700 font-medium">Egresos</span>
                </div>
                <p className="text-2xl font-bold text-red-700">{formatearMonto(totalEgresos)}</p>
                <p className="text-xs text-red-600 mt-1">{egresos.length} categorías</p>
              </div>

              <div className={`border rounded-lg p-4 ${
                balance >= 0
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-medium ${
                    balance >= 0 ? 'text-blue-700' : 'text-orange-700'
                  }`}>
                    Balance
                  </span>
                </div>
                <p className={`text-2xl font-bold ${
                  balance >= 0 ? 'text-blue-700' : 'text-orange-700'
                }`}>
                  {formatearMonto(balance)}
                </p>
                <p className={`text-xs mt-1 ${
                  balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  {balance >= 0 ? 'Positivo' : 'Negativo'}
                </p>
              </div>
            </div>

            {/* Ingresos por Categoría */}
            {ingresos.length > 0 && (
              <div>
                <h4 className="font-heading font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Ingresos por Categoría
                </h4>
                <div className="space-y-2">
                  {ingresos.map((cat) => {
                    const porcentaje = totalIngresos > 0 ? (cat.total / totalIngresos * 100) : 0
                    return (
                      <div
                        key={cat.categoria_id}
                        className="border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {/* Icono */}
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <IconoDinamico nombre={cat.categoria_icono} className="w-5 h-5 text-emerald-600" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900 truncate">
                                {cat.categoria_nombre}
                              </span>
                              <span className="font-bold text-emerald-600 ml-2">
                                {formatearMonto(cat.total)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-500">
                                {cat.cantidad} {cat.cantidad === 1 ? 'operación' : 'operaciones'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {porcentaje.toFixed(1)}%
                              </span>
                            </div>
                            {/* Barra de progreso */}
                            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${porcentaje}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Egresos por Categoría */}
            {egresos.length > 0 && (
              <div>
                <h4 className="font-heading font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  Egresos por Categoría
                </h4>
                <div className="space-y-2">
                  {egresos.map((cat) => {
                    const porcentaje = totalEgresos > 0 ? (cat.total / totalEgresos * 100) : 0
                    return (
                      <div
                        key={cat.categoria_id}
                        className="border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {/* Icono */}
                          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                            <IconoDinamico nombre={cat.categoria_icono} className="w-5 h-5 text-red-600" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900 truncate">
                                {cat.categoria_nombre}
                              </span>
                              <span className="font-bold text-red-600 ml-2">
                                {formatearMonto(cat.total)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-500">
                                {cat.cantidad} {cat.cantidad === 1 ? 'operación' : 'operaciones'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {porcentaje.toFixed(1)}%
                              </span>
                            </div>
                            {/* Barra de progreso */}
                            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-500 rounded-full transition-all"
                                style={{ width: `${porcentaje}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sin movimientos */}
            {ingresos.length === 0 && egresos.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p>No hay movimientos en este día</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
