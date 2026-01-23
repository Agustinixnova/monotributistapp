/**
 * Modal para crear turno rápido en 3 clicks
 * 1. Seleccionar cliente (o escribir nombre)
 * 2. Seleccionar servicio
 * 3. Confirmar hora
 */

import { useState, useEffect, useRef } from 'react'
import { X, Zap, User, Scissors, Clock, Search, UserPlus, Loader2, Check } from 'lucide-react'
import { formatFechaCorta, sumarMinutosAHora } from '../../utils/dateUtils'
import { formatearMonto, formatearHora } from '../../utils/formatters'

const PASOS = {
  CLIENTE: 1,
  SERVICIO: 2,
  CONFIRMAR: 3
}

export default function ModalTurnoRapido({
  isOpen,
  onClose,
  onGuardar,
  fecha,
  hora,
  servicios = [],
  clientes = []
}) {
  const [paso, setPaso] = useState(PASOS.CLIENTE)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null)
  const [horaInicio, setHoraInicio] = useState(hora || '09:00')
  const [guardando, setGuardando] = useState(false)
  const [nombreNuevoCliente, setNombreNuevoCliente] = useState('')

  const inputRef = useRef(null)

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setPaso(PASOS.CLIENTE)
      setBusquedaCliente('')
      setClienteSeleccionado(null)
      setServicioSeleccionado(null)
      setHoraInicio(hora || '09:00')
      setNombreNuevoCliente('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, hora])

  // Filtrar clientes
  const clientesFiltrados = clientes.filter(c => {
    const nombre = `${c.nombre} ${c.apellido || ''}`.toLowerCase()
    return nombre.includes(busquedaCliente.toLowerCase())
  }).slice(0, 6)

  // Calcular hora fin
  const horaFin = servicioSeleccionado
    ? sumarMinutosAHora(horaInicio, servicioSeleccionado.duracion_minutos)
    : null

  const handleSeleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente)
    setPaso(PASOS.SERVICIO)
  }

  const handleClienteNuevo = () => {
    // Crear cliente temporal con el nombre buscado
    setClienteSeleccionado({
      id: null,
      nombre: busquedaCliente || nombreNuevoCliente,
      esNuevo: true
    })
    setPaso(PASOS.SERVICIO)
  }

  const handleSeleccionarServicio = (servicio) => {
    setServicioSeleccionado(servicio)
    setPaso(PASOS.CONFIRMAR)
  }

  const handleGuardar = async () => {
    if (!servicioSeleccionado) return

    setGuardando(true)

    try {
      const turnoData = {
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        cliente_id: clienteSeleccionado?.id || null,
        cliente_nombre: clienteSeleccionado?.esNuevo ? clienteSeleccionado.nombre : null,
        servicios: [{
          servicio_id: servicioSeleccionado.id,
          precio: servicioSeleccionado.precio,
          duracion: servicioSeleccionado.duracion_minutos
        }],
        estado: 'pendiente',
        notas: clienteSeleccionado?.esNuevo ? `Cliente nuevo: ${clienteSeleccionado.nombre}` : ''
      }

      await onGuardar(turnoData)
      onClose()
    } catch (error) {
      console.error('Error guardando turno rápido:', error)
    } finally {
      setGuardando(false)
    }
  }

  const handleVolver = () => {
    if (paso === PASOS.SERVICIO) {
      setPaso(PASOS.CLIENTE)
      setClienteSeleccionado(null)
    } else if (paso === PASOS.CONFIRMAR) {
      setPaso(PASOS.SERVICIO)
      setServicioSeleccionado(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-amber-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-gray-900">Turno Rápido</h2>
              <p className="text-xs text-gray-500">
                {formatFechaCorta(fecha)} - {horaInicio}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-2 py-3 bg-gray-50 border-b">
          {[1, 2, 3].map((p) => (
            <div
              key={p}
              className={`flex items-center ${p < 3 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  paso >= p
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {paso > p ? <Check className="w-4 h-4" /> : p}
              </div>
              {p < 3 && (
                <div className={`flex-1 h-1 mx-2 rounded ${
                  paso > p ? 'bg-amber-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Contenido según paso */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Paso 1: Seleccionar cliente */}
          {paso === PASOS.CLIENTE && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4" />
                  ¿Quién viene?
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={busquedaCliente}
                    onChange={(e) => setBusquedaCliente(e.target.value)}
                    placeholder="Buscar cliente..."
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Lista de clientes */}
              <div className="space-y-2">
                {clientesFiltrados.map((cliente) => (
                  <button
                    key={cliente.id}
                    onClick={() => handleSeleccionarCliente(cliente)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border hover:border-amber-300 hover:bg-amber-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-medium">
                      {cliente.nombre?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {cliente.nombre} {cliente.apellido || ''}
                      </p>
                      {cliente.whatsapp && (
                        <p className="text-sm text-gray-500 truncate">{cliente.whatsapp}</p>
                      )}
                    </div>
                  </button>
                ))}

                {/* Opción de cliente nuevo */}
                {(busquedaCliente.length > 0 || clientesFiltrados.length === 0) && (
                  <button
                    onClick={handleClienteNuevo}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-amber-300 hover:bg-amber-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-amber-700">
                        {busquedaCliente ? `"${busquedaCliente}"` : 'Cliente sin registrar'}
                      </p>
                      <p className="text-sm text-gray-500">Continuar sin datos</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Paso 2: Seleccionar servicio */}
          {paso === PASOS.SERVICIO && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Scissors className="w-4 h-4" />
                  ¿Qué servicio?
                </label>
                <button
                  onClick={handleVolver}
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  Cambiar cliente
                </button>
              </div>

              {/* Cliente seleccionado */}
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-medium text-sm">
                  {clienteSeleccionado?.nombre?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="font-medium text-amber-800">
                  {clienteSeleccionado?.nombre} {clienteSeleccionado?.apellido || ''}
                  {clienteSeleccionado?.esNuevo && ' (nuevo)'}
                </span>
              </div>

              {/* Lista de servicios */}
              <div className="space-y-2">
                {servicios.map((servicio) => (
                  <button
                    key={servicio.id}
                    onClick={() => handleSeleccionarServicio(servicio)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border hover:border-amber-300 hover:bg-amber-50 transition-colors text-left"
                  >
                    <div
                      className="w-3 h-10 rounded-full"
                      style={{ backgroundColor: servicio.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{servicio.nombre}</p>
                      <p className="text-sm text-gray-500">{servicio.duracion_minutos} min</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatearMonto(servicio.precio)}</p>
                    </div>
                  </button>
                ))}

                {servicios.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Scissors className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay servicios creados</p>
                    <p className="text-sm">Crea servicios primero</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paso 3: Confirmar */}
          {paso === PASOS.CONFIRMAR && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="w-4 h-4" />
                  Confirmar horario
                </label>
                <button
                  onClick={handleVolver}
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  Cambiar servicio
                </button>
              </div>

              {/* Resumen */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Cliente</span>
                  <span className="font-medium">
                    {clienteSeleccionado?.nombre} {clienteSeleccionado?.apellido || ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Servicio</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: servicioSeleccionado?.color }}
                    />
                    <span className="font-medium">{servicioSeleccionado?.nombre}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duración</span>
                  <span className="font-medium">{servicioSeleccionado?.duracion_minutos} min</span>
                </div>
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatearMonto(servicioSeleccionado?.precio)}
                  </span>
                </div>
              </div>

              {/* Selector de hora */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de inicio
                </label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg font-medium"
                />
                {horaFin && (
                  <p className="mt-2 text-sm text-gray-500">
                    Termina a las {formatearHora(horaFin)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer con botón de acción */}
        {paso === PASOS.CONFIRMAR && (
          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Agendar turno
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
