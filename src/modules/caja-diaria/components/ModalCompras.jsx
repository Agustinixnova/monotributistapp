/**
 * Modal principal de Compras - Hub para proveedores y facturas de compra
 */

import { useState, useEffect, useMemo } from 'react'
import { X, Search, ShoppingBag, RefreshCw, Truck, Plus, FileText, Phone, Trash2, Edit2, ChevronRight, ChevronDown } from 'lucide-react'
import { useProveedores } from '../hooks/useProveedores'
import { useFacturasCompra } from '../hooks/useFacturasCompra'
import { formatearMonto } from '../utils/formatters'
import { getFechaHoyArgentina } from '../utils/dateUtils'
import ModalProveedor from './ModalProveedor'
import ModalRegistrarFactura from './ModalRegistrarFactura'
import ModalConfirmacion from './ModalConfirmacion'

export default function ModalCompras({
  isOpen,
  onClose,
  metodosPago = [],
  onFacturaConEgreso
}) {
  const { proveedores, loading: loadingProv, refresh: refreshProv, crear, actualizar, eliminar } = useProveedores()
  const { facturas: facturasRecientes, loading: loadingFact, refresh: refreshFact, crear: crearFactura, crearConEgreso, eliminar: eliminarFactura } = useFacturasCompra()

  const [tab, setTab] = useState('proveedores') // 'proveedores' | 'facturas'
  const [busqueda, setBusqueda] = useState('')
  const [proveedorExpandido, setProveedorExpandido] = useState(null)

  // Modales
  const [modalProveedor, setModalProveedor] = useState({ isOpen: false, proveedor: null })
  const [modalFactura, setModalFactura] = useState(false)
  const [confirmEliminar, setConfirmEliminar] = useState({ isOpen: false, tipo: null, id: null, nombre: '' })
  const [procesando, setProcesando] = useState(false)

  const loading = loadingProv || loadingFact

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen) {
      refreshProv()
      refreshFact()
      setBusqueda('')
      setTab('proveedores')
      setProveedorExpandido(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Filtrar proveedores
  const proveedoresFiltrados = useMemo(() => {
    if (!busqueda.trim()) return proveedores
    const termino = busqueda.toLowerCase().trim()
    return proveedores.filter(p => {
      const razon = (p.razon_social || '').toLowerCase()
      const cuit = (p.cuit || '').toLowerCase()
      return razon.includes(termino) || cuit.includes(termino)
    })
  }, [proveedores, busqueda])

  // Filtrar facturas recientes
  const facturasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return facturasRecientes
    const termino = busqueda.toLowerCase().trim()
    return facturasRecientes.filter(f => {
      const provNombre = (f.proveedor?.razon_social || '').toLowerCase()
      const numFact = (f.numero_factura || '').toLowerCase()
      const desc = (f.descripcion || '').toLowerCase()
      return provNombre.includes(termino) || numFact.includes(termino) || desc.includes(termino)
    })
  }, [facturasRecientes, busqueda])

  // Resumen del mes
  const hoy = getFechaHoyArgentina()
  const inicioMes = hoy.substring(0, 8) + '01'
  const facturasDelMes = facturasRecientes.filter(f => f.fecha_factura >= inicioMes)
  const totalMes = facturasDelMes.reduce((sum, f) => sum + parseFloat(f.monto_total || 0), 0)

  // Handlers
  const handleGuardarProveedor = async (data) => {
    if (modalProveedor.proveedor) {
      const result = await actualizar(modalProveedor.proveedor.id, data)
      if (!result.success) throw new Error(result.error?.message || 'Error al actualizar')
    } else {
      const result = await crear(data)
      if (!result.success) throw new Error(result.error?.message || 'Error al crear')
    }
  }

  const handleGuardarFactura = async (facturaData, conEgreso) => {
    let result
    if (conEgreso) {
      result = await crearConEgreso(facturaData)
    } else {
      result = await crearFactura(facturaData)
    }

    if (!result.success) {
      throw new Error(result.error?.message || 'Error al guardar factura')
    }

    // Refresh
    await refreshFact()
    if (conEgreso && onFacturaConEgreso) {
      onFacturaConEgreso()
    }
  }

  const handleConfirmEliminar = async () => {
    setProcesando(true)
    if (confirmEliminar.tipo === 'proveedor') {
      await eliminar(confirmEliminar.id)
    } else if (confirmEliminar.tipo === 'factura') {
      await eliminarFactura(confirmEliminar.id)
    }
    setProcesando(false)
    setConfirmEliminar({ isOpen: false, tipo: null, id: null, nombre: '' })
  }

  const refresh = () => {
    refreshProv()
    refreshFact()
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
                <ShoppingBag className="w-5 h-5" />
                <h3 className="font-heading font-semibold text-lg">Compras</h3>
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

            {/* Resumen del mes */}
            <div className="px-5 py-3 bg-sky-50 border-b border-sky-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-sky-800">Compras del mes:</span>
                <span className="text-xl font-bold text-sky-700">{formatearMonto(totalMes)}</span>
              </div>
              <p className="text-xs text-sky-600 mt-1">
                {facturasDelMes.length} {facturasDelMes.length === 1 ? 'factura' : 'facturas'} |
                {' '}{proveedores.length} {proveedores.length === 1 ? 'proveedor' : 'proveedores'}
              </p>
            </div>

            {/* Tabs */}
            <div className="px-5 py-2 border-b border-gray-200 flex gap-2">
              <button
                onClick={() => setTab('proveedores')}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  tab === 'proveedores'
                    ? 'bg-sky-100 text-sky-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Proveedores ({proveedores.length})
              </button>
              <button
                onClick={() => setTab('facturas')}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  tab === 'facturas'
                    ? 'bg-sky-100 text-sky-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Facturas recientes
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
                  placeholder={tab === 'proveedores' ? 'Buscar por nombre o CUIT...' : 'Buscar factura...'}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full" />
                </div>
              ) : tab === 'proveedores' ? (
                // TAB PROVEEDORES
                proveedoresFiltrados.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {busqueda ? 'No se encontraron proveedores' : 'No tenés proveedores registrados'}
                    </p>
                    {!busqueda && (
                      <p className="text-sm text-gray-400 mt-1">
                        Agregá tu primer proveedor con el botón de abajo
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {proveedoresFiltrados.map((prov) => {
                      const expandido = proveedorExpandido === prov.id
                      return (
                        <div key={prov.id} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setProveedorExpandido(expandido ? null : prov.id)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-sky-50 transition-all text-left"
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
                                <div className="text-xs text-gray-500">CUIT: {prov.cuit}</div>
                              )}
                            </div>

                            {/* Expand icon */}
                            {expandido ? (
                              <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            )}
                          </button>

                          {/* Detalle expandido */}
                          {expandido && (
                            <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
                              {prov.telefono && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 pt-2">
                                  <Phone className="w-4 h-4" />
                                  {prov.telefono}
                                </div>
                              )}
                              {prov.comentario && (
                                <p className="text-sm text-gray-500 italic">{prov.comentario}</p>
                              )}
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => setModalProveedor({ isOpen: true, proveedor: prov })}
                                  className="flex-1 flex items-center justify-center gap-1 text-sm py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Editar
                                </button>
                                <button
                                  onClick={() => setConfirmEliminar({ isOpen: true, tipo: 'proveedor', id: prov.id, nombre: prov.razon_social })}
                                  className="flex items-center justify-center gap-1 text-sm py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              ) : (
                // TAB FACTURAS RECIENTES
                facturasFiltradas.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {busqueda ? 'No se encontraron facturas' : 'No hay facturas registradas'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {facturasFiltradas.map((fact) => (
                      <div
                        key={fact.id}
                        className="border border-gray-200 rounded-lg p-3 bg-white"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {fact.proveedor?.razon_social || 'Proveedor'}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {new Date(fact.fecha_factura + 'T12:00:00').toLocaleDateString('es-AR')}
                              {fact.numero_factura && ` | Nro: ${fact.numero_factura}`}
                            </div>
                            {fact.descripcion && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{fact.descripcion}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="font-bold text-sky-600">{formatearMonto(fact.monto_total)}</div>
                            {fact.movimiento_id && (
                              <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                en caja
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => setConfirmEliminar({ isOpen: true, tipo: 'factura', id: fact.id, nombre: `factura ${fact.numero_factura || ''}` })}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-5 py-4 flex gap-2">
              <button
                onClick={() => setModalProveedor({ isOpen: true, proveedor: null })}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg"
              >
                <Plus className="w-5 h-5" />
                Proveedor
              </button>
              <button
                onClick={() => setModalFactura(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 rounded-lg"
              >
                <FileText className="w-5 h-5" />
                Nueva Factura
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Proveedor (crear/editar) */}
      <ModalProveedor
        isOpen={modalProveedor.isOpen}
        onClose={() => setModalProveedor({ isOpen: false, proveedor: null })}
        onGuardar={handleGuardarProveedor}
        proveedor={modalProveedor.proveedor}
      />

      {/* Modal Registrar Factura */}
      <ModalRegistrarFactura
        isOpen={modalFactura}
        onClose={() => setModalFactura(false)}
        onGuardado={handleGuardarFactura}
        metodosPago={metodosPago}
      />

      {/* Modal Confirmación eliminar */}
      <ModalConfirmacion
        isOpen={confirmEliminar.isOpen}
        onClose={() => setConfirmEliminar({ isOpen: false, tipo: null, id: null, nombre: '' })}
        onConfirm={handleConfirmEliminar}
        titulo={confirmEliminar.tipo === 'proveedor' ? 'Eliminar proveedor' : 'Eliminar factura'}
        mensaje={
          confirmEliminar.tipo === 'proveedor'
            ? `Se desactivará el proveedor "${confirmEliminar.nombre}". Las facturas existentes se mantendrán.`
            : `Se eliminará la ${confirmEliminar.nombre}. Si estaba vinculada a un movimiento de caja, el movimiento se mantendrá.`
        }
        textoConfirmar="Eliminar"
        variante="danger"
        loading={procesando}
      />
    </>
  )
}
