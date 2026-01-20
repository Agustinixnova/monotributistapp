/**
 * Modal para seleccionar cliente al registrar una cuenta corriente
 */

import { useState, useEffect, useMemo } from 'react'
import { X, Search, UserPlus, User, Phone, AlertTriangle } from 'lucide-react'
import { useClientesFiado } from '../hooks/useClientesFiado'
import { formatearMonto } from '../utils/formatters'
import ModalClienteFiado from './ModalClienteFiado'

export default function ModalSelectorCliente({
  isOpen,
  onClose,
  onSelect,
  montoFiado = 0
}) {
  const { clientes, loading, crear, obtenerDeuda } = useClientesFiado()
  const [busqueda, setBusqueda] = useState('')
  const [modalNuevoCliente, setModalNuevoCliente] = useState(false)
  const [clientesConDeuda, setClientesConDeuda] = useState({})
  const [loadingDeudas, setLoadingDeudas] = useState(false)

  // Cargar deudas de clientes al abrir el modal
  useEffect(() => {
    if (isOpen && clientes.length > 0) {
      const cargarDeudas = async () => {
        setLoadingDeudas(true)
        const deudas = {}
        for (const cliente of clientes) {
          const { deuda } = await obtenerDeuda(cliente.id)
          deudas[cliente.id] = deuda || 0
        }
        setClientesConDeuda(deudas)
        setLoadingDeudas(false)
      }
      cargarDeudas()
    }
  }, [isOpen, clientes, obtenerDeuda])

  // Filtrar clientes por búsqueda
  const clientesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return clientes

    const termino = busqueda.toLowerCase().trim()
    return clientes.filter(cliente => {
      const nombreCompleto = `${cliente.nombre} ${cliente.apellido || ''}`.toLowerCase()
      const telefono = (cliente.telefono || '').toLowerCase()
      return nombreCompleto.includes(termino) || telefono.includes(termino)
    })
  }, [clientes, busqueda])

  // Reset búsqueda al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setBusqueda('')
    }
  }, [isOpen])

  const handleSelectCliente = (cliente) => {
    const deudaActual = clientesConDeuda[cliente.id] || 0
    const deudaNueva = deudaActual + montoFiado
    const superaLimite = cliente.limite_credito && deudaNueva > cliente.limite_credito

    onSelect({
      ...cliente,
      deuda_actual: deudaActual,
      deuda_nueva: deudaNueva,
      supera_limite: superaLimite
    })
  }

  const handleCrearCliente = async (clienteData) => {
    const result = await crear(clienteData)
    if (result.success) {
      setModalNuevoCliente(false)
      // Seleccionar el cliente recién creado
      handleSelectCliente(result.data)
    } else {
      throw new Error(result.error?.message || 'Error al crear cliente')
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="bg-amber-500 px-5 py-4 text-white flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <h3 className="font-heading font-semibold text-lg">Seleccionar Cliente</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Monto a cargar */}
            {montoFiado > 0 && (
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                <p className="text-sm text-amber-800">
                  Monto a cargar: <span className="font-bold">{formatearMonto(montoFiado)}</span>
                </p>
              </div>
            )}

            {/* Búsqueda */}
            <div className="px-5 py-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o teléfono..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Lista de clientes */}
            <div className="flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" />
                </div>
              ) : clientesFiltrados.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {busqueda
                      ? 'No se encontraron clientes'
                      : 'No tenés clientes registrados'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clientesFiltrados.map((cliente) => {
                    const deuda = clientesConDeuda[cliente.id] || 0
                    const deudaNueva = deuda + montoFiado
                    const superaLimite = cliente.limite_credito && deudaNueva > cliente.limite_credito

                    return (
                      <button
                        key={cliente.id}
                        onClick={() => handleSelectCliente(cliente)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                          superaLimite
                            ? 'border-orange-300 bg-orange-50 hover:border-orange-400'
                            : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          superaLimite ? 'bg-orange-100' : 'bg-amber-100'
                        }`}>
                          <span className={`font-medium ${
                            superaLimite ? 'text-orange-600' : 'text-amber-600'
                          }`}>
                            {cliente.nombre?.charAt(0)}{cliente.apellido?.charAt(0) || ''}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {cliente.nombre} {cliente.apellido || ''}
                          </div>
                          {cliente.telefono && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {cliente.telefono}
                            </div>
                          )}
                          {deuda > 0 && (
                            <div className="text-xs text-red-600 font-medium">
                              Deuda: {formatearMonto(deuda)}
                            </div>
                          )}
                        </div>

                        {/* Indicador de límite */}
                        {superaLimite && (
                          <div className="flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer - Botón nuevo cliente */}
            <div className="border-t border-gray-200 px-5 py-4">
              <button
                onClick={() => setModalNuevoCliente(true)}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 rounded-lg transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                Nuevo Cliente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nuevo Cliente */}
      <ModalClienteFiado
        isOpen={modalNuevoCliente}
        onClose={() => setModalNuevoCliente(false)}
        onGuardar={handleCrearCliente}
      />
    </>
  )
}
