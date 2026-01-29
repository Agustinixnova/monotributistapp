/**
 * Modal para crear turno rápido en 3 clicks
 * 1. Seleccionar cliente (o escribir nombre)
 * 2. Seleccionar servicio
 * 3. Confirmar hora
 */

import { useState, useEffect, useRef } from 'react'
import { X, Zap, User, Scissors, Clock, Search, UserPlus, Loader2, Check, AlertCircle, Wallet, Plus, Calendar } from 'lucide-react'
import { formatFechaCorta, sumarMinutosAHora, getFechaHoyArgentina, generarSlotsTiempo } from '../../utils/dateUtils'
import { formatearMonto, formatearHora } from '../../utils/formatters'
import { getSenaDisponibleCliente } from '../../services/pagosService'
import { createCliente } from '../../services/clientesService'
import ModalCliente from '../clientes/ModalCliente'

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
  clientes = [],
  turnosExistentes = [] // Turnos del día para verificar superposiciones
}) {
  const [paso, setPaso] = useState(PASOS.CLIENTE)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fecha || getFechaHoyArgentina())
  const [horaInicio, setHoraInicio] = useState(hora || '09:00')
  const [guardando, setGuardando] = useState(false)
  const [nombreNuevoCliente, setNombreNuevoCliente] = useState('')
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false)

  // Seña disponible de turno cancelado
  const [senaDisponible, setSenaDisponible] = useState(null)
  const [usarSenaExistente, setUsarSenaExistente] = useState(true) // Por defecto usar la seña

  // Modal de alerta de superposición
  const [alertaSuperposicion, setAlertaSuperposicion] = useState({
    mostrar: false,
    turnosSuperpuestos: [],
    datosParaGuardar: null
  })

  const inputRef = useRef(null)

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setPaso(PASOS.CLIENTE)
      setBusquedaCliente('')
      setClienteSeleccionado(null)
      setServicioSeleccionado(null)
      setFechaSeleccionada(fecha || getFechaHoyArgentina())
      setHoraInicio(hora || '09:00')
      setNombreNuevoCliente('')
      setMostrarModalCliente(false)
      setSenaDisponible(null)
      setUsarSenaExistente(true)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, fecha, hora])

  // Filtrar clientes
  const clientesFiltrados = clientes.filter(c => {
    const nombre = `${c.nombre} ${c.apellido || ''}`.toLowerCase()
    return nombre.includes(busquedaCliente.toLowerCase())
  }).slice(0, 6)

  // Calcular hora fin
  const horaFin = servicioSeleccionado
    ? sumarMinutosAHora(horaInicio, servicioSeleccionado.duracion_minutos)
    : null

  // Generar horarios disponibles para el selector (filtrar según restricción de 2 horas antes si es hoy)
  const horariosDisponibles = (() => {
    const todos = generarSlotsTiempo('08:00', '21:00', 30)
    const hoy = getFechaHoyArgentina()

    // Si no es hoy, mostrar todos los horarios
    if (fechaSeleccionada !== hoy) return todos

    // Si es hoy, filtrar horarios anteriores a 2 horas antes de ahora
    const ahora = new Date()
    // Convertir a hora Argentina (UTC-3)
    const horaArgentina = new Date(ahora.getTime() - (ahora.getTimezoneOffset() * 60000) + (-3 * 3600000))
    const horaActual = horaArgentina.getHours()
    const minutosActuales = horaArgentina.getMinutes()
    const minutosLimite = (horaActual * 60 + minutosActuales) - 120 // 2 horas antes

    return todos.filter(hora => {
      const [h, m] = hora.split(':').map(Number)
      const minutosHora = h * 60 + m
      // Permitir horarios desde 2 horas antes de la hora actual
      return minutosHora >= minutosLimite
    })
  })()

  // Verificar si la hora seleccionada es válida (no anterior a 2 horas antes de ahora)
  const horaEsValida = (() => {
    const hoy = getFechaHoyArgentina()
    // Si es fecha pasada, no es válido
    if (fechaSeleccionada < hoy) return false
    // Si no es hoy, cualquier hora es válida
    if (fechaSeleccionada !== hoy) return true
    // Si es hoy, verificar que la hora esté en los horarios disponibles
    return horariosDisponibles.includes(horaInicio)
  })()

  const handleSeleccionarCliente = async (cliente) => {
    setClienteSeleccionado(cliente)

    // Verificar si el cliente tiene seña disponible de turno cancelado
    if (cliente.id) {
      const { data: sena } = await getSenaDisponibleCliente(cliente.id)
      setSenaDisponible(sena)
      setUsarSenaExistente(!!sena) // Por defecto usar si existe
    } else {
      setSenaDisponible(null)
    }

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

  // Handler para cuando se crea un cliente desde el modal
  const handleNuevoClienteCreado = async (clienteData) => {
    try {
      // Guardar el cliente en la base de datos
      const { data: clienteGuardado, error } = await createCliente(clienteData)

      if (error) {
        console.error('Error guardando cliente:', error)
        return
      }

      setMostrarModalCliente(false)
      // Seleccionar el cliente recién creado (con su ID real) y pasar al siguiente paso
      await handleSeleccionarCliente(clienteGuardado)
    } catch (err) {
      console.error('Error creando cliente:', err)
    }
  }

  const handleSeleccionarServicio = (servicio) => {
    setServicioSeleccionado(servicio)
    setPaso(PASOS.CONFIRMAR)
  }

  // Verificar superposición de turnos
  const verificarSuperposicion = (horaInicioNuevo, horaFinNuevo) => {
    // Convertir hora a minutos para comparar
    const horaAMinutos = (hora) => {
      const [h, m] = hora.split(':').map(Number)
      return h * 60 + m
    }

    const inicioNuevo = horaAMinutos(horaInicioNuevo)
    const finNuevo = horaAMinutos(horaFinNuevo)

    // Filtrar turnos del mismo día
    const turnosDelDia = turnosExistentes.filter(t => {
      if (t.fecha !== fechaSeleccionada) return false // Solo turnos del mismo día
      if (t.estado === 'cancelado' || t.estado === 'no_asistio') return false // Excluir cancelados
      return true
    })

    // Buscar superposiciones
    const superpuestos = turnosDelDia.filter(t => {
      const inicioExistente = horaAMinutos(t.hora_inicio)
      const finExistente = horaAMinutos(t.hora_fin)
      return inicioNuevo < finExistente && finNuevo > inicioExistente
    })

    return superpuestos
  }

  const handleGuardar = async () => {
    if (!servicioSeleccionado) return

    const turnoData = {
      fecha: fechaSeleccionada,
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
      notas: clienteSeleccionado?.esNuevo ? `Cliente nuevo: ${clienteSeleccionado.nombre}` : '',
      // Si hay seña disponible y el usuario quiere usarla, incluir el turno origen
      transferirSenaDe: (senaDisponible && usarSenaExistente) ? senaDisponible.turnoId : null
    }

    // Verificar superposiciones
    const superpuestos = verificarSuperposicion(horaInicio, horaFin)

    if (superpuestos.length > 0) {
      // Mostrar alerta de superposición
      setAlertaSuperposicion({
        mostrar: true,
        turnosSuperpuestos: superpuestos,
        datosParaGuardar: turnoData
      })
      return
    }

    // Si no hay superposición, guardar directamente
    await guardarTurno(turnoData)
  }

  // Función para guardar el turno
  const guardarTurno = async (turnoData) => {
    setGuardando(true)

    try {
      await onGuardar(turnoData)
      setAlertaSuperposicion({ mostrar: false, turnosSuperpuestos: [], datosParaGuardar: null })
      onClose()
    } catch (error) {
      console.error('Error guardando turno rápido:', error)
    } finally {
      setGuardando(false)
    }
  }

  // Confirmar guardar a pesar de superposición
  const handleConfirmarSuperposicion = () => {
    if (alertaSuperposicion.datosParaGuardar) {
      guardarTurno(alertaSuperposicion.datosParaGuardar)
    }
  }

  // Cancelar y cerrar alerta de superposición
  const handleCancelarSuperposicion = () => {
    setAlertaSuperposicion({ mostrar: false, turnosSuperpuestos: [], datosParaGuardar: null })
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-md rounded-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-amber-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-gray-900">Turno Rápido</h2>
              <p className="text-xs text-gray-500">
                {formatFechaCorta(fechaSeleccionada)} - {horaInicio}
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
        <div className="flex items-center justify-center py-3 px-6 bg-gray-50 border-b">
          <div className="flex items-center gap-1 max-w-[200px] w-full">
            {[1, 2, 3].map((p) => (
              <div
                key={p}
                className={`flex items-center ${p < 3 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors flex-shrink-0 ${
                    paso >= p
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {paso > p ? <Check className="w-3 h-3" /> : p}
                </div>
                {p < 3 && (
                  <div className={`flex-1 h-0.5 mx-1 rounded ${
                    paso > p ? 'bg-amber-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contenido según paso */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Paso 1: Seleccionar cliente */}
          {paso === PASOS.CLIENTE && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="w-4 h-4" />
                    ¿Quién viene?
                  </label>
                  <button
                    type="button"
                    onClick={() => setMostrarModalCliente(true)}
                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nuevo cliente
                  </button>
                </div>
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

              {/* Banner de seña disponible */}
              {senaDisponible && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-800">
                        Seña disponible: {formatearMonto(senaDisponible.montoSena)}
                      </p>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        De turno cancelado ({senaDisponible.servicioNombre})
                      </p>
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={usarSenaExistente}
                          onChange={(e) => setUsarSenaExistente(e.target.checked)}
                          className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-emerald-700">Usar esta seña para el nuevo turno</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

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
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{servicio.nombre}</p>
                        {servicio.precio_variable && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded">
                            Variable
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{servicio.duracion_minutos} min</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {servicio.precio_variable && <span className="text-xs font-normal text-gray-500">desde </span>}
                        {formatearMonto(servicio.precio)}
                      </p>
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

                {/* Seña que se aplicará */}
                {senaDisponible && usarSenaExistente && (
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between text-emerald-700">
                      <span className="flex items-center gap-1.5">
                        <Wallet className="w-4 h-4" />
                        Seña a aplicar
                      </span>
                      <span className="font-semibold">
                        -{formatearMonto(senaDisponible.montoSena)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-600">Saldo pendiente</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatearMonto(Math.max(0, (servicioSeleccionado?.precio || 0) - senaDisponible.montoSena))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Selector de fecha y hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={fechaSeleccionada}
                    min={getFechaHoyArgentina()}
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Hora
                  </label>
                  <select
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                      !horaEsValida ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    {horariosDisponibles.map(hora => (
                      <option key={hora} value={hora}>{hora}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!horaEsValida && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  No podés agendar más de 2 horas antes de la hora actual
                </p>
              )}

              {horaFin && horaEsValida && (
                <p className="text-sm text-gray-500">
                  Termina a las {formatearHora(horaFin)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer con botón de acción */}
        {paso === PASOS.CONFIRMAR && (
          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={handleGuardar}
              disabled={guardando || !horaEsValida}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
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

        {/* Modal alerta de superposición */}
        {alertaSuperposicion.mostrar && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 rounded-2xl" onClick={handleCancelarSuperposicion} />

            <div className="relative bg-white rounded-xl shadow-xl w-[90%] max-w-sm overflow-hidden">
              {/* Header con icono de alerta */}
              <div className="bg-amber-50 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-gray-900">
                    Turno Superpuesto
                  </h3>
                  <p className="text-xs text-amber-700">
                    Ya existe {alertaSuperposicion.turnosSuperpuestos.length === 1 ? 'un turno' : 'turnos'} en este horario
                  </p>
                </div>
              </div>

              {/* Lista de turnos superpuestos */}
              <div className="p-4">
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {alertaSuperposicion.turnosSuperpuestos.map((t) => {
                    const clienteNombre = t.cliente
                      ? `${t.cliente.nombre} ${t.cliente.apellido || ''}`.trim()
                      : 'Sin cliente'
                    const servicio = t.servicios?.[0]?.servicio?.nombre || 'Sin servicio'
                    const colorServicio = t.servicios?.[0]?.servicio?.color || '#6B7280'

                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div
                          className="w-1 h-8 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colorServicio }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800">
                            {formatearHora(t.hora_inicio)} - {formatearHora(t.hora_fin)}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {clienteNombre} • {servicio}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  ¿Agendar de todas formas?
                </p>
              </div>

              {/* Footer con botones */}
              <div className="border-t border-gray-200 px-4 py-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelarSuperposicion}
                  className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarSuperposicion}
                  disabled={guardando}
                  className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {guardando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Agendar igual'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para crear nuevo cliente */}
      <ModalCliente
        isOpen={mostrarModalCliente}
        onClose={() => setMostrarModalCliente(false)}
        onGuardar={handleNuevoClienteCreado}
      />
    </div>
  )
}
