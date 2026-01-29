/**
 * Modal para configurar y descargar reporte de facturación
 * Optimizado para mobile (bottom sheet) y desktop (centered modal)
 */

import { useState } from 'react'
import {
  X, FileSpreadsheet, Download, Loader2,
  CreditCard, Banknote, CheckSquare, Square, ChevronDown, Calendar
} from 'lucide-react'

export default function ModalReporteFacturacion({
  isOpen,
  onClose,
  onGenerar,
  generando
}) {
  // Opciones de tipos de pago
  const [incluirElectronicos, setIncluirElectronicos] = useState(true)
  const [incluirEfectivo, setIncluirEfectivo] = useState(true)

  // Opción de desglose
  const [desglosado, setDesglosado] = useState(true)

  // Filtro de período
  const [periodo, setPeriodo] = useState('mes')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const hoy = new Date()
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  })

  // Generar opciones de meses (últimos 12 meses)
  const opcionesMeses = []
  const hoy = new Date()
  for (let i = 0; i < 12; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const valor = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    const label = fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    opcionesMeses.push({ valor, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }

  const handleGenerar = () => {
    if (!incluirElectronicos && !incluirEfectivo) {
      alert('Debés seleccionar al menos un tipo de pago')
      return
    }

    onGenerar({
      incluirElectronicos,
      incluirEfectivo,
      desglosado,
      periodo,
      mesSeleccionado,
      fechaDesde,
      fechaHasta
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Centered modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              <h3 className="font-heading font-semibold">
                Generar Reporte Excel
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Período */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {[
                  { valor: 'mes', label: 'Mes' },
                  { valor: 'hoy', label: 'Hoy' },
                  { valor: 'ayer', label: 'Ayer' },
                  { valor: 'semana', label: 'Semana' },
                  { valor: 'personalizado', label: 'Rango', colSpan: 2 }
                ].map(p => (
                  <button
                    key={p.valor}
                    onClick={() => setPeriodo(p.valor)}
                    className={`px-2 py-1.5 text-sm rounded-lg border transition-colors ${
                      p.colSpan ? 'col-span-2' : ''
                    } ${
                      periodo === p.valor
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Selector de mes */}
              {periodo === 'mes' && (
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={mesSeleccionado}
                    onChange={(e) => setMesSeleccionado(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white appearance-none"
                  >
                    {opcionesMeses.map(op => (
                      <option key={op.valor} value={op.valor}>{op.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}

              {/* Fechas personalizadas */}
              {periodo === 'personalizado' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Desde</label>
                    <input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tipos de pago - Compact horizontal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipos de pago
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIncluirElectronicos(!incluirElectronicos)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                    incluirElectronicos
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {incluirElectronicos ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  <CreditCard className={`w-4 h-4 flex-shrink-0 ${incluirElectronicos ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`text-xs ${incluirElectronicos ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>
                    Electrónico
                  </span>
                </button>

                <button
                  onClick={() => setIncluirEfectivo(!incluirEfectivo)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                    incluirEfectivo
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {incluirEfectivo ? (
                    <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  <Banknote className={`w-4 h-4 flex-shrink-0 ${incluirEfectivo ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`text-xs ${incluirEfectivo ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                    Efectivo
                  </span>
                </button>
              </div>
            </div>

            {/* Tipo de reporte - Compact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDesglosado(true)}
                  className={`p-2.5 rounded-lg border text-center transition-colors ${
                    desglosado
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <p className={`text-sm font-medium ${desglosado ? 'text-emerald-700' : 'text-gray-700'}`}>
                    Desglosado
                  </p>
                  <p className="text-xs text-gray-500">
                    5 hojas con detalle
                  </p>
                </button>
                <button
                  onClick={() => setDesglosado(false)}
                  className={`p-2.5 rounded-lg border text-center transition-colors ${
                    !desglosado
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <p className={`text-sm font-medium ${!desglosado ? 'text-emerald-700' : 'text-gray-700'}`}>
                    Resumido
                  </p>
                  <p className="text-xs text-gray-500">
                    Solo totales
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerar}
              disabled={generando || (!incluirElectronicos && !incluirEfectivo)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {generando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Generando...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Descargar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
