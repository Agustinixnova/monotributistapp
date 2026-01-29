/**
 * Página pública para que clientes reserven turnos via link
 */

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  Calendar, Clock, User, Phone, Mail, MapPin, Instagram,
  Check, AlertCircle, Loader2, ArrowLeft, ArrowRight,
  ChevronLeft, ChevronRight, CalendarPlus
} from 'lucide-react'
import {
  getLinkByToken,
  getNegocioPublico,
  getServiciosByIds,
  usarLink
} from '../services/reservaLinksService'

// Formatear fecha
function formatFecha(fecha) {
  const date = new Date(fecha + 'T12:00:00')
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
}

// Estado inicial del formulario de datos
const FORM_INICIAL = {
  nombre: '',
  apellido: '',
  telefono: '',
  email: ''
}

// Generar URL de Google Calendar
function generarGoogleCalendarUrl({ titulo, fecha, hora, duracion, ubicacion, descripcion }) {
  const startDate = new Date(`${fecha}T${hora}:00`)
  const endDate = new Date(startDate.getTime() + duracion * 60000)

  const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: titulo,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: descripcion || '',
    location: ubicacion || ''
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default function ReservarPage() {
  const { token } = useParams()

  // Estados
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [link, setLink] = useState(null)
  const [negocio, setNegocio] = useState(null)
  const [servicios, setServicios] = useState([])
  const [slotsVerificados, setSlotsVerificados] = useState({})

  // Pasos del flujo
  const [step, setStep] = useState(1) // 1: servicio, 2: fecha/hora, 3: datos, 4: confirmación
  const [reservando, setReservando] = useState(false)
  const [reservaExitosa, setReservaExitosa] = useState(false)

  // Selección del usuario
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null)
  const [horaSeleccionada, setHoraSeleccionada] = useState(null)
  const [formDatos, setFormDatos] = useState(FORM_INICIAL)

  // Calcular totales de servicios seleccionados
  const totalesServicios = useMemo(() => {
    const seleccionados = servicios.filter(s => serviciosSeleccionados.includes(s.id))
    const duracionTotal = seleccionados.reduce((acc, s) => acc + (s.duracion_minutos || 0), 0)
    const precioTotal = seleccionados.reduce((acc, s) => acc + (s.precio || 0), 0)
    const hayVariables = seleccionados.some(s => s.precio_variable)
    return { duracionTotal, precioTotal, hayVariables, seleccionados }
  }, [servicios, serviciosSeleccionados])

  // Toggle servicio seleccionado
  const toggleServicio = (servicioId) => {
    setServiciosSeleccionados(prev => {
      if (prev.includes(servicioId)) {
        return prev.filter(id => id !== servicioId)
      } else {
        return [...prev, servicioId]
      }
    })
  }

  // Cargar datos del link
  useEffect(() => {
    async function cargarDatos() {
      setLoading(true)
      setError(null)

      try {
        // 1. Obtener el link
        const { data: linkData, error: linkError } = await getLinkByToken(token)
        if (linkError || !linkData) {
          throw new Error('Link no encontrado o inválido')
        }

        // Verificar estado
        if (linkData.estado === 'expirado') {
          throw new Error('Este link ha expirado')
        }
        if (linkData.estado === 'usado') {
          throw new Error('Este link ya fue utilizado')
        }

        setLink(linkData)

        // 2. Obtener datos del negocio
        const { data: negocioData } = await getNegocioPublico(linkData.profesional_id)
        setNegocio(negocioData)

        // 3. Obtener servicios habilitados
        const { data: serviciosData } = await getServiciosByIds(linkData.servicios_ids)
        setServicios(serviciosData || [])

        // 4. Si hay cliente asignado, prellenar datos
        if (linkData.cliente) {
          setFormDatos({
            nombre: linkData.cliente.nombre || '',
            apellido: linkData.cliente.apellido || '',
            telefono: linkData.cliente.telefono || '',
            email: linkData.cliente.email || ''
          })
        }

        // 5. Usar los slots del link directamente
        // (fueron verificados al momento de crear el link)
        // La verificación en tiempo real requiere autenticación
        setSlotsVerificados(linkData.slots_disponibles || {})

      } catch (err) {
        console.error('Error cargando link:', err)
        setError(err.message || 'Error al cargar el link de reserva')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      cargarDatos()
    }
  }, [token])

  // Fechas disponibles ordenadas
  const fechasDisponibles = useMemo(() => {
    return Object.keys(slotsVerificados).sort()
  }, [slotsVerificados])

  // Slots del día seleccionado
  const slotsDelDia = useMemo(() => {
    if (!fechaSeleccionada) return []
    return slotsVerificados[fechaSeleccionada] || []
  }, [fechaSeleccionada, slotsVerificados])

  // Validar paso actual
  const puedeAvanzar = () => {
    switch (step) {
      case 1:
        return serviciosSeleccionados.length > 0
      case 2:
        return fechaSeleccionada && horaSeleccionada
      case 3:
        // Si el link ya tiene cliente asociado, no requerimos datos
        if (link?.cliente_id) return true
        return formDatos.nombre.trim() && formDatos.apellido.trim() && formDatos.telefono.trim()
      default:
        return false
    }
  }

  // Realizar la reserva
  const handleConfirmarReserva = async () => {
    setReservando(true)

    try {
      const { data, error: reservaError } = await usarLink(link.id, {
        fecha: fechaSeleccionada,
        hora: horaSeleccionada,
        servicios_ids: serviciosSeleccionados,
        cliente_datos: link.cliente_id ? null : {
          nombre: formDatos.nombre,
          apellido: formDatos.apellido,
          telefono: formDatos.telefono,
          email: formDatos.email
        }
      })

      if (reservaError) throw reservaError

      setReservaExitosa(true)
    } catch (err) {
      console.error('Error reservando:', err)
      setError(err.message || 'Error al realizar la reserva')
    } finally {
      setReservando(false)
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link no disponible</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  // Reserva exitosa
  if (reservaExitosa) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reserva solicitada</h1>
          <p className="text-gray-600 mb-6">
            Tu turno está pendiente de confirmación.
            Te contactaremos pronto para confirmar.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3 mb-6">
            <div className="text-sm">
              <span className="text-gray-500">Servicio{totalesServicios.seleccionados.length > 1 ? 's' : ''}</span>
              <div className="mt-1">
                {totalesServicios.seleccionados.map(s => (
                  <div key={s.id} className="font-medium">{s.nombre}</div>
                ))}
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Duración total</span>
              <span className="font-medium">~{totalesServicios.duracionTotal} min</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Fecha</span>
              <span className="font-medium capitalize">{formatFecha(fechaSeleccionada)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Hora</span>
              <span className="font-medium">{horaSeleccionada}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold">
                {totalesServicios.hayVariables && <span className="text-xs font-normal text-gray-500">desde </span>}
                ${totalesServicios.precioTotal?.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {/* Botón para agregar al calendario */}
          <div className="mb-4">
            <a
              href={generarGoogleCalendarUrl({
                titulo: `Turno: ${totalesServicios.seleccionados.map(s => s.nombre).join(', ')}`,
                fecha: fechaSeleccionada,
                hora: horaSeleccionada,
                duracion: totalesServicios.duracionTotal,
                ubicacion: negocio?.direccion || '',
                descripcion: `Reserva en ${negocio?.nombre_negocio || 'el negocio'}. Servicios: ${totalesServicios.seleccionados.map(s => s.nombre).join(', ')}`
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              Agregar a mi calendario
            </a>
          </div>

          {negocio?.whatsapp && (
            <>
              <a
                href={`https://wa.me/${negocio.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                Contactar por WhatsApp
              </a>
              <p className="text-xs text-gray-500 text-center mt-3">
                Si hubo un error o querés realizar un cambio en tu reserva, contactanos.
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header con info del negocio - Diseño centrado y compacto */}
      <div className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          {/* Nombre y descripción centrados */}
          <div className="text-center mb-3">
            <h1 className="text-2xl font-heading font-bold text-gray-900">
              {negocio?.nombre_negocio || 'Reservar turno'}
            </h1>
            {negocio?.descripcion && (
              <p className="text-sm text-gray-500 mt-0.5">{negocio.descripcion}</p>
            )}
          </div>

          {/* Info de contacto compacta */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-500">
            {negocio?.whatsapp && (
              <a
                href={`https://wa.me/${negocio.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-green-600 hover:text-green-700"
              >
                <Phone className="w-3 h-3" />
                <span>{negocio.whatsapp}</span>
              </a>
            )}
            {negocio?.direccion && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {negocio.direccion}
                {(negocio?.localidad || negocio?.provincia) && (
                  <span className="text-gray-400">
                    {negocio.localidad && `, ${negocio.localidad}`}
                    {negocio.provincia && ` (${negocio.provincia})`}
                  </span>
                )}
              </span>
            )}
            {negocio?.instagram && (
              <a
                href={`https://instagram.com/${negocio.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-pink-600 hover:text-pink-700"
              >
                <Instagram className="w-3 h-3" />
                @{negocio.instagram.replace('@', '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {/* Indicador de pasos - Más compacto */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="flex items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  step === n
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : step > n
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {step > n ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              {n < 3 && (
                <div className={`w-8 h-0.5 mx-1 ${step > n ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Mensaje personalizado */}
        {link?.mensaje_personalizado && step === 1 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-sm text-blue-700 text-center">
            {link.mensaje_personalizado}
          </div>
        )}

        {/* Paso 1: Seleccionar servicios */}
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-gray-800 text-center">
              Seleccioná uno o más servicios
            </h2>
            <div className="space-y-2">
              {servicios.map(servicio => {
                const isSelected = serviciosSeleccionados.includes(servicio.id)
                const colorServicio = servicio.color || '#3B82F6'
                return (
                  <button
                    key={servicio.id}
                    onClick={() => toggleServicio(servicio.id)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Barra de color + Checkbox */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1 h-10 rounded-full"
                          style={{ backgroundColor: colorServicio }}
                        />
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">{servicio.nombre}</span>
                          {servicio.precio_variable && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              Variable
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ~{servicio.duracion_minutos} min
                          </span>
                          <span className="font-semibold text-gray-700">
                            {servicio.precio_variable && <span className="font-normal text-gray-400">desde </span>}
                            ${servicio.precio?.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Resumen de selección */}
            {serviciosSeleccionados.length > 0 && (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-3 text-white shadow-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {serviciosSeleccionados.length} servicio{serviciosSeleccionados.length > 1 ? 's' : ''}
                  </span>
                  <div className="text-right">
                    <div className="text-blue-100 text-xs">
                      <Clock className="w-3 h-3 inline mr-1" />
                      ~{totalesServicios.duracionTotal} min
                    </div>
                    <div className="font-bold text-lg">
                      {totalesServicios.hayVariables && <span className="text-xs font-normal text-blue-200">desde </span>}
                      ${totalesServicios.precioTotal?.toLocaleString('es-AR')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-[10px] text-gray-400 text-center">
              * La duración es aproximada. Los precios variables pueden incluir adicionales.
            </p>
          </div>
        )}

        {/* Paso 2: Seleccionar fecha y hora */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Selector de fecha */}
            <div>
              <h2 className="text-base font-semibold text-gray-800 text-center mb-3">
                Elegí el día
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {fechasDisponibles.map(fecha => {
                  const isSelected = fechaSeleccionada === fecha
                  return (
                    <button
                      key={fecha}
                      onClick={() => {
                        setFechaSeleccionada(fecha)
                        setHoraSeleccionada(null)
                      }}
                      className={`p-2 rounded-xl border-2 text-center transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className={`text-[10px] uppercase font-medium ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                        {new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-bold ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                        {new Date(fecha + 'T12:00:00').getDate()}
                      </div>
                      <div className={`text-[10px] ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                        {new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', { month: 'short' })}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selector de hora */}
            {fechaSeleccionada && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 text-center mb-2">
                  Horarios disponibles
                </h3>
                {slotsDelDia.length > 0 ? (
                  <div className="grid grid-cols-4 gap-1.5">
                    {slotsDelDia.map(hora => (
                      <button
                        key={hora}
                        onClick={() => setHoraSeleccionada(hora)}
                        className={`py-2.5 px-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                          horaSeleccionada === hora
                            ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                            : 'border-gray-100 bg-white text-gray-700 hover:border-blue-200'
                        }`}
                      >
                        {hora}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center text-sm py-4">
                    No hay horarios disponibles
                  </p>
                )}
              </div>
            )}

            {/* Resumen de selección */}
            {fechaSeleccionada && horaSeleccionada && (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-3 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium capitalize">{formatFecha(fechaSeleccionada)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-bold text-lg">{horaSeleccionada}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paso 3: Datos del cliente */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-800 text-center">
              Tus datos
            </h2>

            {link?.cliente_id && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm text-green-700 text-center">
                Ya tenemos tus datos registrados
              </div>
            )}

            <div className="space-y-3 bg-white rounded-xl p-4 border border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formDatos.nombre}
                    onChange={(e) => setFormDatos(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Tu nombre"
                    disabled={!!link?.cliente_id}
                    className="w-full px-3 py-2.5 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={formDatos.apellido}
                    onChange={(e) => setFormDatos(prev => ({ ...prev, apellido: e.target.value }))}
                    placeholder="Tu apellido"
                    disabled={!!link?.cliente_id}
                    className="w-full px-3 py-2.5 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  value={formDatos.telefono}
                  onChange={(e) => setFormDatos(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="Ej: 1123456789"
                  disabled={!!link?.cliente_id}
                  className="w-full px-3 py-2.5 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={formDatos.email}
                  onChange={(e) => setFormDatos(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="tu@email.com"
                  disabled={!!link?.cliente_id}
                  className="w-full px-3 py-2.5 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 text-sm"
                />
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-100">
              <h4 className="font-semibold text-gray-800 mb-3 text-sm">Resumen de tu reserva</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-gray-500">Servicio{totalesServicios.seleccionados.length > 1 ? 's' : ''}</span>
                  <div className="mt-1 space-y-0.5">
                    {totalesServicios.seleccionados.map(s => (
                      <div key={s.id} className="flex justify-between">
                        <span className="font-medium text-gray-800">{s.nombre}</span>
                        <span className="text-gray-500">
                          {s.precio_variable && 'desde '}${s.precio?.toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-500">Duración total</span>
                  <span className="font-medium text-gray-800">~{totalesServicios.duracionTotal} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha y hora</span>
                  <span className="font-medium text-gray-800 capitalize">{formatFecha(fechaSeleccionada)} - {horaSeleccionada}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                  <span className="font-medium text-gray-700">Total a pagar</span>
                  <span className="font-bold text-base text-gray-900">
                    {totalesServicios.hayVariables && <span className="text-xs font-normal text-gray-500">desde </span>}
                    ${totalesServicios.precioTotal?.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Botones de navegación - Fijos en la parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg safe-area-bottom">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center justify-center gap-2 px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!puedeAvanzar()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-200 disabled:shadow-none"
              >
                Continuar
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleConfirmarReserva}
                disabled={!puedeAvanzar() || reservando}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-base transition-all disabled:opacity-40 shadow-lg shadow-green-200"
              >
                {reservando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Reservando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirmar reserva
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
