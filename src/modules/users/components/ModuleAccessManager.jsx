import { Check, Info } from 'lucide-react'
import { useModules } from '../hooks/useModules'

/**
 * Gestor de acceso a módulos (checkboxes)
 */
export function ModuleAccessManager({
  selectedModules = [],
  defaultModules = [],
  onChange,
  disabled = false
}) {
  const { modules, loading } = useModules()

  const handleToggle = (moduleId) => {
    if (disabled) return

    // Si está en módulos por defecto, no se puede quitar
    if (defaultModules.includes(moduleId)) return

    const newSelection = selectedModules.includes(moduleId)
      ? selectedModules.filter(id => id !== moduleId)
      : [...selectedModules, moduleId]

    onChange(newSelection)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Acceso a módulos
        </label>
        {defaultModules.length > 0 && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Los módulos del rol no se pueden quitar
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {modules.map(module => {
          const isDefault = defaultModules.includes(module.id)
          const isSelected = selectedModules.includes(module.id) || isDefault
          const canToggle = !isDefault && !disabled

          return (
            <button
              key={module.id}
              type="button"
              onClick={() => handleToggle(module.id)}
              disabled={!canToggle}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                isSelected
                  ? isDefault
                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                    : 'border-blue-500 bg-blue-50'
                  : canToggle
                    ? 'border-gray-200 hover:border-gray-300'
                    : 'border-gray-200 opacity-50 cursor-not-allowed'
              }`}
            >
              {/* Checkbox */}
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                isSelected
                  ? isDefault
                    ? 'border-gray-400 bg-gray-400'
                    : 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>

              {/* Info del módulo */}
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm truncate ${
                  isSelected
                    ? isDefault ? 'text-gray-600' : 'text-blue-700'
                    : 'text-gray-900'
                }`}>
                  {module.name}
                </div>
                {module.description && (
                  <div className="text-xs text-gray-500 truncate">
                    {module.description}
                  </div>
                )}
              </div>

              {/* Badge de "Por rol" */}
              {isDefault && (
                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full whitespace-nowrap">
                  Por rol
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ModuleAccessManager
