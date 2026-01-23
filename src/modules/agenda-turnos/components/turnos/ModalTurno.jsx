/**
 * Modal para crear/editar turnos
 */

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, User, Scissors, Search, Plus, Loader2, Check, Repeat } from 'lucide-react'
import { formatearMonto, getEstadoConfig, ESTADOS_TURNO } from '../../utils/formatters'
import { formatDuracion, sumarMinutosAHora, getFechaHoyArgentina, formatFechaLarga, generarSlotsTiempo } from '../../utils/dateUtils'
import { TIPOS_RECURRENCIA, generarFechasRecurrentes } from '../../utils/recurrenciaUtils'
import useServicios from '../../hooks/useServicios'
import useClientes from '../../hooks/useClientes'
import ModalCliente from '../clientes/ModalCliente'

export default function ModalTurno({
  isOpen,
  onClose,
  onGuardar,
  turno = null, // null = crear nuevo
  fechaInicial = null,
  horaInicial = null,
  servicios: serviciosProp = null, // Pasar servicios externos o cargar internamente
  clientes: clientesProp = null,
  onNuevoCliente = null // Callback para crear cliente desde padre
}) {
  // Usar props si están disponibles, sino cargar internamente
  const { servicios: serviciosInterno, loading: loadingServiciosInterno } = useServicios()
  const { clientes: clientesInterno, buscar: buscarClientes } = useClientes({ autoLoad: false })

  const servicios = serviciosProp || serviciosInterno
  const loadingServicios = serviciosProp ? false : loadingServiciosInterno

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clientesBuscados, setClientesBuscados] = useState([])
  const [buscandoClientes, setBuscandoClientes] = useState(false)
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false)

  const [form, setForm] = useState({
    fecha: getFechaHoyArgentina(),
    hora_inicio: '09:00',
    cliente_id: null,
    cliente: null,
    servicios_seleccionados: [],
    notas: '',
    estado: 'pendiente'
  })

  // Configuración de recurrencia (solo para nuevos turnos)
  const [esRecurrente, setEsRecurrente] = useState(false)
  const [recurrencia, setRecurrencia] = useState({
    tipo: 'semanal',
    cantidad: 4
  })

  // Reset form cuando se abre/cierra o cambia el turno
  useEffect(() => {
    if (isOpen) {
      if (turno) {
        // Editar turno existente
        setForm({
          fecha: turno.fecha,
          hora_inicio: turno.hora_inicio?.substring(0, 5) || '09:00',
          cliente_id: turno.cliente_id,
          cliente: turno.cliente,
          servicios_seleccionados: turno.servicios?.map(s => ({
            servicio_id: s.servicio_id || s.servicio?.id,
            servicio: s.servicio,
            precio: s.precio,
            duracion: s.duracion
          })) || [],
          notas: turno.notas || '',
          estado: turno.estado || 'pendiente'
        })
      } else {
        // Nuevo turno
        setForm({
          fecha: fechaInicial || getFechaHoyArgentina(),
          hora_inicio: horaInicial || '09:00',
          cliente_id: null,
          cliente: null,
          servicios_seleccionados: [],
          notas: '',
          estado: 'pendiente'
        })
        // Reset recurrencia
        setEsRecurrente(false)
        setRecurrencia({ tipo: 'semanal', cantidad: 4 })
      }
      setError(null)
      setBusquedaCliente('')
      setClientesBuscados([])
    }
  }, [isOpen, turno, fechaInicial, horaInicial])

  // Buscar clientes cuando cambia el texto
  useEffect(() => {
    const buscar = async () => {
      if (busquedaCliente.length < 2) {
        setClientesBuscados([])
        return
      }

      setBuscandoClientes(true)
      try {
        // Si tenemos clientes del padre, filtrar localmente
        if (clientesProp) {
          const filtrados = clientesProp.filter(c => {
            const nombre = `${c.nombre} ${c.apellido || ''}`.toLowerCase()
            return nombre.includes(busquedaCliente.toLowerCase())
          }).slice(0, 6)
          setClientesBuscados(filtrados)
        } else {
          // Buscar en el servidor
          const resultados = await buscarClientes(busquedaCliente)
          setClientesBuscados(resultados)
        }
      } catch (err) {
        console.error('Error buscando clientes:', err)
      }
      setBuscandoClientes(false)
    }

    const timeout = setTimeout(buscar, 300)
    return () => clearTimeout(timeout)
  }, [busquedaCliente, clientesProp])

  // Calcular totales
  const duracionTotal = form.servicios_seleccionados.reduce((sum, s) => sum + (s.duracion || 0), 0)
  const horaFin = sumarMinutosAHora(form.hora_inicio, duracionTotal)
  const precioTotal = form.servicios_seleccionados.reduce((sum, s) => sum + (s.precio || 0), 0)

  // Seleccionar cliente
  const handleSelectCliente = (cliente) => {
    setForm(f => ({ ...f, cliente_id: cliente.id, cliente }))
    setBusquedaCliente('')
    setClientesBuscados([])
  }

  // Quitar cliente
  const handleQuitarCliente = () => {
    setForm(f => ({ ...f, cliente_id: null, cliente: null }))
  }

  // Toggle servicio
  const handleToggleServicio = (servicio) => {
    setForm(f => {
      const yaSeleccionado = f.servicios_seleccionados.find(s => s.servicio_id === servicio.id)
      if (yaSeleccionado) {
        return {
          ...f,
          servicios_seleccionados: f.servicios_seleccionados.filter(s => s.servicio_id !== servicio.id)
        }
      } else {
        return {
          ...f,
          servicios_seleccionados: [...f.servicios_seleccionados, {
            servicio_id: servicio.id,
            servicio,
            precio: servicio.precio,
            duracion: servicio.duracion_minutos
          }]
        }
      }
    })
  }

  // Crear nuevo cliente desde el modal
  const handleNuevoCliente = async (clienteData) => {
    // El cliente se creará y seleccionará
    setForm(f => ({
      ...f,
      cliente_id: clienteData.id,
      cliente: clienteData
    }))
    setMostrarNuevoCliente(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (form.servicios_seleccionados.length === 0) {
      setError('Seleccioná al menos un servicio')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const turnoData = {
        fecha: form.fecha,
        hora_inicio: form.hora_inicio + ':00', // Agregar segundos
        hora_fin: horaFin + ':00',
        cliente_id: form.cliente_id,
        servicios: form.servicios_seleccionados.map(s => ({
          servicio_id: s.servicio_id,
          precio: s.precio,
          duracion: s.duracion
        })),
        notas: form.notas || null,
        estado: form.estado
      }

      // Agregar datos de recurrencia si aplica
      if (esRecurrente && !turno) {
        turnoData.es_recurrente = true
        turnoData.recurrencia = {
          tipo: recurrencia.tipo,
          cantidad: recurrencia.cantidad
        }
      }

      await onGuardar(turnoData)
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar turno')
    } finally {
      setLoading(false)
    }
  }

  // Horarios disponibles para el día
  const horariosDisponibles = generarSlotsTiempo('08:00', '21:00', 30)

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg">
                    {turno ? 'Editar Turno' : 'Nuevo Turno'}
                  </h3>
                  <p className="text-blue-100 text-sm">{formatFechaLarga(form.fecha)}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm(f => ({ ...f, fecha: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Hora
                  </label>
                  <select
                    value={form.hora_inicio}
                    onChange={(e) => setForm(f => ({ ...f, hora_inicio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {horariosDisponibles.map(hora => (
                      <option key={hora} value={hora}>{hora}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Cliente
                </label>

                {form.cliente ? (
                  // Cliente seleccionado
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-medium">
                        {form.cliente.nombre?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {form.cliente.nombre} {form.cliente.apellido || ''}
                        </p>
                        {form.cliente.whatsapp && (
                          <p className="text-xs text-gray-500">{form.cliente.whatsapp}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleQuitarCliente}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  // Buscador de cliente
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={busquedaCliente}
                      onChange={(e) => setBusquedaCliente(e.target.value)}
                      placeholder="Buscar por nombre o teléfono..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />

                    {/* Resultados de búsqueda */}
                    {(busquedaCliente.length >= 2 || clientesBuscados.length > 0) && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {buscandoClientes ? (
                          <div className="p-3 text-center text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                            Buscando...
                          </div>
                        ) : clientesBuscados.length > 0 ? (
                          clientesBuscados.map(cliente => (
                            <button
                              key={cliente.id}
                              onClick={() => handleSelectCliente(cliente)}
                              className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm">
                                {cliente.nombre?.charAt(0)?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {cliente.nombre} {cliente.apellido || ''}
                                </p>
                                {cliente.whatsapp && (
                                  <p className="text-xs text-gray-500">{cliente.whatsapp}</p>
                                )}
                              </div>
                            </button>
                          ))
                        ) : busquedaCliente.length >= 2 ? (
                          <div className="p-3 text-center text-gray-500 text-sm">
                            No se encontraron clientes
                          </div>
                        ) : null}

                        {/* Botón crear nuevo */}
                        <button
                          onClick={() => {
                            if (onNuevoCliente) {
                              onNuevoCliente()
                            } else {
                              setMostrarNuevoCliente(true)
                            }
                          }}
                          className="w-full px-3 py-2 flex items-center gap-2 text-blue-600 hover:bg-blue-50 border-t"
                        >
                          <Plus className="w-4 h-4" />
                          Crear nuevo cliente
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Servicios */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Scissors className="w-4 h-4 inline mr-1" />
                  Servicios *
                </label>

                {loadingServicios ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin inline text-gray-400" />
                  </div>
                ) : servicios.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No hay servicios creados
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {servicios.map(servicio => {
                      const seleccionado = form.servicios_seleccionados.find(s => s.servicio_id === servicio.id)
                      return (
                        <button
                          key={servicio.id}
                          onClick={() => handleToggleServicio(servicio)}
                          className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                            seleccionado
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-3 h-10 rounded-full flex-shrink-0"
                            style={{ backgroundColor: servicio.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{servicio.nombre}</p>
                            <p className="text-xs text-gray-500">
                              {formatDuracion(servicio.duracion_minutos)} • {formatearMonto(servicio.precio)}
                            </p>
                          </div>
                          {seleccionado && (
                            <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm(f => ({ ...f, notas: e.target.value }))}
                  placeholder="Observaciones para este turno..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Recurrencia (solo para nuevos turnos) */}
              {!turno && (
                <div className="border-t pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={esRecurrente}
                      onChange={(e) => setEsRecurrente(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Repeat className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Turno recurrente</span>
                  </label>

                  {esRecurrente && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Repetir
                          </label>
                          <select
                            value={recurrencia.tipo}
                            onChange={(e) => setRecurrencia(r => ({ ...r, tipo: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          >
                            {TIPOS_RECURRENCIA.map(tipo => (
                              <option key={tipo.id} value={tipo.id}>
                                {tipo.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Cantidad de turnos
                          </label>
                          <select
                            value={recurrencia.cantidad}
                            onChange={(e) => setRecurrencia(r => ({ ...r, cantidad: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          >
                            {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                              <option key={n} value={n}>
                                {n} turnos
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Preview de fechas */}
                      <div className="text-xs text-purple-700">
                        <p className="font-medium mb-1">Fechas:</p>
                        <div className="flex flex-wrap gap-1">
                          {generarFechasRecurrentes({
                            fechaInicio: form.fecha,
                            tipo: recurrencia.tipo,
                            cantidad: recurrencia.cantidad
                          }).slice(0, 6).map((f, i) => (
                            <span key={i} className="px-2 py-0.5 bg-purple-200 rounded">
                              {new Date(f + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                            </span>
                          ))}
                          {recurrencia.cantidad > 6 && (
                            <span className="px-2 py-0.5 text-purple-600">
                              +{recurrencia.cantidad - 6} más
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Estado (solo en edición) */}
              {turno && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ESTADOS_TURNO).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setForm(f => ({ ...f, estado: key }))}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          form.estado === key
                            ? `${config.bgClass} ${config.textClass} ring-2 ring-offset-1`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        style={form.estado === key ? { ringColor: config.borderClass?.replace('border-', '') } : {}}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen */}
              {form.servicios_seleccionados.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-blue-700">Duración total</span>
                    <span className="font-medium text-blue-800">
                      {formatDuracion(duracionTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-blue-700">Horario</span>
                    <span className="font-medium text-blue-800">
                      {form.hora_inicio} - {horaFin}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="font-medium text-blue-700">Total</span>
                    <span className="text-xl font-bold text-blue-800">
                      {formatearMonto(precioTotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-5 py-4 flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || form.servicios_seleccionados.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  turno ? 'Guardar cambios' : 'Crear turno'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal nuevo cliente (solo si no hay callback externo) */}
      {!onNuevoCliente && (
        <ModalCliente
          isOpen={mostrarNuevoCliente}
          onClose={() => setMostrarNuevoCliente(false)}
          onGuardar={handleNuevoCliente}
        />
      )}
    </>
  )
}
