import { Shield, Edit, Trash2, Lock, Users } from 'lucide-react'
import { getRoleIconColor } from '../../../utils/roleColors'

/**
 * Lista de roles
 */
export function RoleList({ roles, loading, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!roles || roles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No hay roles configurados</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {roles.map(role => (
        <div
          key={role.id}
          className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRoleIconColor(role.name)}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{role.display_name}</h3>
                <code className="text-xs text-gray-500">{role.name}</code>
              </div>
            </div>

            {role.is_system && (
              <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                <Lock className="w-3 h-3" />
                Sistema
              </span>
            )}
          </div>

          {/* Descripción */}
          {role.description && (
            <p className="text-sm text-gray-600 mb-4">{role.description}</p>
          )}

          {/* Módulos asignados */}
          {role.default_modules && role.default_modules.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                <Users className="w-3 h-3" />
                {role.default_modules.length} módulos asignados
              </div>
              <div className="flex flex-wrap gap-1">
                {role.default_modules.slice(0, 3).map(dm => (
                  <span
                    key={dm.module_id}
                    className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                  >
                    {dm.module?.name}
                  </span>
                ))}
                {role.default_modules.length > 3 && (
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                    +{role.default_modules.length - 3} más
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2 pt-3 border-t">
            <button
              onClick={() => onEdit?.(role)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>

            {!role.is_system && (
              <button
                onClick={() => onDelete?.(role.id)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default RoleList
