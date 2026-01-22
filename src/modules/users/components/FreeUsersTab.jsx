import { useState, useEffect, useCallback } from 'react'
import { Users, Search, AlertCircle, RefreshCw, ToggleLeft, ToggleRight, Phone, Mail, Calendar, Tag } from 'lucide-react'
import { getFreeUsers, toggleFreeUserActive } from '../services/userService'

/**
 * Opciones de origen de usuarios
 */
const ORIGEN_OPTIONS = [
  { value: '', label: 'Todos los orígenes' },
  { value: 'recomendacion', label: 'Recomendación' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'google', label: 'Google' },
  { value: 'otros', label: 'Otros' }
]

/**
 * Badge de origen con colores
 */
function OrigenBadge({ origen }) {
  const colores = {
    recomendacion: 'bg-green-100 text-green-700',
    instagram: 'bg-pink-100 text-pink-700',
    tiktok: 'bg-gray-800 text-white',
    google: 'bg-blue-100 text-blue-700',
    otros: 'bg-gray-100 text-gray-700'
  }

  const labels = {
    recomendacion: 'Recomendación',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    google: 'Google',
    otros: 'Otros'
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${colores[origen] || colores.otros}`}>
      <Tag className="w-3 h-3" />
      {labels[origen] || origen}
    </span>
  )
}

/**
 * Formatea fecha a DD/MM/YYYY
 */
function formatearFecha(fecha) {
  if (!fecha) return '-'
  const d = new Date(fecha)
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Pestaña de usuarios free (operador_gastos y operador_gastos_empleado)
 */
export function FreeUsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    origen: '',
    isActive: ''
  })
  const [togglingId, setTogglingId] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const filterParams = {}
      if (filters.search) filterParams.search = filters.search
      if (filters.origen) filterParams.origen = filters.origen
      if (filters.isActive !== '') filterParams.isActive = filters.isActive === 'true'

      const data = await getFreeUsers(filterParams)
      setUsers(data)
    } catch (err) {
      console.error('Error fetching free users:', err)
      setError('Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleToggleActive = async (userId, currentStatus) => {
    setTogglingId(userId)
    try {
      await toggleFreeUserActive(userId, !currentStatus)
      // Actualizar el estado local
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_active: !currentStatus } : u
      ))
    } catch (err) {
      console.error('Error toggling user active:', err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Loading state
  if (loading && users.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-56" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-gray-500">
            {users.length} usuario{users.length !== 1 ? 's' : ''} free registrado{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Filtro por origen */}
          <select
            value={filters.origen}
            onChange={(e) => handleFilterChange('origen', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {ORIGEN_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Filtro por estado */}
          <select
            value={filters.isActive}
            onChange={(e) => handleFilterChange('isActive', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
          <button
            onClick={fetchUsers}
            className="ml-auto px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Lista de usuarios */}
      {users.length === 0 && !loading ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron usuarios free</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <div
              key={user.id}
              className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${
                !user.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-700 font-medium text-sm">
                    {user.nombre?.charAt(0)?.toUpperCase() || '?'}
                    {user.apellido?.charAt(0)?.toUpperCase() || ''}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {user.nombre} {user.apellido}
                    </h3>
                    {!user.is_active && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                        Inactivo
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${
                      user.role?.name === 'operador_gastos'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-violet-100 text-violet-700'
                    }`}>
                      {user.role?.display_name || user.role?.name || 'Sin rol'}
                    </span>
                  </div>

                  {/* Datos de contacto */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {user.email}
                    </span>
                    {user.whatsapp && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {user.whatsapp}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatearFecha(user.created_at)}
                    </span>
                  </div>

                  {/* Origen y detalles */}
                  <div className="flex flex-wrap items-center gap-2">
                    <OrigenBadge origen={user.origen} />
                    {user.origen_detalle && (
                      <span className="text-xs text-gray-400">
                        {user.origen_detalle}
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(user.id, user.is_active)}
                    disabled={togglingId === user.id}
                    className={`p-2 rounded-lg transition-colors ${
                      user.is_active
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                  >
                    {togglingId === user.id ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : user.is_active ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-700">
            <p className="font-medium mb-1">Sobre los usuarios free</p>
            <p>
              Estos usuarios tienen acceso gratuito al módulo de Caja Diaria.
              Los usuarios con rol "Operador Gastos" son dueños de su propia caja,
              mientras que los "Empleados" trabajan en la caja de su dueño.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FreeUsersTab
