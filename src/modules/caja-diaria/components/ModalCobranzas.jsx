/**
 * Modal principal de cobranzas - Lista clientes con deuda
 */

import { useState, useEffect } from 'react'
import { X, Search, User, Phone, Banknote, RefreshCw } from 'lucide-react'
import { useCobranzas } from '../hooks/useCobranzas'
import { formatearMonto } from '../utils/formatters'
import ModalDetalleDeuda from './ModalDetalleDeuda'

export default function ModalCobranzas({ isOpen, onClose, metodosPago, onPagoRegistrado }) {
  const { clientesConDeuda, loading, refresh } = useCobranzas()
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('deuda') // 'todos', 'deuda', 'favor'
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)

  // Cargar clientes al abrir
  useEffect(() => {
    if (isOpen) {
      refresh()
      setBusqueda('')
      setFiltro('deuda')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Filtrar clientes por búsqueda y filtro de saldo
  const clientesFiltrados = clientesConDeuda
    .filter(cliente => {
      // Filtro por saldo
      const deuda = parseFloat(cliente.deuda_total || 0)
      if (filtro === 'deuda' && deuda <= 0) return false
      if (filtro === 'favor' && deuda >= 0) return false

      // Filtro por búsqueda
      if (busqueda.trim()) {
        const termino = busqueda.toLowerCase().trim()
        const nombreCompleto = `${cliente.nombre} ${cliente.apellido || ''}`.toLowerCase()
        const telefono = (cliente.telefono || '').toLowerCase()
        return nombreCompleto.includes(termino) || telefono.includes(termino)
      }
      return true
    })
    .sort((a, b) => {
      // Ordenar alfabéticamente
      const nombreA = `${a.nombre} ${a.apellido || ''}`.toLowerCase()
      const nombreB = `${b.nombre} ${b.apellido || ''}`.toLowerCase()
      return nombreA.localeCompare(nombreB)
    })

  // Totales
  const totalDeudas = clientesConDeuda.reduce((sum, c) => {
    const deuda = parseFloat(c.deuda_total || 0)
    return deuda > 0 ? sum + deuda : sum
  }, 0)
  const clientesConDeudaPositiva = clientesConDeuda.filter(c => parseFloat(c.deuda_total || 0) > 0).length
  const clientesConSaldoFavor = clientesConDeuda.filter(c => parseFloat(c.deuda_total || 0) < 0).length

  const handlePagoRegistrado = async () => {
    await refresh()
    if (onPagoRegistrado) {
      onPagoRegistrado()
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
            <div className="bg-emerald-600 px-5 py-4 text-white flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5" />
                <h3 className="font-heading font-semibold text-lg">Cobranzas</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={refresh}
                  className="p-1 hover:bg-white/20 rounded-lg"
                  title="Actualizar"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Resumen total */}
            <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-800">Total a cobrar:</span>
                <span className="text-xl font-bold text-emerald-700">{formatearMonto(totalDeudas)}</span>
              </div>
              <p className="text-xs text-emerald-600 mt-1">
                {clientesConDeuda.length} {clientesConDeuda.length === 1 ? 'cliente' : 'clientes'}
                {clientesConDeudaPositiva > 0 && ` (${clientesConDeudaPositiva} con deuda)`}
              </p>
            </div>

            {/* Filtros */}
            <div className="px-5 py-2 border-b border-gray-200 flex gap-2">
              <button
                onClick={() => setFiltro('deuda')}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  filtro === 'deuda'
                    ? 'bg-red-100 text-red-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Con deuda ({clientesConDeudaPositiva})
              </button>
              <button
                onClick={() => setFiltro('favor')}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  filtro === 'favor'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                A favor ({clientesConSaldoFavor})
              </button>
              <button
                onClick={() => setFiltro('todos')}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  filtro === 'todos'
                    ? 'bg-emerald-100 text-emerald-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
            </div>

            {/* Búsqueda */}
            <div className="px-5 py-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Lista de clientes con deuda */}
            <div className="flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
                </div>
              ) : clientesFiltrados.length === 0 ? (
                <div className="text-center py-8">
                  <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {busqueda
                      ? 'No se encontraron clientes'
                      : filtro === 'deuda'
                        ? 'No hay clientes con deuda'
                        : filtro === 'favor'
                          ? 'No hay clientes con saldo a favor'
                          : 'No hay clientes registrados'}
                  </p>
                  {!busqueda && clientesConDeuda.length === 0 && (
                    <p className="text-sm text-gray-400 mt-1">
                      Agregá clientes desde Configuración → Clientes Cta. Cte.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {clientesFiltrados.map((cliente) => {
                    const deuda = parseFloat(cliente.deuda_total || 0)
                    const tieneDeuda = deuda > 0
                    const tieneSaldoAFavor = deuda < 0
                    return (
                      <button
                        key={cliente.id}
                        onClick={() => setClienteSeleccionado(cliente)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left"
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-600 font-medium">
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
                        </div>

                        {/* Saldo */}
                        <div className="text-right flex-shrink-0">
                          {tieneDeuda ? (
                            <div className="text-lg font-bold text-red-600">
                              {formatearMonto(deuda)}
                            </div>
                          ) : tieneSaldoAFavor ? (
                            <div className="text-sm font-medium text-blue-600">
                              A favor: {formatearMonto(Math.abs(deuda))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">
                              Sin saldo
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-5 py-4">
              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Detalle Deuda */}
      <ModalDetalleDeuda
        isOpen={!!clienteSeleccionado}
        onClose={() => setClienteSeleccionado(null)}
        cliente={clienteSeleccionado}
        metodosPago={metodosPago}
        onPagoRegistrado={handlePagoRegistrado}
      />
    </>
  )
}
