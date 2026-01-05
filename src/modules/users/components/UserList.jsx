import { User, Mail, Phone, Building2, UserCheck, UserX, Edit, Eye, CreditCard, FileText } from 'lucide-react'
import { formatFullName, formatCUIT, formatPhone, formatDateTime, formatDate } from '../utils/formatters'
import { getRoleBadgeColor } from '../../../utils/roleColors'
import UserCard from './UserCard'

/**
 * Lista de usuarios - Tabla en desktop, Cards en mobile
 */
export function UserList({ users, loading, onEdit, onToggleActive, onViewDetails, onUploadInvoice }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No se encontraron usuarios</p>
      </div>
    )
  }

  return (
    <>
      {/* Vista Mobile - Cards */}
      <div className="md:hidden space-y-4">
        {users.map(user => (
          <UserCard
            key={user.id}
            user={user}
            onEdit={onEdit}
            onToggleActive={onToggleActive}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>

      {/* Vista Desktop - Tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CUIT
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contador
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vigencia Hasta
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Creado
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className={`hover:bg-gray-50 ${!user.is_active ? 'opacity-60' : ''}`}>
                {/* Usuario */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={formatFullName(user)}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatFullName(user)}
                      </div>
                      {user.dni && (
                        <div className="text-sm text-gray-500">
                          DNI: {user.dni}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Contacto */}
                <td className="px-4 py-4">
                  <div className="text-sm">
                    <div className="flex items-center gap-1 text-gray-900">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </div>
                    {user.telefono && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <Phone className="w-3 h-3" />
                        {formatPhone(user.telefono)}
                      </div>
                    )}
                  </div>
                </td>

                {/* Rol */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(user.role?.name)}`}>
                    {user.role?.display_name}
                  </span>
                </td>

                {/* CUIT */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.fiscal_data?.cuit ? (
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {formatCUIT(user.fiscal_data.cuit)}
                    </div>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>

                {/* Contador Asignado */}
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {user.assigned_counter ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <User className="w-3 h-3 text-purple-600" />
                      </div>
                      <span className="text-gray-900">
                        {user.assigned_counter.nombre} {user.assigned_counter.apellido}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-300">Sin asignar</span>
                  )}
                </td>

                {/* Vigencia Hasta */}
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {(() => {
                    // Get the most recent subscription (by ends_at) - handles renewals correctly
                    const activeSub = user.subscription
                      ?.filter(s => s.status === 'active' || s.status === 'grace_period' || s.status === 'pending_payment')
                      ?.sort((a, b) => new Date(b.ends_at) - new Date(a.ends_at))[0]
                    if (!activeSub) {
                      return <span className="text-gray-300">-</span>
                    }
                    const isGrace = activeSub.status === 'grace_period'
                    const endsAt = new Date(activeSub.ends_at)
                    const now = new Date()
                    const daysLeft = Math.ceil((endsAt - now) / (1000 * 60 * 60 * 24))
                    const isExpiringSoon = daysLeft <= 7 && daysLeft > 0

                    return (
                      <div className="space-y-1">
                        {/* Fecha de vencimiento */}
                        <div className={`font-medium ${
                          isGrace
                            ? 'text-red-600'
                            : isExpiringSoon
                              ? 'text-orange-600'
                              : 'text-gray-900'
                        }`}>
                          {formatDate(activeSub.ends_at)}
                          {isGrace && <span className="ml-1 text-xs">(Gracia)</span>}
                        </div>

                        {/* Badge de facturación */}
                        {activeSub.has_invoice ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            Facturado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                            Sin factura
                          </span>
                        )}
                      </div>
                    )
                  })()}
                </td>

                {/* Estado */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                    user.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {user.is_active ? (
                      <>
                        <UserCheck className="w-3 h-3" />
                        Activo
                      </>
                    ) : (
                      <>
                        <UserX className="w-3 h-3" />
                        Inactivo
                      </>
                    )}
                  </span>
                </td>

                {/* Creado */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateTime(user.created_at)}
                </td>

                {/* Acciones */}
                <td className="px-4 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onViewDetails?.(user)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit?.(user)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {onUploadInvoice && (
                      <button
                        onClick={() => onUploadInvoice(user)}
                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Cargar factura"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onToggleActive?.(user.id, !user.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        user.is_active
                          ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                          : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                      }`}
                      title={user.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {user.is_active ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default UserList
