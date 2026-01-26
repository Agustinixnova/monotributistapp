/**
 * Card para mostrar un turno en el calendario
 */

import { Clock, User, MoreVertical, CheckCircle, X, Play, UserX } from 'lucide-react'
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

  if (compacto) {
    // Versión compacta para vista semanal - máximo 2 líneas
    const esCancelado = turno.estado === 'cancelado' || turno.estado === 'no_asistio'
    const esCompletado = turno.estado === 'completado'
    const primerNombreCliente = turno.cliente?.nombre?.split(' ')[0] || 'Cliente'
    const primerServicio = turno.servicios?.[0]?.servicio?.nombre || ''
    // Acortar servicio si es muy largo
    const servicioCorto = primerServicio.length > 12 ? primerServicio.slice(0, 10) + '..' : primerServicio

    return (
      <div
        onClick={() => onClick?.(turno)}
        className={`h-full rounded text-[11px] cursor-pointer transition-all hover:shadow-md overflow-hidden ${
          esCancelado ? 'opacity-50' : ''
        } ${esCompletado ? 'opacity-70' : ''}`}
        style={{
          backgroundColor: `${colorServicio}20`,
          borderLeft: `3px solid ${colorServicio}`
        }}
      >
        <div className="px-1.5 py-0.5 h-full flex flex-col justify-center overflow-hidden">
          {/* Línea 1: Hora + Cliente */}
          <div className="flex items-center gap-1 truncate">
            <span className="font-bold text-gray-800 flex-shrink-0">
              {formatearHora(turno.hora_inicio)}
            </span>
            <span className="font-medium text-gray-700 truncate">
              {primerNombreCliente}
            </span>
            {(esCancelado || esCompletado) && (
              <span className={`text-[9px] px-1 rounded flex-shrink-0 ${estadoConfig.bgClass} ${estadoConfig.textClass}`}>
                {turno.estado === 'cancelado' ? 'X' : turno.estado === 'no_asistio' ? '!' : '✓'}
              </span>
            )}
          </div>
          {/* Línea 2: Servicio (solo si hay espacio) */}
          {servicioCorto && (
            <p
              className="text-[10px] truncate leading-tight opacity-80"
              style={{ color: colorServicio }}
            >
              {servicioCorto}
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
        {/* Header: hora y estado */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-gray-800">
              {formatearHora(turno.hora_inicio)} - {formatearHora(turno.hora_fin)}
            </span>
            <span className="text-xs text-gray-400">
              ({formatDuracion(duracion)})
            </span>
          </div>

          <span className={`text-xs px-2 py-0.5 rounded-full ${estadoConfig.bgClass} ${estadoConfig.textClass}`}>
            {estadoConfig.label}
          </span>
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
