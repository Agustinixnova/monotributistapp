import { Check } from 'lucide-react'
import { useRoles } from '../hooks/useRoles'

/**
 * Selector de rol con descripción de cada uno
 */
export function RoleSelector({ value, onChange, error }) {
  const { roles, loading } = useRoles()

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Rol del usuario *
      </label>

      <div className="space-y-2">
        {roles.map(role => (
          <button
            key={role.id}
            type="button"
            onClick={() => onChange(role.id)}
            className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-colors ${
              value === role.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Checkbox visual */}
            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              value === role.id
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
            }`}>
              {value === role.id && (
                <Check className="w-3 h-3 text-white" />
              )}
            </div>

            {/* Contenido */}
            <div className="flex-1">
              <div className={`font-medium ${value === role.id ? 'text-blue-700' : 'text-gray-900'}`}>
                {role.display_name}
              </div>
              {role.description && (
                <div className="text-sm text-gray-500 mt-0.5">
                  {role.description}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}

export default RoleSelector
