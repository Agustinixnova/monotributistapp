import { useState, useEffect } from 'react'
import { Search, X, User, Building2, Check, UserPlus } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { formatCUIT } from '../utils/formatters'

/**
 * Componente para buscar y seleccionar clientes (monotributistas/RI)
 * @param {Array} selectedClients - IDs de clientes ya seleccionados
 * @param {Function} onChange - Callback cuando cambia la selección
 * @param {string} excludeAssignedTo - Excluir clientes ya asignados a este contador (opcional)
 */
export function ClientSelector({ selectedClients = [], onChange, excludeAssignedTo = null }) {
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState([])

  // Cargar clientes seleccionados al inicio
  useEffect(() => {
    if (selectedClients.length > 0) {
      loadSelectedClients()
    }
  }, [])

  const loadSelectedClients = async () => {
    const { data } = await supabase
      .from('profiles')
      .select(`
        id, nombre, apellido, email,
        fiscal_data:client_fiscal_data(cuit, razon_social)
      `)
      .in('id', selectedClients)

    if (data) {
      setClients(data)
    }
  }

  // Buscar clientes
  const handleSearch = async (value) => {
    setSearch(value)

    if (value.length < 2) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      // Buscar por nombre, apellido, email o DNI
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, nombre, apellido, email, dni, assigned_to,
          role:roles(name),
          fiscal_data:client_fiscal_data(cuit, razon_social)
        `)
        .eq('is_active', true)
        .or(`nombre.ilike.%${value}%,apellido.ilike.%${value}%,email.ilike.%${value}%,dni.ilike.%${value}%`)
        .limit(20)

      if (error) throw error

      // Filtrar solo clientes (monotributista o responsable_inscripto)
      let results = (data || []).filter(profile =>
        profile.role?.name === 'monotributista' ||
        profile.role?.name === 'responsable_inscripto'
      )

      // Si parece un CUIT (números), buscar también por CUIT
      const cleanValue = value.replace(/-/g, '')
      if (/^\d+$/.test(cleanValue)) {
        const { data: cuitData } = await supabase
          .from('client_fiscal_data')
          .select(`
            cuit, razon_social,
            profile:profiles!inner(
              id, nombre, apellido, email, dni, assigned_to,
              role:roles!inner(name)
            )
          `)
          .eq('profile.is_active', true)
          .ilike('cuit', `%${cleanValue}%`)
          .limit(10)

        if (cuitData) {
          // Transformar y combinar resultados sin duplicados
          const existingIds = new Set(results.map(r => r.id))
          cuitData.forEach(fd => {
            const profile = fd.profile
            if (profile &&
                !existingIds.has(profile.id) &&
                (profile.role?.name === 'monotributista' || profile.role?.name === 'responsable_inscripto')) {
              results.push({
                ...profile,
                fiscal_data: { cuit: fd.cuit, razon_social: fd.razon_social }
              })
            }
          })
        }
      }

      // Excluir los ya seleccionados
      results = results.filter(r => !selectedClients.includes(r.id))

      // Opcionalmente excluir los ya asignados al contador seleccionado
      if (excludeAssignedTo) {
        results = results.filter(r => r.assigned_to !== excludeAssignedTo)
      }

      setSearchResults(results)
    } catch (err) {
      console.error('Error searching clients:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (client) => {
    const newClients = [...clients, client]
    setClients(newClients)
    onChange(newClients.map(c => c.id))
    setSearch('')
    setSearchResults([])
  }

  const handleRemove = (clientId) => {
    const newClients = clients.filter(c => c.id !== clientId)
    setClients(newClients)
    onChange(newClients.map(c => c.id))
  }

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por nombre, DNI, CUIT o razón social..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {searchResults.map(client => (
              <button
                key={client.id}
                type="button"
                onClick={() => handleSelect(client)}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 border-b last:border-b-0"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {client.nombre} {client.apellido}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    {client.fiscal_data?.cuit && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {formatCUIT(client.fiscal_data.cuit)}
                      </span>
                    )}
                    {client.fiscal_data?.razon_social && (
                      <span className="truncate">• {client.fiscal_data.razon_social}</span>
                    )}
                  </div>
                </div>
                <UserPlus className="w-5 h-5 text-blue-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {search.length >= 2 && !loading && searchResults.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
            No se encontraron clientes
          </div>
        )}
      </div>

      {/* Clientes seleccionados */}
      {clients.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Clientes seleccionados ({clients.length})
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {clients.map(client => (
              <div
                key={client.id}
                className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {client.nombre} {client.apellido}
                  </p>
                  {client.fiscal_data?.cuit && (
                    <p className="text-sm text-gray-500">
                      CUIT: {formatCUIT(client.fiscal_data.cuit)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(client.id)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay seleccionados */}
      {clients.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Busca y selecciona los clientes que deseas asignar
        </p>
      )}
    </div>
  )
}

export default ClientSelector
