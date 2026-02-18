/**
 * Modal para registrar una factura de compra
 * Flujo multi-etapa: proveedor → datos factura → confirmar (opcionalmente vincular a caja)
 */

import { useState, useEffect } from 'react'
import { X, Check, ShoppingBag, Truck, ChevronLeft, Info } from 'lucide-react'
import { formatearMonto } from '../utils/formatters'
import { getFechaHoyArgentina } from '../utils/dateUtils'
import InputMonto from './InputMonto'
import ModalSelectorProveedor from './ModalSelectorProveedor'

export default function ModalRegistrarFactura({
  isOpen,
  onClose,
  onGuardado,
  metodosPago = []
}) {
  // Estado del flujo
  const [etapa, setEtapa] = useState('proveedor') // 'proveedor' | 'selector' | 'factura' | 'confirmar'

  // Proveedor seleccionado
  const [proveedor, setProveedor] = useState(null)

  // Datos de la factura
  const [puntoVenta, setPuntoVenta] = useState('')
  const [nroComprobante, setNroComprobante] = useState('')
  const [fechaFactura, setFechaFactura] = useState('')
  const [montoSinIva, setMontoSinIva] = useState(0)
  const [montoTotal, setMontoTotal] = useState(0)
  const [descripcion, setDescripcion] = useState('')

  // Vincular a caja
  const [registrarEgreso, setRegistrarEgreso] = useState(false)
  const [metodoPagoId, setMetodoPagoId] = useState('')

  // UI
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Reset cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setEtapa('proveedor')
      setProveedor(null)
      setPuntoVenta('')
      setNroComprobante('')
      setFechaFactura(getFechaHoyArgentina())
      setMontoSinIva(0)
      setMontoTotal(0)
      setDescripcion('')
      setRegistrarEgreso(false)
      setMetodoPagoId('')
      setError('')
    }
  }, [isOpen])

  // Cuando se selecciona un proveedor
  const handleSelectProveedor = (proveedorSeleccionado) => {
    setProveedor(proveedorSeleccionado)
    setEtapa('factura')
  }

  // Ir a etapa de confirmación
  const handleSiguiente = () => {
    if (montoTotal <= 0) {
      setError('Ingresá un monto total mayor a 0')
      return
    }
    setError('')
    setEtapa('confirmar')
  }

  // Guardar factura
  const handleGuardar = async () => {
    if (montoTotal <= 0) {
      setError('Ingresá un monto total mayor a 0')
      return
    }

    if (registrarEgreso && !metodoPagoId) {
      setError('Seleccioná un método de pago')
      return
    }

    setGuardando(true)
    setError('')

    try {
      // Armar número de factura formateado: XXXX-XXXXXXXX
      let numeroFacturaFinal = null
      if (puntoVenta || nroComprobante) {
        const pv = puntoVenta.padStart(4, '0').slice(0, 4)
        const nc = nroComprobante.padStart(8, '0').slice(0, 8)
        numeroFacturaFinal = `${pv}-${nc}`
      }

      // Armar descripción rica para el movimiento de caja
      const partes = [proveedor.razon_social]
      if (numeroFacturaFinal) partes.push(`Fact. ${numeroFacturaFinal}`)
      if (descripcion.trim()) partes.push(descripcion.trim())
      const descripcionCompleta = partes.join(' | ')

      const facturaData = {
        proveedor_id: proveedor.id,
        numero_factura: numeroFacturaFinal,
        fecha_factura: fechaFactura,
        fecha_carga: getFechaHoyArgentina(),
        monto_sin_iva: montoSinIva > 0 ? montoSinIva : null,
        monto_total: montoTotal,
        descripcion: descripcionCompleta
      }

      if (registrarEgreso) {
        facturaData.metodo_pago_id = metodoPagoId
      }

      if (onGuardado) {
        await onGuardado(facturaData, registrarEgreso)
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar la factura')
    } finally {
      setGuardando(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Modal principal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-sky-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(etapa === 'factura' || etapa === 'confirmar') && (
                  <button
                    onClick={() => setEtapa(etapa === 'confirmar' ? 'factura' : 'proveedor')}
                    className="p-1 hover:bg-white/20 rounded-lg mr-1"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <ShoppingBag className="w-5 h-5" />
                <h3 className="font-heading font-semibold text-lg">Nueva Factura de Compra</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Etapa: Seleccionar proveedor */}
              {etapa === 'proveedor' && (
                <div className="text-center py-8">
                  <Truck className="w-16 h-16 text-sky-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Seleccioná un proveedor
                  </h4>
                  <p className="text-gray-500 mb-6">
                    Elegí el proveedor de la factura de compra
                  </p>
                  <button
                    onClick={() => setEtapa('selector')}
                    className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg"
                  >
                    Seleccionar proveedor
                  </button>
                </div>
              )}

              {/* Etapa: Datos de la factura */}
              {etapa === 'factura' && proveedor && (
                <div className="space-y-5">
                  {/* Proveedor seleccionado */}
                  <div className="bg-sky-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-sky-200 rounded-full flex items-center justify-center">
                        <span className="text-sky-700 font-bold text-sm">
                          {proveedor.razon_social?.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{proveedor.razon_social}</p>
                        {proveedor.cuit && (
                          <p className="text-sm text-gray-500">CUIT: {proveedor.cuit}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setEtapa('selector')}
                        className="text-sm text-sky-600 hover:text-sky-700"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>

                  {/* Número de factura */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nro. Factura (opcional)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={puntoVenta}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                            setPuntoVenta(val)
                          }}
                          onBlur={() => {
                            if (puntoVenta) setPuntoVenta(puntoVenta.padStart(4, '0'))
                          }}
                          placeholder="0000"
                          maxLength={4}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-center font-mono"
                        />
                      </div>
                      <span className="text-gray-400 font-bold text-lg">-</span>
                      <div className="flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={nroComprobante}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 8)
                            setNroComprobante(val)
                          }}
                          onBlur={() => {
                            if (nroComprobante) setNroComprobante(nroComprobante.padStart(8, '0'))
                          }}
                          placeholder="00000000"
                          maxLength={8}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-center font-mono"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Punto de venta (4) - Nro. comprobante (8)</p>
                  </div>

                  {/* Fecha factura */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Factura *
                    </label>
                    <input
                      type="date"
                      value={fechaFactura}
                      onChange={(e) => setFechaFactura(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>

                  {/* Monto sin IVA */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto sin IVA (opcional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400">$</span>
                      <InputMonto
                        value={montoSinIva}
                        onChange={setMontoSinIva}
                        placeholder="0"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-right"
                      />
                    </div>
                  </div>

                  {/* Monto total */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto Total *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">$</span>
                      <InputMonto
                        value={montoTotal}
                        onChange={setMontoTotal}
                        placeholder="0"
                        className="w-full pl-10 pr-4 py-4 text-3xl font-bold border-2 border-sky-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sky-600 text-right"
                      />
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción (opcional)
                    </label>
                    <input
                      type="text"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Ej: Mercadería, insumos..."
                      maxLength={500}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                </div>
              )}

              {/* Etapa: Confirmar */}
              {etapa === 'confirmar' && (
                <div className="space-y-5">
                  {/* Resumen */}
                  <div className="bg-sky-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Proveedor:</span>
                      <span className="font-medium text-gray-900">{proveedor?.razon_social}</span>
                    </div>
                    {(puntoVenta || nroComprobante) && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Nro. Factura:</span>
                        <span className="font-medium text-gray-900 font-mono">
                          {puntoVenta.padStart(4, '0')}-{nroComprobante.padStart(8, '0')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fecha:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(fechaFactura + 'T12:00:00').toLocaleDateString('es-AR')}
                      </span>
                    </div>
                    {montoSinIva > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Monto sin IVA:</span>
                        <span className="font-medium text-gray-900">{formatearMonto(montoSinIva)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-sky-200">
                      <span className="text-sm font-medium text-sky-700">Monto Total:</span>
                      <span className="text-lg font-bold text-sky-700">{formatearMonto(montoTotal)}</span>
                    </div>
                  </div>

                  {/* Checkbox registrar como egreso */}
                  <div className="border-2 border-gray-200 rounded-lg p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={registrarEgreso}
                        onChange={(e) => setRegistrarEgreso(e.target.checked)}
                        className="w-5 h-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500 mt-0.5"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Registrar como egreso en caja</span>
                        <p className="text-sm text-gray-500 mt-1">
                          Se creará un movimiento de salida en la caja del día
                        </p>
                      </div>
                    </label>

                    {registrarEgreso && (
                      <div className="mt-4 space-y-3 pt-3 border-t border-gray-200">
                        {/* Categoría automática */}
                        <div className="bg-sky-50 rounded-lg px-3 py-2 text-sm text-sky-700 flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 flex-shrink-0" />
                          Categoría: <strong>Pago proveedor</strong>
                        </div>

                        {/* Método de pago */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Método de pago *
                          </label>
                          <select
                            value={metodoPagoId}
                            onChange={(e) => setMetodoPagoId(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                          >
                            <option value="">Seleccionar método...</option>
                            {metodosPago.filter(m => m.activo).map(m => (
                              <option key={m.id} value={m.id}>{m.nombre}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Aviso informativo */}
                  {!registrarEgreso && (
                    <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700 flex items-start gap-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>
                        La factura se registrará solo como compra. <strong>No afectará la caja del día.</strong>
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {etapa === 'factura' && (
              <div className="border-t border-gray-200 px-5 py-4 flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSiguiente}
                  disabled={montoTotal <= 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg"
                >
                  Siguiente
                </button>
              </div>
            )}

            {etapa === 'confirmar' && (
              <div className="border-t border-gray-200 px-5 py-4 flex gap-2">
                <button
                  onClick={() => setEtapa('factura')}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Volver
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg"
                >
                  <Check className="w-5 h-5" />
                  {guardando ? 'Guardando...' : 'Guardar Factura'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Selector de Proveedor */}
      <ModalSelectorProveedor
        isOpen={etapa === 'selector'}
        onClose={() => setEtapa(proveedor ? 'factura' : 'proveedor')}
        onSelect={handleSelectProveedor}
      />
    </>
  )
}
