/**
 * Modal para seleccionar proveedor al registrar una factura de compra
 */

import { useState, useEffect, useMemo } from 'react'
import { X, Search, Truck, Plus, Phone } from 'lucide-react'
import { useProveedores } from '../hooks/useProveedores'
import ModalProveedor from './ModalProveedor'

export default function ModalSelectorProveedor({ isOpen, onClose, onSelect }) {
  const { proveedores, loading, crear } = useProveedores()
  const [busqueda, setBusqueda] = useState('')
  const [modalNuevoProveedor, setModalNuevoProveedor] = useState(false)

  // Filtrar proveedores por búsqueda
  const proveedoresFiltrados = useMemo(() => {
    if (!busqueda.trim()) return proveedores

    const termino = busqueda.toLowerCase().trim()
    return proveedores.filter(p => {
      const razon = (p.razon_social || '').toLowerCase()
      const cuit = (p.cuit || '').toLowerCase()
      return razon.includes(termino) || cuit.includes(termino)
    })
  }, [proveedores, busqueda])

  // Reset búsqueda al abrir
  useEffect(() => {
    if (isOpen) {
      setBusqueda('')
    }
  }, [isOpen])

  const handleCrearProveedor = async (proveedorData) => {
    const result = await crear(proveedorData)
    if (result.success) {
      setModalNuevoProveedor(false)
      onSelect(result.data)
    } else {
      throw new Error(result.error?.message || 'Error al crear proveedor')
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
            <div className="bg-sky-600 px-5 py-4 text-white flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <h3 className="font-heading font-semibold text-lg">Seleccionar Proveedor</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
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
                  placeholder="Buscar por nombre o CUIT..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>

            {/* Lista de proveedores */}
            <div className="flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full" />
                </div>
              ) : proveedoresFiltrados.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {busqueda
                      ? 'No se encontraron proveedores'
                      : 'No tenés proveedores registrados'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {proveedoresFiltrados.map((prov) => (
                    <button
                      key={prov.id}
                      onClick={() => onSelect(prov)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-sky-300 hover:bg-sky-50 transition-all text-left"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sky-600 font-medium text-sm">
                          {prov.razon_social?.substring(0, 2).toUpperCase()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {prov.razon_social}
                        </div>
                        {prov.cuit && (
                          <div className="text-xs text-gray-500">
                            CUIT: {prov.cuit}
                          </div>
                        )}
                        {prov.telefono && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {prov.telefono}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Botón nuevo proveedor */}
            <div className="border-t border-gray-200 px-5 py-4">
              <button
                onClick={() => setModalNuevoProveedor(true)}
                className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nuevo Proveedor
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nuevo Proveedor */}
      <ModalProveedor
        isOpen={modalNuevoProveedor}
        onClose={() => setModalNuevoProveedor(false)}
        onGuardar={handleCrearProveedor}
      />
    </>
  )
}
