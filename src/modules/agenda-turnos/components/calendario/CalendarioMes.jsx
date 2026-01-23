/**
 * Vista de calendario mensual
 */

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react'
import { getFechaHoyArgentina, esHoy, formatMesAnio } from '../../utils/dateUtils'

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function CalendarioMes({
  fecha,
  onFechaChange,
  turnos = [],
  loading = false,
  onDiaClick,
  onNuevoTurno
}) {
  const hoy = getFechaHoyArgentina()

  // Obtener año y mes de la fecha seleccionada
  const [anio, mes] = fecha.split('-').map(Number)

  // Generar días del mes
  const diasMes = useMemo(() => {
    const primerDia = new Date(anio, mes - 1, 1)
    const ultimoDia = new Date(anio, mes, 0)

    const diasArray = []

    // Días vacíos antes del primer día del mes
    const primerDiaSemana = primerDia.getDay()
    for (let i = 0; i < primerDiaSemana; i++) {
      diasArray.push(null)
    }

    // Días del mes
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      const fechaDia = `${anio}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      diasArray.push(fechaDia)
    }

    return diasArray
  }, [anio, mes])

  // Agrupar turnos por fecha
  const turnosPorFecha = useMemo(() => {
    const agrupados = {}
    turnos.forEach(turno => {
      if (!agrupados[turno.fecha]) {
        agrupados[turno.fecha] = []
      }
      agrupados[turno.fecha].push(turno)
    })
    return agrupados
  }, [turnos])

  // Navegar meses
  const irMesAnterior = () => {
    const nuevaFecha = new Date(anio, mes - 2, 1)
    const fechaStr = `${nuevaFecha.getFullYear()}-${String(nuevaFecha.getMonth() + 1).padStart(2, '0')}-01`
    onFechaChange(fechaStr)
  }

  const irMesSiguiente = () => {
    const nuevaFecha = new Date(anio, mes, 1)
    const fechaStr = `${nuevaFecha.getFullYear()}-${String(nuevaFecha.getMonth() + 1).padStart(2, '0')}-01`
    onFechaChange(fechaStr)
  }

  const irHoy = () => {
    onFechaChange(hoy)
  }

  // Verificar si el mes actual contiene hoy
  const mesContieneHoy = hoy.startsWith(`${anio}-${String(mes).padStart(2, '0')}`)

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header con navegación */}
      <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={irMesAnterior}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={irHoy}
            disabled={mesContieneHoy}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              mesContieneHoy
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            Hoy
          </button>

          <button
            onClick={irMesSiguiente}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <h2 className="font-heading font-semibold text-lg text-gray-800 capitalize">
          {formatMesAnio(fecha)}
        </h2>

        <button
          onClick={() => onNuevoTurno?.(fecha)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo turno</span>
        </button>
      </div>

      {/* Grid del calendario */}
      <div className="relative p-4">
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Header de días de la semana */}
        <div className="grid grid-cols-7 mb-2">
          {DIAS_SEMANA.map((dia, index) => (
            <div
              key={dia}
              className={`text-center text-xs font-medium py-2 ${
                index === 0 || index === 6 ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7 gap-1">
          {diasMes.map((fechaDia, index) => {
            if (!fechaDia) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const esHoyDia = esHoy(fechaDia)
            const turnosDia = turnosPorFecha[fechaDia] || []
            const diaSemana = new Date(fechaDia + 'T12:00:00').getDay()
            const esFinDeSemana = diaSemana === 0 || diaSemana === 6
            const numeroDia = parseInt(fechaDia.split('-')[2])

            return (
              <div
                key={fechaDia}
                onClick={() => onDiaClick?.(fechaDia)}
                className={`aspect-square p-1 rounded-lg cursor-pointer transition-all border ${
                  esHoyDia
                    ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    : esFinDeSemana
                      ? 'bg-gray-50 border-transparent hover:bg-gray-100'
                      : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="h-full flex flex-col">
                  <div
                    className={`text-sm font-medium text-center ${
                      esHoyDia
                        ? 'text-blue-600'
                        : esFinDeSemana
                          ? 'text-gray-400'
                          : 'text-gray-700'
                    }`}
                  >
                    {numeroDia}
                  </div>

                  {/* Indicadores de turnos */}
                  {turnosDia.length > 0 && (
                    <div className="flex-1 flex flex-col justify-center items-center gap-0.5">
                      {turnosDia.length <= 3 ? (
                        // Mostrar puntos individuales si hay pocos turnos
                        <div className="flex gap-0.5 flex-wrap justify-center">
                          {turnosDia.slice(0, 3).map((turno) => (
                            <div
                              key={turno.id}
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: turno.servicio_color || turno.agenda_turno_servicios?.[0]?.agenda_servicios?.color || '#3B82F6'
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        // Mostrar contador si hay muchos
                        <div className="text-xs font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                          {turnosDia.length}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-center gap-4 text-xs text-gray-500">
        <span>Click en un día para ver detalle</span>
      </div>
    </div>
  )
}
