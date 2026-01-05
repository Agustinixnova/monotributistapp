import { getTipoReporte, getEstadoReporte, getColorClasses, getIcon } from '../../utils/config'
import { Avatar } from '../compartidos/Avatar'
import { MessageSquare, Clock, MapPin } from 'lucide-react'

/**
 * Tarjeta de reporte para la lista
 */
export function TarjetaReporte({ reporte, onClick }) {
  const tipo = getTipoReporte(reporte.tipo)
  const estado = getEstadoReporte(reporte.estado)
  const tipoColors = getColorClasses(tipo?.color || 'gray')
  const estadoColors = getColorClasses(estado?.color || 'gray')
  const TipoIcon = getIcon(tipo?.icon)
  const EstadoIcon = getIcon(estado?.icon)

  // Formatear fecha y hora en UTC-3 (Argentina)
  const fechaCreacion = new Date(reporte.fecha_creacion).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires'
  })

  // Nombre completo del reportador
  const nombreReportador = reporte.reportador
    ? `${reporte.reportador.nombre || ''} ${reporte.reportador.apellido || ''}`.trim()
    : null

  return (
    <div
      onClick={() => onClick?.(reporte)}
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      {/* Header: Ubicación */}
      {reporte.submodulo && (
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800 mb-2">
          <MapPin className="w-4 h-4 text-violet-500" />
          {reporte.submodulo}
        </div>
      )}

      {/* Tipo + Estado */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${tipoColors.bg} ${tipoColors.text}`}>
          <TipoIcon className="w-3 h-3" /> {tipo?.nombre}
        </span>
        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${estadoColors.bg} ${estadoColors.text}`}>
          <EstadoIcon className="w-3 h-3" /> {estado?.nombre}
        </span>
      </div>

      {/* Descripción */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {reporte.descripcion}
      </p>

      {/* Footer: Reportador + Fecha */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {nombreReportador ? (
            <>
              <Avatar
                nombre={reporte.reportador?.nombre}
                apellido={reporte.reportador?.apellido}
                avatarUrl={reporte.reportador?.avatar_url}
                size="sm"
              />
              <span className="text-gray-700 font-medium">{nombreReportador}</span>
            </>
          ) : (
            <span className="text-gray-400">Sin asignar</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {reporte.mensajes_count > 0 && (
            <span className="flex items-center gap-1 text-gray-400">
              <MessageSquare className="w-3 h-3" />
              {reporte.mensajes_count}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {fechaCreacion}
          </span>
        </div>
      </div>
    </div>
  )
}

export default TarjetaReporte
