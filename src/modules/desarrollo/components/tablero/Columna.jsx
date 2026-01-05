import { TarjetaIdea } from './TarjetaIdea'
import { getColorClasses, getIcon } from '../../utils/config'

/**
 * Columna del tablero Kanban
 */
export function Columna({ etapa, ideas = [], onClickIdea }) {
  const colors = getColorClasses(etapa.color)
  const IconComponent = getIcon(etapa.icon)

  return (
    <div className="flex flex-col bg-gray-50 rounded-lg min-w-[280px] max-w-[320px] flex-shrink-0">
      {/* Header */}
      <div className={`px-3 py-2 rounded-t-lg border-b ${colors.bg} ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className={`w-4 h-4 ${colors.text}`} />
            <h3 className={`font-semibold text-sm ${colors.text}`}>
              {etapa.nombre}
            </h3>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
            {ideas.length}
          </span>
        </div>
      </div>

      {/* Lista de ideas */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-250px)]">
        {ideas.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No hay ideas
          </div>
        ) : (
          ideas.map(idea => (
            <TarjetaIdea
              key={idea.id}
              idea={idea}
              onClick={onClickIdea}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default Columna
