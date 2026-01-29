/**
 * Componente para seleccionar slots de tiempo disponibles
 * Usado en la creación de links de reserva
 */

import { useState, useMemo } from 'react'
import { Clock, ChevronLeft, ChevronRight, Check, X } from 'lucide-react'

// Generar slots cada 30 minutos
function generarSlotsDelDia(horaInicio = '08:00', horaFin = '20:00', intervalo = 30) {
  const slots = []
  const [hI, mI] = horaInicio.split(':').map(Number)
  const [hF, mF] = horaFin.split(':').map(Number)

  let minutosActual = hI * 60 + mI
  const minutosFin = hF * 60 + mF

  while (minutosActual < minutosFin) {
    const h = Math.floor(minutosActual / 60)
    const m = minutosActual % 60
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    minutosActual += intervalo
  }

  return slots
}

// Obtener nombre del día
function getNombreDia(fecha) {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const date = new Date(fecha + 'T12:00:00')
  return dias[date.getDay()]
}

// Formatear fecha
function formatFecha(fecha) {
  const date = new Date(fecha + 'T12:00:00')
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

// Convertir hora HH:MM a minutos
function horaAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

export default function SelectorSlots({
  fechaDesde,
  fechaHasta,
  slotsSeleccionados = {},
  onChange,
  disponibilidadProfesional = [],
  turnosExistentes = [],
  intervaloMinutos = 30
}) {
  // Estado para navegación de fechas
  const [semanaOffset, setSemanaOffset] = useState(0)

  // Agrupar turnos por fecha para acceso rápido
  const turnosPorFecha = useMemo(() => {
    const agrupados = {}
    turnosExistentes.forEach(turno => {
      // Solo considerar turnos activos (no cancelados ni no_asistio)
      if (['cancelado', 'no_asistio'].includes(turno.estado)) return

      if (!agrupados[turno.fecha]) {
        agrupados[turno.fecha] = []
      }
      agrupados[turno.fecha].push({
        inicio: horaAMinutos(turno.hora_inicio),
        fin: horaAMinutos(turno.hora_fin),
        cliente: turno.cliente?.nombre || 'Ocupado'
      })
    })
    return agrupados
  }, [turnosExistentes])

  // Verificar si un slot está ocupado por un turno existente
  const isSlotOcupado = (fecha, hora) => {
    const turnosDelDia = turnosPorFecha[fecha]
    if (!turnosDelDia || turnosDelDia.length === 0) return false

    const slotMinutos = horaAMinutos(hora)

    for (const turno of turnosDelDia) {
      // El slot está ocupado si cae dentro del rango del turno
      if (slotMinutos >= turno.inicio && slotMinutos < turno.fin) {
        return true
      }
    }

    return false
  }

  // Generar array de fechas en el rango
  const fechasEnRango = useMemo(() => {
    if (!fechaDesde || !fechaHasta) return []

    const fechas = []
    const start = new Date(fechaDesde + 'T12:00:00')
    const end = new Date(fechaHasta + 'T12:00:00')

    const current = new Date(start)
    while (current <= end) {
      fechas.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }

    return fechas
  }, [fechaDesde, fechaHasta])

  // Mostrar 7 días a la vez
  const fechasVisibles = useMemo(() => {
    const inicio = semanaOffset * 7
    return fechasEnRango.slice(inicio, inicio + 7)
  }, [fechasEnRango, semanaOffset])

  const totalSemanas = Math.ceil(fechasEnRango.length / 7)

  // Obtener slots disponibles para una fecha basado en disponibilidad del profesional
  const getSlotsParaDia = (fecha) => {
    const date = new Date(fecha + 'T12:00:00')
    const diaSemana = date.getDay()

    // Buscar disponibilidad para este día
    const disp = disponibilidadProfesional.find(d => d.dia_semana === diaSemana && d.activo)

    if (!disp) return { todos: [], libres: [] }

    const todosSlots = generarSlotsDelDia(disp.hora_inicio, disp.hora_fin, intervaloMinutos)
    const slotsLibres = todosSlots.filter(hora => !isSlotOcupado(fecha, hora))

    return { todos: todosSlots, libres: slotsLibres }
  }

  // Toggle un slot
  const handleToggleSlot = (fecha, hora) => {
    // No permitir seleccionar slots ocupados
    if (isSlotOcupado(fecha, hora)) return

    const nuevosSlots = { ...slotsSeleccionados }

    if (!nuevosSlots[fecha]) {
      nuevosSlots[fecha] = []
    }

    const idx = nuevosSlots[fecha].indexOf(hora)
    if (idx >= 0) {
      nuevosSlots[fecha].splice(idx, 1)
      if (nuevosSlots[fecha].length === 0) {
        delete nuevosSlots[fecha]
      }
    } else {
      nuevosSlots[fecha].push(hora)
      nuevosSlots[fecha].sort()
    }

    onChange(nuevosSlots)
  }

  // Seleccionar todos los slots LIBRES de un día
  const handleSelectAllDia = (fecha) => {
    const { libres } = getSlotsParaDia(fecha)
    const nuevosSlots = { ...slotsSeleccionados }
    nuevosSlots[fecha] = [...libres]
    onChange(nuevosSlots)
  }

  // Deseleccionar todos los slots de un día
  const handleDeselectAllDia = (fecha) => {
    const nuevosSlots = { ...slotsSeleccionados }
    delete nuevosSlots[fecha]
    onChange(nuevosSlots)
  }

  // Verificar si un slot está seleccionado
  const isSlotSeleccionado = (fecha, hora) => {
    return slotsSeleccionados[fecha]?.includes(hora) || false
  }

  // Contar slots seleccionados de un día
  const contarSlotsSeleccionados = (fecha) => {
    return slotsSeleccionados[fecha]?.length || 0
  }

  if (fechasVisibles.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        Seleccioná un rango de fechas para ver los horarios disponibles
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Navegación de semanas */}
      {totalSemanas > 1 && (
        <div className="flex items-center justify-between px-2">
          <button
            onClick={() => setSemanaOffset(prev => Math.max(0, prev - 1))}
            disabled={semanaOffset === 0}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600">
            Semana {semanaOffset + 1} de {totalSemanas}
          </span>
          <button
            onClick={() => setSemanaOffset(prev => Math.min(totalSemanas - 1, prev + 1))}
            disabled={semanaOffset >= totalSemanas - 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Leyenda */}
      <div className="flex items-center gap-4 px-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-200 border border-red-300" />
          <span className="text-gray-500">Ocupado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-gray-500">Seleccionado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
          <span className="text-gray-500">Disponible</span>
        </div>
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-2">
        {fechasVisibles.map(fecha => {
          const { todos: slotsDelDia, libres: slotsLibres } = getSlotsParaDia(fecha)
          const haySlots = slotsDelDia.length > 0
          const totalSeleccionados = contarSlotsSeleccionados(fecha)
          const todosLibresSeleccionados = haySlots && slotsLibres.length > 0 && totalSeleccionados === slotsLibres.length

          return (
            <div
              key={fecha}
              className={`border rounded-lg overflow-hidden ${
                haySlots ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
              }`}
            >
              {/* Header del día */}
              <div className={`px-2 py-1.5 text-center border-b ${
                haySlots ? 'bg-blue-50' : 'bg-gray-50'
              }`}>
                <div className="text-xs text-gray-500">{getNombreDia(fecha).slice(0, 3)}</div>
                <div className="font-medium text-sm">{formatFecha(fecha)}</div>
                {haySlots && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    {totalSeleccionados}/{slotsLibres.length} libres
                  </div>
                )}
              </div>

              {/* Contenido */}
              {haySlots ? (
                <div className="p-1">
                  {/* Botones seleccionar todo / nada */}
                  <div className="flex gap-1 mb-1">
                    <button
                      onClick={() => handleSelectAllDia(fecha)}
                      disabled={slotsLibres.length === 0}
                      className={`flex-1 text-xs py-0.5 rounded ${
                        todosLibresSeleccionados
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50'
                      }`}
                    >
                      <Check className="w-3 h-3 mx-auto" />
                    </button>
                    <button
                      onClick={() => handleDeselectAllDia(fecha)}
                      className="flex-1 text-xs py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                    >
                      <X className="w-3 h-3 mx-auto" />
                    </button>
                  </div>

                  {/* Slots */}
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {slotsDelDia.map(hora => {
                      const ocupado = isSlotOcupado(fecha, hora)
                      const seleccionado = isSlotSeleccionado(fecha, hora)

                      return (
                        <button
                          key={hora}
                          onClick={() => handleToggleSlot(fecha, hora)}
                          disabled={ocupado}
                          className={`w-full text-xs py-1 rounded transition-colors ${
                            ocupado
                              ? 'bg-red-100 text-red-400 cursor-not-allowed line-through'
                              : seleccionado
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {hora}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-2 text-center text-xs text-gray-400">
                  No disponible
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Resumen */}
      <div className="flex items-center gap-2 px-2 py-2 bg-gray-50 rounded-lg text-sm">
        <Clock className="w-4 h-4 text-gray-400" />
        <span className="text-gray-600">
          {Object.values(slotsSeleccionados).reduce((acc, arr) => acc + arr.length, 0)} horarios seleccionados
          {Object.keys(slotsSeleccionados).length > 0 && (
            <> en {Object.keys(slotsSeleccionados).length} días</>
          )}
        </span>
      </div>
    </div>
  )
}
