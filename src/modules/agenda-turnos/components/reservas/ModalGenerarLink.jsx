/**
 * Modal para generar un link de reserva
 */

import { useState, useEffect } from 'react'
import {
  X, Link2, Calendar, Clock, User, MessageSquare,
  Loader2, Copy, Check, Share2, Scissors
} from 'lucide-react'
import { useServicios } from '../../hooks/useServicios'
import { useClientes } from '../../hooks/useClientes'
import { useDisponibilidad } from '../../hooks/useDisponibilidad'
import { useReservaLinks } from '../../hooks/useReservaLinks'
import { getTurnos } from '../../services/turnosService'
import SelectorSlots from './SelectorSlots'

export default function ModalGenerarLink({ isOpen, onClose }) {
  const { servicios, loading: loadingServicios } = useServicios()
  const { clientes, loading: loadingClientes } = useClientes()
  const { disponibilidad, loading: loadingDisp } = useDisponibilidad()
  const { crear, saving } = useReservaLinks()

  // Estado del formulario
  const [step, setStep] = useState(1) // 1: config, 2: slots, 3: resultado
  const [linkGenerado, setLinkGenerado] = useState(null)
  const [copiado, setCopiado] = useState(false)

  const [form, setForm] = useState({
    cliente_id: '',
    servicios_ids: [],
    fecha_desde: '',
    fecha_hasta: '',
    mensaje_personalizado: '',
    horas_expiracion: 48
  })

  const [slotsSeleccionados, setSlotsSeleccionados] = useState({})
  const [turnosExistentes, setTurnosExistentes] = useState([])
  const [loadingTurnos, setLoadingTurnos] = useState(false)
  const [error, setError] = useState(null)

  // Inicializar fechas por defecto (hoy + 7 días)
  useEffect(() => {
    if (isOpen) {
      const hoy = new Date()
      const enUnaSemana = new Date()
      enUnaSemana.setDate(enUnaSemana.getDate() + 7)

      setForm(prev => ({
        ...prev,
        fecha_desde: hoy.toISOString().split('T')[0],
        fecha_hasta: enUnaSemana.toISOString().split('T')[0]
      }))
      setStep(1)
      setLinkGenerado(null)
      setSlotsSeleccionados({})
      setError(null)
    }
  }, [isOpen])

  // Toggle servicio
  const handleToggleServicio = (servicioId) => {
    setForm(prev => {
      const ids = prev.servicios_ids.includes(servicioId)
        ? prev.servicios_ids.filter(id => id !== servicioId)
        : [...prev.servicios_ids, servicioId]
      return { ...prev, servicios_ids: ids }
    })
  }

  // Validar paso 1
  const validarPaso1 = () => {
    if (form.servicios_ids.length === 0) {
      setError('Seleccioná al menos un servicio')
      return false
    }
    if (!form.fecha_desde || !form.fecha_hasta) {
      setError('Seleccioná el rango de fechas')
      return false
    }
    if (form.fecha_desde > form.fecha_hasta) {
      setError('La fecha desde debe ser anterior a la fecha hasta')
      return false
    }
    setError(null)
    return true
  }

  // Cargar turnos existentes para el rango de fechas
  const cargarTurnosExistentes = async () => {
    setLoadingTurnos(true)
    try {
      const { data, error } = await getTurnos(form.fecha_desde, form.fecha_hasta)
      if (error) throw error
      setTurnosExistentes(data || [])
    } catch (err) {
      console.error('Error cargando turnos:', err)
      setTurnosExistentes([])
    } finally {
      setLoadingTurnos(false)
    }
  }

  // Ir al paso de slots
  const handleContinuar = async () => {
    if (validarPaso1()) {
      await cargarTurnosExistentes()
      setStep(2)
    }
  }

  // Generar el link
  const handleGenerarLink = async () => {
    const totalSlots = Object.values(slotsSeleccionados).reduce((acc, arr) => acc + arr.length, 0)

    if (totalSlots === 0) {
      setError('Seleccioná al menos un horario disponible')
      return
    }

    setError(null)

    const { success, data, error: createError } = await crear({
      cliente_id: form.cliente_id || null,
      servicios_ids: form.servicios_ids,
      fecha_desde: form.fecha_desde,
      fecha_hasta: form.fecha_hasta,
      slots_disponibles: slotsSeleccionados,
      mensaje_personalizado: form.mensaje_personalizado || null,
      horas_expiracion: form.horas_expiracion
    })

    if (success) {
      setLinkGenerado(data)
      setStep(3)
    } else {
      setError(createError?.message || 'Error al generar el link')
    }
  }

  // Copiar link al portapapeles
  const handleCopiarLink = async () => {
    const url = `${window.location.origin}/reservar/${linkGenerado.token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (err) {
      console.error('Error copiando link:', err)
    }
  }

  // Compartir por WhatsApp
  const handleCompartirWhatsApp = () => {
    const url = `${window.location.origin}/reservar/${linkGenerado.token}`
    const clienteNombre = linkGenerado.cliente?.nombre || 'cliente'

    let mensaje = `Hola ${clienteNombre}! Te comparto el link para que reserves tu turno:`
    if (linkGenerado.mensaje_personalizado) {
      mensaje = linkGenerado.mensaje_personalizado
    }
    mensaje += `\n\n${url}`

    const whatsappUrl = linkGenerado.cliente?.telefono
      ? `https://wa.me/${linkGenerado.cliente.telefono}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`

    window.open(whatsappUrl, '_blank')
  }

  if (!isOpen) return null

  const loading = loadingServicios || loadingClientes || loadingDisp

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-lg">Generar link de reserva</h2>
              <p className="text-sm text-gray-500">
                {step === 1 && 'Configurar servicios y fechas'}
                {step === 2 && 'Seleccionar horarios disponibles'}
                {step === 3 && 'Link generado'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* Paso 1: Configuración */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Cliente (opcional) */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4" />
                      Cliente (opcional)
                    </label>
                    <select
                      value={form.cliente_id}
                      onChange={(e) => setForm(prev => ({ ...prev, cliente_id: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sin cliente específico</option>
                      {clientes.map(cliente => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nombre} {cliente.apellido}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Si no seleccionás un cliente, quien use el link deberá ingresar sus datos
                    </p>
                  </div>

                  {/* Servicios */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Scissors className="w-4 h-4" />
                        Servicios habilitados *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const todosIds = servicios.map(s => s.id)
                          const todosMarcados = todosIds.every(id => form.servicios_ids.includes(id))
                          setForm(prev => ({
                            ...prev,
                            servicios_ids: todosMarcados ? [] : todosIds
                          }))
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {servicios.length > 0 && servicios.every(s => form.servicios_ids.includes(s.id))
                          ? 'Deseleccionar todos'
                          : 'Seleccionar todos'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {servicios.map(servicio => (
                        <button
                          key={servicio.id}
                          onClick={() => handleToggleServicio(servicio.id)}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            form.servicios_ids.includes(servicio.id)
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-sm">{servicio.nombre}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {servicio.duracion_minutos} min - ${servicio.precio?.toLocaleString('es-AR')}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fechas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4" />
                        Desde *
                      </label>
                      <input
                        type="date"
                        value={form.fecha_desde}
                        onChange={(e) => setForm(prev => ({ ...prev, fecha_desde: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4" />
                        Hasta *
                      </label>
                      <input
                        type="date"
                        value={form.fecha_hasta}
                        onChange={(e) => setForm(prev => ({ ...prev, fecha_hasta: e.target.value }))}
                        min={form.fecha_desde || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Nota de expiración */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                    <Clock className="w-4 h-4" />
                    <span>El link expira en 48 horas</span>
                  </div>

                  {/* Mensaje personalizado */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <MessageSquare className="w-4 h-4" />
                      Mensaje personalizado (opcional)
                    </label>
                    <textarea
                      value={form.mensaje_personalizado}
                      onChange={(e) => setForm(prev => ({ ...prev, mensaje_personalizado: e.target.value }))}
                      placeholder="Ej: Hola! Te comparto el link para que reserves tu turno de esta semana..."
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Paso 2: Selección de slots */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                    Seleccioná los horarios que querés habilitar para que el cliente pueda elegir.
                    Solo se mostrarán los días que tenés disponibilidad configurada.
                  </div>

                  {loadingTurnos ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      <span className="ml-2 text-gray-500">Cargando turnos existentes...</span>
                    </div>
                  ) : (
                    <SelectorSlots
                      fechaDesde={form.fecha_desde}
                      fechaHasta={form.fecha_hasta}
                      slotsSeleccionados={slotsSeleccionados}
                      onChange={setSlotsSeleccionados}
                      disponibilidadProfesional={disponibilidad}
                      turnosExistentes={turnosExistentes}
                      intervaloMinutos={30}
                    />
                  )}
                </div>
              )}

              {/* Paso 3: Resultado */}
              {step === 3 && linkGenerado && (
                <div className="space-y-6">
                  {/* Success message */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-heading font-semibold text-green-800 text-lg">
                      Link generado correctamente
                    </h3>
                    <p className="text-sm text-green-600 mt-1">
                      Expira en {form.horas_expiracion} horas
                    </p>
                  </div>

                  {/* Link display */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Link de reserva</label>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 bg-white px-3 py-2 rounded border text-sm overflow-x-auto">
                        {window.location.origin}/reservar/{linkGenerado.token}
                      </code>
                      <button
                        onClick={handleCopiarLink}
                        className={`p-2.5 rounded-lg transition-colors ${
                          copiado
                            ? 'bg-green-100 text-green-600'
                            : 'bg-white border hover:bg-gray-50'
                        }`}
                      >
                        {copiado ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Resumen */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Cliente</span>
                      <span className="font-medium">
                        {linkGenerado.cliente
                          ? `${linkGenerado.cliente.nombre} ${linkGenerado.cliente.apellido}`
                          : 'Cualquier cliente'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Servicios</span>
                      <span className="font-medium">{form.servicios_ids.length} habilitados</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Horarios disponibles</span>
                      <span className="font-medium">
                        {Object.values(slotsSeleccionados).reduce((acc, arr) => acc + arr.length, 0)} slots
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleCompartirWhatsApp}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                      Compartir por WhatsApp
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {step !== 3 && (
          <div className="px-5 py-4 border-t flex items-center justify-between">
            {step === 1 ? (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleContinuar}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Continuar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Volver
                </button>
                <button
                  onClick={handleGenerarLink}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Generar link
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="px-5 py-4 border-t">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
