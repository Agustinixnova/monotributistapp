import { useState, useEffect } from 'react'
import { X, CalendarDays, ChevronLeft, ChevronRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { getCalendarioAnual, EVENTO_CONFIG, EVENTO_TIPO } from '../services/eventosFiscalesService'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

/**
 * Modal con calendario fiscal anual del cliente
 */
export function ModalCalendarioFiscal({ clientId, onClose }) {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [mesActivo, setMesActivo] = useState(new Date().getMonth())

  useEffect(() => {
    async function fetchCalendario() {
      if (!clientId) return

      try {
        setLoading(true)
        const data = await getCalendarioAnual(clientId)
        setEventos(data || [])
      } catch (error) {
        console.error('Error fetching calendario:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCalendario()
  }, [clientId])

  // Agrupar eventos por mes
  const eventosPorMes = eventos.reduce((acc, evento) => {
    if (evento.fecha) {
      const mes = new Date(evento.fecha).getMonth()
      if (!acc[mes]) acc[mes] = []
      acc[mes].push(evento)
    } else {
      // Eventos sin fecha (alertas actuales) van al mes actual
      const mesActual = new Date().getMonth()
      if (!acc[mesActual]) acc[mesActual] = []
      acc[mesActual].push(evento)
    }
    return acc
  }, {})

  // Contar eventos por tipo para leyenda
  const conteoTipos = eventos.reduce((acc, e) => {
    acc[e.tipo] = (acc[e.tipo] || 0) + 1
    return acc
  }, {})

  const anio = new Date().getFullYear()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 rounded-lg">
              <CalendarDays className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Calendario Fiscal {anio}</h2>
              <p className="text-sm text-gray-500">Vencimientos y eventos importantes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : (
          <>
            {/* Selector de mes */}
            <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <button
                onClick={() => setMesActivo(m => Math.max(0, m - 1))}
                disabled={mesActivo === 0}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              <div className="flex gap-1 overflow-x-auto scrollbar-none">
                {MESES.map((mes, idx) => {
                  const tieneEventos = eventosPorMes[idx]?.length > 0
                  const tieneUrgente = eventosPorMes[idx]?.some(e => e.prioridad === 'urgente' || e.prioridad === 'critico')
                  const esActual = idx === new Date().getMonth()

                  return (
                    <button
                      key={mes}
                      onClick={() => setMesActivo(idx)}
                      className={`relative px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        mesActivo === idx
                          ? 'bg-violet-600 text-white'
                          : esActual
                          ? 'bg-violet-100 text-violet-700 font-medium'
                          : 'hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      {mes.slice(0, 3)}
                      {tieneEventos && mesActivo !== idx && (
                        <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                          tieneUrgente ? 'bg-red-500' : 'bg-violet-500'
                        }`} />
                      )}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setMesActivo(m => Math.min(11, m + 1))}
                disabled={mesActivo === 11}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Contenido del mes */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {MESES[mesActivo]} {anio}
              </h3>

              {eventosPorMes[mesActivo]?.length > 0 ? (
                <div className="space-y-3">
                  {eventosPorMes[mesActivo].map((evento, idx) => {
                    const config = EVENTO_CONFIG[evento.tipo]
                    const esPasado = evento.fecha && new Date(evento.fecha) < new Date()

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border ${
                          esPasado
                            ? 'bg-gray-50 border-gray-200'
                            : evento.prioridad === 'critico'
                            ? 'bg-red-50 border-red-200'
                            : evento.prioridad === 'urgente'
                            ? 'bg-amber-50 border-amber-200'
                            : `${config.bgColor} ${config.borderColor}`
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Fecha */}
                          {evento.fecha && (
                            <div className={`flex-shrink-0 w-12 text-center ${
                              esPasado ? 'opacity-50' : ''
                            }`}>
                              <span className={`text-2xl font-bold ${
                                esPasado ? 'text-gray-400' :
                                evento.prioridad === 'critico' ? 'text-red-600' :
                                evento.prioridad === 'urgente' ? 'text-amber-600' :
                                config.textColor
                              }`}>
                                {new Date(evento.fecha).getDate()}
                              </span>
                              <p className="text-xs text-gray-500 -mt-1">
                                {MESES[new Date(evento.fecha).getMonth()].slice(0, 3)}
                              </p>
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                esPasado
                                  ? 'bg-gray-200 text-gray-600'
                                  : `${config.bgColor} ${config.textColor}`
                              }`}>
                                {config.label}
                              </span>
                              {esPasado && (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            <h4 className={`font-medium ${
                              esPasado ? 'text-gray-500' : 'text-gray-900'
                            }`}>
                              {evento.descripcion}
                            </h4>
                            {evento.detalle && (
                              <p className={`text-sm mt-0.5 ${
                                esPasado ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {evento.detalle}
                              </p>
                            )}
                          </div>

                          {/* Dias restantes */}
                          {!esPasado && evento.diasRestantes !== null && evento.diasRestantes >= 0 && (
                            <div className={`text-right ${
                              evento.diasRestantes <= 5 ? 'text-red-600' :
                              evento.diasRestantes <= 10 ? 'text-amber-600' :
                              'text-gray-500'
                            }`}>
                              <span className="text-lg font-bold">{evento.diasRestantes}</span>
                              <p className="text-xs">dias</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <CalendarDays className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No hay eventos en {MESES[mesActivo]}</p>
                </div>
              )}
            </div>

            {/* Leyenda */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Tipos de eventos:</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(conteoTipos).map(([tipo, count]) => {
                  const config = EVENTO_CONFIG[tipo]
                  return (
                    <div key={tipo} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded-full bg-${config.color}-500`}
                           style={{ backgroundColor: `var(--${config.color}-500, ${
                             config.color === 'violet' ? '#8b5cf6' :
                             config.color === 'blue' ? '#3b82f6' :
                             config.color === 'amber' ? '#f59e0b' :
                             config.color === 'red' ? '#ef4444' :
                             config.color === 'teal' ? '#14b8a6' :
                             config.color === 'orange' ? '#f97316' : '#6b7280'
                           })` }} />
                      <span className="text-xs text-gray-600">{config.label} ({count})</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ModalCalendarioFiscal
