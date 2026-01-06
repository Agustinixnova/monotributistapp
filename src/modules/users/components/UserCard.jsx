import { User, Phone, Mail, Building2, MoreVertical, UserCheck, UserX, Key } from 'lucide-react'
import { formatFullName, formatCUIT, formatPhone } from '../utils/formatters'
import { getRoleBadgeColor } from '../../../utils/roleColors'

/**
 * Card de usuario para vista mobile
 */
export function UserCard({ user, onEdit, onToggleActive, onViewDetails, onResetPassword }) {
  const isActive = user.is_active

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${!isActive ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={formatFullName(user)}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-blue-600" />
            )}
          </div>

          {/* Nombre y rol */}
          <div>
            <h3 className="font-medium text-gray-900">
              {formatFullName(user)}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role?.name)}`}>
              {user.role?.display_name}
            </span>
          </div>
        </div>

        {/* Menú de acciones */}
        <button
          onClick={() => onViewDetails?.(user)}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <MoreVertical className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Info de contacto */}
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          <span className="truncate">{user.email}</span>
        </div>

        {user.telefono && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{formatPhone(user.telefono)}</span>
          </div>
        )}

        {user.fiscal_data?.cuit && (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>{formatCUIT(user.fiscal_data.cuit)}</span>
          </div>
        )}
      </div>

      {/* Contador asignado (si aplica) */}
      {user.assigned_counter && (
        <div className="mt-3 pt-3 border-t text-sm">
          <span className="text-gray-500">Asignado a: </span>
          <span className="font-medium">
            {formatFullName(user.assigned_counter)}
          </span>
        </div>
      )}

      {/* Acciones */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onEdit?.(user)}
          className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          Editar
        </button>
        <button
          onClick={() => onResetPassword?.(user)}
          className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
          title="Resetear contraseña"
        >
          <Key className="w-4 h-4" />
        </button>
        <button
          onClick={() => onToggleActive?.(user.id, !isActive)}
          className={`flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
            isActive
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
        >
          {isActive ? (
            <>
              <UserX className="w-4 h-4" />
              <span>Desactivar</span>
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4" />
              <span>Activar</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default UserCard
