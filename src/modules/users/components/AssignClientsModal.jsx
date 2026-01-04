import { useState, useEffect } from 'react'
import { X, Users, ChevronDown, Save } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import ClientSelector from './ClientSelector'

/**
 * Modal para asignar clientes masivamente a un contador
 */
export function AssignClientsModal({ onClose, onSuccess }) {
  const [counters, setCounters] = useState([])
  const [selectedCounter, setSelectedCounter] = useState('')
  const [selectedClients, setSelectedClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingCounters, setLoadingCounters] = useState(true)
  const [error, setError] = useState(null)

  // Cargar contadores disponibles
  useEffect(() => {
    async function loadCounters() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id, nombre, apellido, email,
            role:roles!inner(name, display_name)
          `)
          .in('role.name', ['admin', 'contadora_principal', 'contador_secundario'])
          .eq('is_active', true)
          .order('nombre')

        if (error) throw error
        setCounters(data || [])
      } catch (err) {
        console.error('Error loading counters:', err)
        setError('Error al cargar contadores')
      } finally {
        setLoadingCounters(false)
      }
    }
    loadCounters()
  }, [])

  const handleSubmit = async () => {
    if (!selectedCounter || selectedClients.length === 0) return

    setLoading(true)
    setError(null)

    try {
      // Actualizar todos los clientes seleccionados
      const { error } = await supabase
        .from('profiles')
        .update({ assigned_to: selectedCounter })
        .in('id', selectedClients)

      if (error) throw error

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Error assigning clients:', err)
      setError('Error al asignar clientes: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedCounterData = counters.find(c => c.id === selectedCounter)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Asignar Clientes</h2>
              <p className="text-sm text-gray-500">Asigna clientes a un contador</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Selector de contador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Contador
            </label>
            {loadingCounters ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedCounter}
                  onChange={(e) => {
                    setSelectedCounter(e.target.value)
                    setSelectedClients([]) // Reset clientes al cambiar contador
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar contador...</option>
                  {counters.map(counter => (
                    <option key={counter.id} value={counter.id}>
                      {counter.nombre} {counter.apellido} - {counter.role?.display_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Info del contador seleccionado */}
          {selectedCounterData && (
            <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
              <p className="text-sm text-purple-800">
                <span className="font-medium">Contador seleccionado:</span>{' '}
                {selectedCounterData.nombre} {selectedCounterData.apellido}
              </p>
              <p className="text-sm text-purple-600">{selectedCounterData.email}</p>
            </div>
          )}

          {/* Selector de clientes */}
          {selectedCounter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar y Seleccionar Clientes
              </label>
              <ClientSelector
                selectedClients={selectedClients}
                onChange={setSelectedClients}
                excludeAssignedTo={selectedCounter}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedCounter || selectedClients.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Asignar {selectedClients.length > 0 && `(${selectedClients.length})`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssignClientsModal
