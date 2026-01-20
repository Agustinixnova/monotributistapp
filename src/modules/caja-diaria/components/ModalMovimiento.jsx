/**
 * Modal para crear nuevo movimiento (entrada o salida)
 * Flujo de 2 etapas:
 * 1. Monto + Descripción + Categoría
 * 2. Formas de pago
 */

import { useState, useEffect, useRef } from 'react'
import { X, Check, ArrowLeft, ArrowRight } from 'lucide-react'
import IconoDinamico from './IconoDinamico'
import InputMonto from './InputMonto'
import { formatearMonto } from '../utils/formatters'
import { validarMontosPagos } from '../utils/calculosCaja'

export default function ModalMovimiento({
  isOpen,
  onClose,
  tipo,
  categorias,
  metodosPago,
  onGuardar,
  montoInicial = 0,
  onFiado = null, // Callback cuando se selecciona categoría "Cuenta Corriente"
  onCobroDeuda = null // Callback cuando se selecciona categoría "Cobro de deuda"
}) {
  // Estado del flujo
  const [etapa, setEtapa] = useState(1)

  // Datos del movimiento
  const [monto, setMonto] = useState(0)
  const [descripcion, setDescripcion] = useState('')
  const [categoriaId, setCategoriaId] = useState(null)
  const [pagos, setPagos] = useState([])

  // UI
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const montoInputRef = useRef(null)

  // Resetear form cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setEtapa(1)
      setMonto(montoInicial || 0)
      setDescripcion('')
      setCategoriaId(null)
      setPagos([])
      setError('')
      // Focus en el input de monto
      setTimeout(() => montoInputRef.current?.focus(), 100)
    }
  }, [isOpen, montoInicial])

  // Pasar a etapa 2
  const handleSiguiente = () => {
    if (monto <= 0) {
      setError('Ingresá un monto mayor a 0')
      return
    }
    if (!categoriaId) {
      setError('Seleccioná una categoría')
      return
    }
    setError('')
    setEtapa(2)
  }

  // Volver a etapa 1
  const handleVolver = () => {
    setEtapa(1)
    setError('')
  }

  // Seleccionar categoría (pasa automáticamente si hay monto)
  const handleSelectCategoria = (id) => {
    const categoriaSeleccionada = categorias.find(c => c.id === id)

    // Detectar si es la categoría "Cuenta Corriente" (entrada - venta a crédito)
    if (categoriaSeleccionada?.nombre === 'Cuenta Corriente' && onFiado) {
      // Cerrar este modal y notificar al padre para abrir el modal de cuenta corriente
      onClose()
      onFiado(monto)
      return
    }

    // Detectar si es la categoría "Cobro de deuda" (entrada - cobro a cliente)
    if (categoriaSeleccionada?.nombre === 'Cobro de deuda' && onCobroDeuda) {
      // Cerrar este modal y notificar al padre para abrir el modal de cobranzas
      onClose()
      onCobroDeuda()
      return
    }

    setCategoriaId(id)
    if (monto > 0) {
      setError('')
      setEtapa(2)
    }
  }

  // Manejar cambio de monto en forma de pago
  const handleChangePago = (metodoId, valor) => {
    const nuevosPagos = [...pagos]
    const index = nuevosPagos.findIndex(p => p.metodo_pago_id === metodoId)

    if (index >= 0) {
      if (valor > 0) {
        nuevosPagos[index].monto = valor
      } else {
        nuevosPagos.splice(index, 1)
      }
    } else {
      if (valor > 0) {
        nuevosPagos.push({ metodo_pago_id: metodoId, monto: valor })
      }
    }
    setPagos(nuevosPagos)
  }

  // Click en nombre de forma de pago → autocompleta con el total restante
  const handleClickMetodo = (metodoId) => {
    const totalPagado = pagos
      .filter(p => p.metodo_pago_id !== metodoId)
      .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)

    const restante = monto - totalPagado

    if (restante > 0) {
      handleChangePago(metodoId, restante)
    }
  }

  // Obtener monto de un método
  const getMontoMetodo = (metodoId) => {
    const pago = pagos.find(p => p.metodo_pago_id === metodoId)
    return pago?.monto || 0
  }

  // Guardar movimiento
  const handleGuardar = async () => {
    const validacion = validarMontosPagos(pagos)
    if (!validacion.valido) {
      setError(validacion.mensaje)
      return
    }

    // Verificar que el total de pagos coincida con el monto
    const totalPagos = pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
    if (Math.abs(totalPagos - monto) > 0.01) {
      setError(`El total de pagos (${formatearMonto(totalPagos)}) debe ser igual al monto (${formatearMonto(monto)})`)
      return
    }

    setGuardando(true)
    setError('')

    try {
      await onGuardar({
        tipo,
        categoria_id: categoriaId,
        descripcion: descripcion.trim(),
        monto_total: monto,
        pagos
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  if (!isOpen) return null

  const esEntrada = tipo === 'entrada'
  const titulo = esEntrada ? 'Nueva Entrada' : 'Nueva Salida'
  const colorFondo = esEntrada ? 'bg-emerald-500' : 'bg-red-500'
  const colorTexto = esEntrada ? 'text-emerald-600' : 'text-red-600'

  // Filtrar categorías según tipo y excluir las de uso interno del sistema (arqueo/cierre)
  const categoriasOcultas = ['Sobrante de caja', 'Faltante de caja', 'Ajuste de caja']
  const categoriasDisponibles = categorias.filter(
    cat => (cat.tipo === tipo || cat.tipo === 'ambos') && !categoriasOcultas.includes(cat.nombre)
  )

  // Total pagado
  const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
  const restante = monto - totalPagado

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">

          {/* Header */}
          <div className={`${colorFondo} px-5 py-4 text-white flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              {etapa === 2 && (
                <button onClick={handleVolver} className="p-1 hover:bg-white/20 rounded-lg">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h3 className="font-heading font-semibold text-lg">{titulo}</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-5">

            {/* ETAPA 1: Monto + Descripción + Categoría */}
            {etapa === 1 && (
              <div className="space-y-5">
                {/* Monto (principal) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">$</span>
                    <InputMonto
                      value={monto}
                      onChange={setMonto}
                      placeholder="0"
                      className={`w-full pl-10 pr-4 py-4 text-3xl font-bold border-2 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${colorTexto} text-right`}
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
                    placeholder="Ej: Zapatillas Nike"
                    maxLength={100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                {/* Categorías (cards pequeñas) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {categoriasDisponibles.map(cat => {
                      const seleccionado = categoriaId === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleSelectCategoria(cat.id)}
                          className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 transition-all ${
                            seleccionado
                              ? 'border-violet-500 bg-violet-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <IconoDinamico
                            nombre={cat.icono}
                            className={`w-5 h-5 ${seleccionado ? 'text-violet-600' : 'text-gray-500'}`}
                          />
                          <span className={`text-xs text-center leading-tight ${
                            seleccionado ? 'text-violet-700 font-medium' : 'text-gray-600'
                          }`}>
                            {cat.nombre}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* ETAPA 2: Formas de pago */}
            {etapa === 2 && (
              <div className="space-y-5">
                {/* Total a pagar */}
                <div className={`${esEntrada ? 'bg-emerald-50' : 'bg-red-50'} rounded-xl p-4 text-center`}>
                  <p className="text-sm text-gray-600 mb-1">Total a registrar</p>
                  <p className={`text-3xl font-bold ${colorTexto}`}>
                    {formatearMonto(monto)}
                  </p>
                  {descripcion && (
                    <p className="text-sm text-gray-500 mt-1">{descripcion}</p>
                  )}
                </div>

                {/* Formas de pago */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    ¿Cómo se pagó?
                    <span className="text-xs text-gray-400 ml-2">(tocá el nombre para autocompletar)</span>
                  </h4>

                  <div className="space-y-2">
                    {metodosPago.map(metodo => {
                      const montoMetodo = getMontoMetodo(metodo.id)
                      const tieneValor = montoMetodo > 0

                      return (
                        <div
                          key={metodo.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            tieneValor ? 'border-violet-300 bg-violet-50' : 'border-gray-200'
                          }`}
                        >
                          {/* Icono + Nombre (clickeable) */}
                          <button
                            type="button"
                            onClick={() => handleClickMetodo(metodo.id)}
                            className="flex items-center gap-2 min-w-[120px] text-left hover:text-violet-600 transition-colors"
                          >
                            <IconoDinamico
                              nombre={metodo.icono}
                              className={`w-5 h-5 ${tieneValor ? 'text-violet-600' : 'text-gray-500'}`}
                            />
                            <span className={`text-sm font-medium ${tieneValor ? 'text-violet-700' : 'text-gray-700'}`}>
                              {metodo.nombre}
                            </span>
                          </button>

                          {/* Input */}
                          <div className="flex-1">
                            <InputMonto
                              value={montoMetodo}
                              onChange={(val) => handleChangePago(metodo.id, val)}
                              placeholder="0"
                              className={`w-full px-3 py-2 border rounded-lg text-right font-medium ${
                                tieneValor
                                  ? 'border-violet-300 bg-white'
                                  : 'border-gray-300'
                              } focus:ring-2 focus:ring-violet-500 focus:border-violet-500`}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Resumen */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total ingresado</span>
                    <span className="font-medium">{formatearMonto(totalPagado)}</span>
                  </div>
                  {restante !== 0 && (
                    <div className={`flex justify-between text-sm ${restante > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                      <span>{restante > 0 ? 'Falta' : 'Excedente'}</span>
                      <span className="font-medium">{formatearMonto(Math.abs(restante))}</span>
                    </div>
                  )}
                </div>

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
          <div className="border-t border-gray-200 px-5 py-4">
            {etapa === 1 ? (
              <button
                onClick={handleSiguiente}
                disabled={monto <= 0 || !categoriaId}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
              >
                Siguiente
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleGuardar}
                disabled={guardando || restante !== 0}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
              >
                <Check className="w-5 h-5" />
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
