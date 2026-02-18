/**
 * Calendario de espacios/salones - Vista Timeline
 * Muestra filas por espacio y columnas por hora
 * Ideal para ver disponibilidad de múltiples espacios de un vistazo
 */

import { useState, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, Plus, Clock, Loader2 } from 'lucide-react'
import { getFechaHoyArgentina, formatFechaCorta, formatDiaSemana } from '../../utils/dateUtils'

// Generar array de horas para el header
function generarHoras(horaInicio, horaFin) {
  const horas = []
  for (let h = horaInicio; h < horaFin; h++) {
    horas.push(`${h.toString().padStart(2, '0')}:00`)
    horas.push(`${h.toString().padStart(2, '0')}:30`)
  }
  return horas
}

// Calcular posición y ancho de un turno
function calcularPosicionTurno(turno, configHoraInicio, configHoraFin) {
  const [horaInicio, minInicio] = turno.hora_inicio.split(':').map(Number)
  const [horaFin, minFin] = turno.hora_fin.split(':').map(Number)

  const minutosDesdeInicio = (horaInicio - configHoraInicio) * 60 + minInicio
  const duracionMinutos = (horaFin - horaInicio) * 60 + (minFin - minInicio)

  const totalMinutos = (configHoraFin - configHoraInicio) * 60

  const left = (minutosDesdeInicio / totalMinutos) * 100
  const width = (duracionMinutos / totalMinutos) * 100

  return { left: `${left}%`, width: `${width}%` }
}

// Obtener color de estado
function getColorEstado(estado) {
  const colores = {
    pendiente: 'bg-amber-100 border-amber-300 text-amber-800',
    confirmado: 'bg-blue-100 border-blue-300 text-blue-800',
    en_curso: 'bg-purple-100 border-purple-300 text-purple-800',
    completado: 'bg-green-100 border-green-300 text-green-800',
    cancelado: 'bg-gray-100 border-gray-300 text-gray-500 opacity-50'
  }
  return colores[estado] || colores.pendiente
}

// Obtener nombre del cliente
function getNombreCliente(turno) {
  if (turno.cliente) {
    return `${turno.cliente.nombre || ''} ${turno.cliente.apellido || ''}`.trim()
  }
  if (turno.cliente_nombre) {
    return turno.cliente_nombre
  }
  return 'Sin cliente'
}

// Obtener servicios del turno
function getServiciosTurno(turno) {
  if (turno.servicios && turno.servicios.length > 0) {
    return turno.servicios.map(s => s.servicio?.nombre || s.nombre || 'Servicio').join(', ')
  }
  return ''
}

export default function CalendarioEspacios({
  fecha,
  onFechaChange,
  espacios = [],
  turnos = [],
  loading = false,
  onTurnoClick,
  onNuevoTurno,
  onTurnoRapido,
  horaInicio = '08:00',
  horaFin = '21:00'
}) {
  const scrollRef = useRef(null)
  const hoy = getFechaHoyArgentina()
  const esHoy = fecha === hoy
  const esPasado = fecha < hoy

  // Parsear horas de config
  const HORA_INICIO = parseInt(horaInicio.split(':')[0], 10)
  const HORA_FIN = parseInt(horaFin.split(':')[0], 10)

  // Generar array de horas basado en config
  const HORAS = useMemo(() => generarHoras(HORA_INICIO, HORA_FIN), [HORA_INICIO, HORA_FIN])

  // Agrupar turnos por espacio
  const turnosPorEspacio = useMemo(() => {
    const agrupados = {}
    espacios.forEach(esp => {
      agrupados[esp.id] = turnos.filter(t => t.espacio_id === esp.id)
    })
    // Turnos sin espacio asignado
    agrupados['sin_asignar'] = turnos.filter(t => !t.espacio_id)
    return agrupados
  }, [turnos, espacios])

  // Navegación de fecha
  const irDiaAnterior = () => {
    const d = new Date(fecha)
    d.setDate(d.getDate() - 1)
    onFechaChange(d.toISOString().split('T')[0])
  }

  const irDiaSiguiente = () => {
    const d = new Date(fecha)
    d.setDate(d.getDate() + 1)
    onFechaChange(d.toISOString().split('T')[0])
  }

  const irHoy = () => {
    onFechaChange(hoy)
  }

  // Click en celda vacía para crear turno
  const handleCeldaClick = (espacioId, hora) => {
    if (esPasado) return
    onNuevoTurno?.(fecha, hora, espacioId)
  }

  // Calcular hora actual para la línea indicadora
  const lineaHoraActual = useMemo(() => {
    if (!esHoy) return null

    const ahora = new Date()
    const horasArg = ahora.getUTCHours() - 3
    const horaActual = horasArg < 0 ? horasArg + 24 : horasArg
    const minutos = ahora.getUTCMinutes()

    if (horaActual < HORA_INICIO || horaActual >= HORA_FIN) return null

    const minutosDesdeInicio = (horaActual - HORA_INICIO) * 60 + minutos
    const totalMinutos = (HORA_FIN - HORA_INICIO) * 60
    const porcentaje = (minutosDesdeInicio / totalMinutos) * 100

    return `${porcentaje}%`
  }, [esHoy, HORA_INICIO, HORA_FIN])

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Header con navegación de fecha */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-indigo-50 to-violet-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={irDiaAnterior}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="text-center min-w-[180px]">
              <p className="text-lg font-semibold text-gray-900">
                {formatDiaSemana(fecha)} {formatFechaCorta(fecha)}
              </p>
              {esHoy && (
                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                  Hoy
                </span>
              )}
            </div>

            <button
              onClick={irDiaSiguiente}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!esHoy && (
              <button
                onClick={irHoy}
                className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Ir a hoy
              </button>
            )}

            <button
              onClick={() => onNuevoTurno?.(fecha)}
              disabled={esPasado}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Nuevo turno
            </button>
          </div>
        </div>
      </div>

      {/* Contenido del calendario */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : espacios.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-gray-500 mb-2">No hay espacios configurados</p>
          <p className="text-sm text-gray-400">
            Andá a Config → Espacios para crear tus salones
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto" ref={scrollRef}>
          <div className="min-w-[800px]">
            {/* Header de horas */}
            <div className="flex border-b bg-gray-50 sticky top-0 z-10">
              {/* Columna de espacios (fija) */}
              <div className="w-32 shrink-0 px-3 py-2 border-r bg-gray-50 font-medium text-sm text-gray-600">
                Espacio
              </div>

              {/* Columnas de horas */}
              <div className="flex-1 relative">
                <div className="flex">
                  {HORAS.filter((_, i) => i % 2 === 0).map(hora => (
                    <div
                      key={hora}
                      className="flex-1 px-1 py-2 text-center text-xs font-medium text-gray-500 border-l border-gray-200"
                      style={{ minWidth: '60px' }}
                    >
                      {hora}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Filas de espacios */}
            {espacios.filter(e => e.activo).map(espacio => (
              <div key={espacio.id} className="flex border-b hover:bg-gray-50/50 transition-colors">
                {/* Nombre del espacio */}
                <div className="w-32 shrink-0 px-3 py-3 border-r bg-white flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: espacio.color || '#6366F1' }}
                  />
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {espacio.nombre}
                  </span>
                </div>

                {/* Área de turnos */}
                <div
                  className="flex-1 relative h-16 cursor-pointer"
                  onClick={(e) => {
                    // Calcular hora clickeada
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const porcentaje = x / rect.width
                    const minutosDesdeInicio = porcentaje * (HORA_FIN - HORA_INICIO) * 60
                    const hora = Math.floor(minutosDesdeInicio / 60) + HORA_INICIO
                    const minutos = Math.floor((minutosDesdeInicio % 60) / 30) * 30
                    const horaStr = `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`
                    handleCeldaClick(espacio.id, horaStr)
                  }}
                >
                  {/* Grid de fondo */}
                  <div className="absolute inset-0 flex">
                    {HORAS.filter((_, i) => i % 2 === 0).map((hora, i) => (
                      <div
                        key={hora}
                        className={`flex-1 border-l ${i % 2 === 0 ? 'border-gray-200' : 'border-gray-100'}`}
                        style={{ minWidth: '60px' }}
                      />
                    ))}
                  </div>

                  {/* Línea de hora actual */}
                  {lineaHoraActual && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                      style={{ left: lineaHoraActual }}
                    >
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                  )}

                  {/* Turnos */}
                  {turnosPorEspacio[espacio.id]?.map(turno => {
                    const pos = calcularPosicionTurno(turno, HORA_INICIO, HORA_FIN)
                    return (
                      <div
                        key={turno.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onTurnoClick?.(turno)
                        }}
                        className={`absolute top-1 bottom-1 rounded-lg border px-2 py-1 overflow-hidden cursor-pointer hover:shadow-md transition-shadow z-10 ${getColorEstado(turno.estado)}`}
                        style={{
                          left: pos.left,
                          width: pos.width,
                          minWidth: '50px'
                        }}
                        title={`${turno.hora_inicio} - ${turno.hora_fin}\n${getNombreCliente(turno)}\n${getServiciosTurno(turno)}`}
                      >
                        <p className="text-xs font-medium truncate">
                          {getNombreCliente(turno)}
                        </p>
                        <p className="text-[10px] opacity-75 truncate">
                          {turno.hora_inicio} - {turno.hora_fin}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Fila para turnos sin espacio asignado */}
            {turnosPorEspacio['sin_asignar']?.length > 0 && (
              <div className="flex border-b bg-amber-50/50">
                <div className="w-32 shrink-0 px-3 py-3 border-r bg-amber-50 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-sm font-medium text-amber-700 truncate">
                    Sin asignar
                  </span>
                </div>

                <div className="flex-1 relative h-16">
                  {/* Grid de fondo */}
                  <div className="absolute inset-0 flex">
                    {HORAS.filter((_, i) => i % 2 === 0).map((hora, i) => (
                      <div
                        key={hora}
                        className={`flex-1 border-l ${i % 2 === 0 ? 'border-amber-200' : 'border-amber-100'}`}
                        style={{ minWidth: '60px' }}
                      />
                    ))}
                  </div>

                  {/* Turnos sin asignar */}
                  {turnosPorEspacio['sin_asignar'].map(turno => {
                    const pos = calcularPosicionTurno(turno, HORA_INICIO, HORA_FIN)
                    return (
                      <div
                        key={turno.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onTurnoClick?.(turno)
                        }}
                        className={`absolute top-1 bottom-1 rounded-lg border-2 border-dashed border-amber-400 bg-amber-100 px-2 py-1 overflow-hidden cursor-pointer hover:shadow-md transition-shadow z-10`}
                        style={{
                          left: pos.left,
                          width: pos.width,
                          minWidth: '50px'
                        }}
                      >
                        <p className="text-xs font-medium text-amber-800 truncate">
                          {getNombreCliente(turno)}
                        </p>
                        <p className="text-[10px] text-amber-600 truncate">
                          ⚠️ Asignar espacio
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leyenda de estados */}
      <div className="px-4 py-2 border-t bg-gray-50 flex items-center gap-4 text-xs overflow-x-auto">
        <span className="text-gray-500 shrink-0">Estados:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-200 border border-amber-300" />
          <span className="text-gray-600">Pendiente</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300" />
          <span className="text-gray-600">Confirmado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-purple-200 border border-purple-300" />
          <span className="text-gray-600">En curso</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-200 border border-green-300" />
          <span className="text-gray-600">Completado</span>
        </div>
      </div>
    </div>
  )
}
