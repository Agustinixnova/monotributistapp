import { useState, useEffect } from 'react'
import { X, User, Check, Search } from 'lucide-react'
import { getAvailableCounters } from '../services/userService'
import { formatFullName } from '../utils/formatters'

/**
 * Modal para asignar/cambiar contador
 */
export function AssignCounterModal({ user, onAssign, onCancel, loading }) {
  const [counters, setCounters] = useState([])
  const [loadingCounters, setLoadingCounters] = useState(true)
  const [selectedCounter, setSelectedCounter] = useState(user?.assigned_to || null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadCounters() {
      try {
        setLoadingCounters(true)
        const data = await getAvailableCounters()
        setCounters(data)
      } catch (err) {
        console.error('Error loading counters:', err)
      } finally {
        setLoadingCounters(false)
      }
    }
    loadCounters()
  }, [])

  const filteredCounters = counters.filter(counter => {
    if (!search) return true
    const fullName = `${counter.nombre} ${counter.apellido}`.toLowerCase()
    return fullName.includes(search.toLowerCase()) || counter.email.toLowerCase().includes(search.toLowerCase())
  })

  const handleSubmit = () => {
    onAssign(selectedCounter)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Asignar Contador</h2>
            {user && (
              <p className="text-sm text-gray-500">
                Para: {formatFullName(user)}
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Búsqueda */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar contador..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lista de contadores */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingCounters ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredCounters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron contadores
            </div>
          ) : (
            <div className="space-y-2">
              {/* Opción de sin asignar */}
              <button
                onClick={() => setSelectedCounter(null)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                  selectedCounter === null
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedCounter === null ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {selectedCounter === null && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-500">Sin asignar</div>
                </div>
              </button>

              {/* Lista de contadores */}
              {filteredCounters.map(counter => (
                <button
                  key={counter.id}
                  onClick={() => setSelectedCounter(counter.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                    selectedCounter === counter.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedCounter === counter.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {selectedCounter === counter.id && <Check className="w-3 h-3 text-white" />}
                  </div>

                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">
                      {counter.nombre} {counter.apellido}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {counter.email}
                    </div>
                  </div>

                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {counter.role?.name === 'contadora_principal' ? 'Principal' : 'Secundario'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Asignar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssignCounterModal
