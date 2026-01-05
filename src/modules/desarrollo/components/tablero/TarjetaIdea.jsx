import { CheckCircle, Circle } from 'lucide-react'
import { getPrioridad, getColorClasses, getIcon } from '../../utils/config'
import { Avatar } from '../compartidos/Avatar'

/**
 * Tarjeta de idea para el tablero Kanban
 */
export function TarjetaIdea({ idea, onClick }) {
  const prioridad = getPrioridad(idea.prioridad)
  const prioridadColors = getColorClasses(prioridad?.color || 'yellow')
  const PrioridadIcon = getIcon(prioridad?.icon)

  return (
    <div
      onClick={() => onClick?.(idea)}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      {/* Header: Código + Prioridad */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-gray-500">{idea.codigo}</span>
        <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${prioridadColors.bg} ${prioridadColors.text}`}>
          <PrioridadIcon className="w-3 h-3" />
        </span>
      </div>

      {/* Título */}
      <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
        {idea.titulo}
      </h4>

      {/* Indicadores de completitud */}
      <div className="flex items-center gap-2 mb-2">
        {idea.fiscal_listo && (
          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Fiscal
          </span>
        )}
        {idea.ux_listo && (
          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> UX
          </span>
        )}
      </div>

      {/* Creador */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        {idea.creador && (
          <>
            <Avatar
              nombre={idea.creador.nombre}
              apellido={idea.creador.apellido}
              avatarUrl={idea.creador.avatar_url}
              size="sm"
            />
            <span className="text-xs text-gray-500 truncate">
              {idea.creador.nombre} {idea.creador.apellido}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

export default TarjetaIdea
