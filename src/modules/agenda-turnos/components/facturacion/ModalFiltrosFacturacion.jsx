/**
 * Modal de Filtros para Facturación (Mobile)
 */

import { X, Calendar, Filter, ChevronDown } from 'lucide-react'

export default function ModalFiltrosFacturacion({
  isOpen,
  onClose,
  // Período
  filtroPeriodo,
  setFiltroPeriodo,
  mes,
  setMes,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  opcionesMeses,
  // Filtros
  filtroEstado,
  setFiltroEstado,
  filtroTipoPago,
  setFiltroTipoPago
}) {
  if (!isOpen) return null

  const hayFiltrosActivos = filtroEstado !== 'todos' || filtroTipoPago !== 'todos' || filtroPeriodo !== 'mes'

  const limpiarFiltros = () => {
    setFiltroPeriodo('mes')
    setFiltroEstado('todos')
    setFiltroTipoPago('todos')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-heading font-semibold text-lg text-gray-900">
                Filtros
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {hayFiltrosActivos && (
                <button
                  onClick={limpiarFiltros}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Limpiar
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Período */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { valor: 'mes', label: 'Mes' },
                  { valor: 'hoy', label: 'Hoy' },
                  { valor: 'ayer', label: 'Ayer' },
                  { valor: 'semana', label: 'Semana' },
                  { valor: 'personalizado', label: 'Rango', colSpan: 2 }
                ].map(periodo => (
                  <button
                    key={periodo.valor}
                    onClick={() => setFiltroPeriodo(periodo.valor)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      periodo.colSpan ? 'col-span-2' : ''
                    } ${
                      filtroPeriodo === periodo.valor
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {periodo.label}
                  </button>
                ))}
              </div>

              {/* Selector de mes */}
              {filtroPeriodo === 'mes' && (
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 text-sm border border-gray-300 rounded-lg bg-white appearance-none"
                  >
                    {opcionesMeses.map(op => (
                      <option key={op.valor} value={op.valor}>{op.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}

              {/* Fechas personalizadas */}
              {filtroPeriodo === 'personalizado' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Desde</label>
                    <input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { valor: 'todos', label: 'Todos' },
                  { valor: 'sin_facturar', label: 'Sin facturar' },
                  { valor: 'facturado', label: 'Facturado' },
                  { valor: 'anulado', label: 'N/C Anulado' }
                ].map(estado => (
                  <button
                    key={estado.valor}
                    onClick={() => setFiltroEstado(estado.valor)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      filtroEstado === estado.valor
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {estado.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de pago
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { valor: 'todos', label: 'Todos' },
                  { valor: 'electronicos', label: 'Electrónico' },
                  { valor: 'efectivo', label: 'Efectivo' }
                ].map(tipo => (
                  <button
                    key={tipo.valor}
                    onClick={() => setFiltroTipoPago(tipo.valor)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      filtroTipoPago === tipo.valor
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {tipo.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
