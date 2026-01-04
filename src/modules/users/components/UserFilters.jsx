import { useState } from 'react'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { useRoles } from '../hooks/useRoles'

/**
 * Filtros para la lista de usuarios
 */
export function UserFilters({ filters, onFilterChange, counters = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const { roles } = useRoles()

  const handleSearchChange = (e) => {
    onFilterChange({ search: e.target.value })
  }

  const handleRoleChange = (e) => {
    onFilterChange({ roleId: e.target.value || undefined })
  }

  const handleStatusChange = (e) => {
    const value = e.target.value
    onFilterChange({
      isActive: value === '' ? undefined : value === 'true'
    })
  }

  const handleCounterChange = (e) => {
    onFilterChange({ assignedTo: e.target.value || undefined })
  }

  const clearFilters = () => {
    onFilterChange({
      search: '',
      roleId: undefined,
      isActive: undefined,
      assignedTo: undefined
    })
  }

  const hasActiveFilters = filters.roleId || filters.isActive !== undefined || filters.assignedTo

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Botón de filtros (mobile) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`md:hidden flex items-center gap-2 px-4 py-2 border rounded-lg ${
            hasActiveFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : ''
          }`}
        >
          <Filter className="w-5 h-5" />
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Filtros (desktop siempre visible, mobile toggle) */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:block`}>
        <div className="flex flex-col md:flex-row gap-3">
          {/* Filtro por rol */}
          <div className="relative flex-1">
            <select
              value={filters.roleId || ''}
              onChange={handleRoleChange}
              className="w-full px-4 py-2 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.display_name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          {/* Filtro por estado */}
          <div className="relative flex-1">
            <select
              value={filters.isActive === undefined ? '' : filters.isActive.toString()}
              onChange={handleStatusChange}
              className="w-full px-4 py-2 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          {/* Filtro por contador asignado */}
          {counters.length > 0 && (
            <div className="relative flex-1">
              <select
                value={filters.assignedTo || ''}
                onChange={handleCounterChange}
                className="w-full px-4 py-2 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los contadores</option>
                {counters.map(counter => (
                  <option key={counter.id} value={counter.id}>
                    {counter.nombre} {counter.apellido}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Botón limpiar filtros */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserFilters
