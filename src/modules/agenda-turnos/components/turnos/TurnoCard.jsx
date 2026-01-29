/**
 * Card para mostrar un turno en el calendario
 */

import { Clock, User, MoreVertical, CheckCircle, X, Play, UserX, Store, Car, Video } from 'lucide-react'
import { formatearHora } from '../../utils/formatters'
import { getEstadoConfig, getColorClasses } from '../../utils/formatters'
import { formatDuracion, diferenciaMinutos } from '../../utils/dateUtils'

export default function TurnoCard({
  turno,
  onClick,
  onCambiarEstado,
  compacto = false
}) {
  // Obtener color del primer servicio
  const primerServicio = turno.servicios?.[0]?.servicio
  const colorServicio = primerServicio?.color || '#3B82F6'
  const colorClasses = getColorClasses(colorServicio)

  // Estado del turno
  const estadoConfig = getEstadoConfig(turno.estado)

  // Nombres de servicios
  const serviciosNombres = turno.servicios?.map(s => s.servicio?.nombre).filter(Boolean).join(', ') || 'Sin servicio'

  // Nombre del cliente
  const clienteNombre = turno.cliente
    ? `${turno.cliente.nombre} ${turno.cliente.apellido || ''}`.trim()
    : 'Cliente no asignado'

  // Duración
  const duracion = diferenciaMinutos(turno.hora_inicio, turno.hora_fin)

  // Acciones rápidas de estado
  const accionesRapidas = {
    pendiente: [
      { estado: 'confirmado', icon: CheckCircle, label: 'Confirmar', color: 'text-green-600' }
    ],
    confirmado: [
      { estado: 'en_curso', icon: Play, label: 'Iniciar', color: 'text-blue-600' },
      { estado: 'no_asistio', icon: UserX, label: 'No asistió', color: 'text-red-600' }
    ],
    en_curso: [
      { estado: 'completado', icon: CheckCircle, label: 'Completar', color: 'text-gray-600' }
    ]
  }

  const acciones = accionesRapidas[turno.estado] || []

  // Configuración de modalidad
  const modalidadConfig = {
    local: { icon: Store, label: 'En local', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    domicilio: { icon: Car, label: 'A domicilio', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    videollamada: { icon: Video, label: 'Videollamada', color: 'text-purple-600', bgColor: 'bg-purple-100' }
  }
  const modalidad = modalidadConfig[turno.modalidad] || null
  const ModalidadIcon = modalidad?.icon

  if (compacto) {
    // Versión compacta para vista semanal
    const esCancelado = turno.estado === 'cancelado' || turno.estado === 'no_asistio'
    const esCompletado = turno.estado === 'completado'
    const primerNombreCliente = turno.cliente?.nombre?.split(' ')[0] || 'Cliente'
    // Mostrar todos los servicios separados por +
    const todosServiciosNombres = turno.servicios?.map(s => s.servicio?.nombre).filter(Boolean).join(' + ') || ''

    return (
      <div
        onClick={() => onClick?.(turno)}
        className={`h-full rounded text-[11px] cursor-pointer transition-all hover:shadow-md ${
          esCancelado ? 'opacity-50' : ''
        } ${esCompletado ? 'opacity-70' : ''}`}
        style={{
          backgroundColor: `${colorServicio}20`,
          borderLeft: `3px solid ${colorServicio}`
        }}
        title={`${primerNombreCliente} - ${todosServiciosNombres}`}
      >
        <div className="px-1.5 py-1 h-full flex flex-col justify-start overflow-hidden">
          {/* Línea 1: Hora + Modalidad + Cliente */}
          <div className="flex items-center gap-1 min-w-0 leading-tight">
            <span className="font-bold text-gray-800 flex-shrink-0">
              {formatearHora(turno.hora_inicio)}
            </span>
            {ModalidadIcon && (
              <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${modalidad.bgColor}`}>
                <ModalidadIcon className={`w-2.5 h-2.5 ${modalidad.color}`} />
              </span>
            )}
            <span className="font-medium text-gray-700 truncate">
              {primerNombreCliente}
            </span>
            {(esCancelado || esCompletado) && (
              <span className={`text-[9px] px-1 rounded flex-shrink-0 ${estadoConfig.bgClass} ${estadoConfig.textClass}`}>
                {turno.estado === 'cancelado' ? 'X' : turno.estado === 'no_asistio' ? '!' : '✓'}
              </span>
            )}
          </div>
          {/* Línea 2: Servicios - solo si hay espacio (card > 35px aprox) */}
          {todosServiciosNombres && (
            <p
              className="text-[10px] truncate leading-tight mt-0.5"
              style={{ color: colorServicio }}
            >
              {todosServiciosNombres}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Versión completa para vista diaria
  return (
    <div
      className={`bg-white rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${
        turno.estado === 'cancelado' || turno.estado === 'no_asistio' ? 'opacity-60' : ''
      }`}
      style={{ borderLeftColor: colorServicio }}
      onClick={() => onClick?.(turno)}
    >
      <div className="p-3">
        {/* Header: hora y badges */}
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="font-semibold text-gray-800 whitespace-nowrap">
              {formatearHora(turno.hora_inicio)} - {formatearHora(turno.hora_fin)}
            </span>
            <span className="text-xs text-gray-400 hidden sm:inline">
              ({formatDuracion(duracion)})
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Indicador de modalidad - siempre visible */}
            {ModalidadIcon && (
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-full ${modalidad.bgColor}`}
                title={modalidad.label}
              >
                <ModalidadIcon className={`w-4 h-4 ${modalidad.color}`} />
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${estadoConfig.bgClass} ${estadoConfig.textClass}`}>
              {estadoConfig.label}
            </span>
          </div>
        </div>

        {/* Cliente */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: colorServicio }}
          >
            {turno.cliente?.nombre?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{clienteNombre}</p>
            {turno.cliente?.whatsapp && (
              <p className="text-xs text-gray-500">{turno.cliente.whatsapp}</p>
            )}
          </div>
        </div>

        {/* Servicios */}
        <div className="flex flex-wrap gap-1 mb-2">
          {turno.servicios?.map((s, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${s.servicio?.color || colorServicio}20`,
                color: s.servicio?.color || colorServicio
              }}
            >
              {s.servicio?.nombre}
            </span>
          ))}
        </div>

        {/* Notas */}
        {turno.notas && (
          <p className="text-xs text-gray-500 italic truncate">{turno.notas}</p>
        )}

        {/* Acciones rápidas */}
        {acciones.length > 0 && onCambiarEstado && (
          <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
            {acciones.map(accion => (
              <button
                key={accion.estado}
                onClick={(e) => {
                  e.stopPropagation()
                  onCambiarEstado(turno.id, accion.estado)
                }}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors ${accion.color}`}
              >
                <accion.icon className="w-3 h-3" />
                {accion.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
