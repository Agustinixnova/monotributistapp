/**
 * Modal de Ficha Completa del Cliente
 * Muestra datos editables, estadísticas e historial de turnos
 */

import { useState, useEffect } from 'react'
import {
  X, User, Mail, Phone, Instagram, MapPin, FileText, Calendar,
  Clock, DollarSign, TrendingUp, Star, CheckCircle, XCircle,
  Loader2, Save, Edit2, MessageCircle, ChevronDown, AlertCircle,
  Navigation, Receipt
} from 'lucide-react'
import { supabase } from '../../../../lib/supabase'
import { getEffectiveUserId } from '../../../caja-diaria/services/empleadosService'
import { updateCliente } from '../../services/clientesService'
import { formatFechaCorta, formatFechaLarga } from '../../utils/dateUtils'
import { formatearMonto } from '../../utils/formatters'
import { useNegocio } from '../../hooks/useNegocio'
import { useFacturacion } from '../../hooks/useFacturacion'

const ORIGENES = [
  { value: '', label: 'Sin especificar' },
  { value: 'recomendacion', label: 'Recomendación' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'google', label: 'Google' },
  { value: 'otros', label: 'Otros' }
]

const ORIGENES_MAP = {
  recomendacion: 'Recomendación',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  google: 'Google',
  otros: 'Otros'
}

const PROVINCIAS_ARGENTINA = [
  { value: '', label: 'Seleccionar...' },
  { value: 'Buenos Aires', label: 'Buenos Aires' },
  { value: 'CABA', label: 'Ciudad Autónoma de Buenos Aires' },
  { value: 'Catamarca', label: 'Catamarca' },
  { value: 'Chaco', label: 'Chaco' },
  { value: 'Chubut', label: 'Chubut' },
  { value: 'Córdoba', label: 'Córdoba' },
  { value: 'Corrientes', label: 'Corrientes' },
  { value: 'Entre Ríos', label: 'Entre Ríos' },
  { value: 'Formosa', label: 'Formosa' },
  { value: 'Jujuy', label: 'Jujuy' },
  { value: 'La Pampa', label: 'La Pampa' },
  { value: 'La Rioja', label: 'La Rioja' },
  { value: 'Mendoza', label: 'Mendoza' },
  { value: 'Misiones', label: 'Misiones' },
  { value: 'Neuquén', label: 'Neuquén' },
  { value: 'Río Negro', label: 'Río Negro' },
  { value: 'Salta', label: 'Salta' },
  { value: 'San Juan', label: 'San Juan' },
  { value: 'San Luis', label: 'San Luis' },
  { value: 'Santa Cruz', label: 'Santa Cruz' },
  { value: 'Santa Fe', label: 'Santa Fe' },
  { value: 'Santiago del Estero', label: 'Santiago del Estero' },
  { value: 'Tierra del Fuego', label: 'Tierra del Fuego' },
  { value: 'Tucumán', label: 'Tucumán' }
]

export default function ModalFichaCliente({ clienteId, isOpen, onClose, onClienteActualizado }) {
  const { tieneDomicilio } = useNegocio()
  const { tieneModuloPremium: tieneFacturacion } = useFacturacion()
  const [cliente, setCliente] = useState(null)
  const [turnos, setTurnos] = useState([])
  const [estadisticas, setEstadisticas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [error, setError] = useState(null)
  const [mostrarMapa, setMostrarMapa] = useState(false)

  // Formulario de edición
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    whatsapp: '',
    email: '',
    instagram: '',
    origen: '',
    notas: '',
    direccion: '',
    piso: '',
    departamento: '',
    localidad: '',
    provincia: '',
    indicaciones_ubicacion: '',
    // Facturación
    tipoFacturacion: 'consumidor_final', // consumidor_final | factura_cuit
    cuit: ''
  })

  useEffect(() => {
    if (isOpen && clienteId) {
      cargarDatos()
    }
  }, [isOpen, clienteId])

  const cargarDatos = async () => {
    setLoading(true)
    setError(null)
    try {
      // Cargar cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from('agenda_clientes')
        .select('*')
        .eq('id', clienteId)
        .single()

      if (clienteError) throw clienteError
      setCliente(clienteData)

      // Inicializar formulario
      // Si tiene CUIT con 11 dígitos, es factura_cuit, sino es consumidor_final
      const tieneCuitValido = clienteData.cuit && clienteData.cuit.replace(/\D/g, '').length === 11
      setForm({
        nombre: clienteData.nombre || '',
        apellido: clienteData.apellido || '',
        whatsapp: clienteData.whatsapp || '',
        email: clienteData.email || '',
        instagram: clienteData.instagram || '',
        origen: clienteData.origen || '',
        notas: clienteData.notas || '',
        direccion: clienteData.direccion || '',
        piso: clienteData.piso || '',
        departamento: clienteData.departamento || '',
        localidad: clienteData.localidad || '',
        provincia: clienteData.provincia || '',
        indicaciones_ubicacion: clienteData.indicaciones_ubicacion || '',
        // Facturación
        tipoFacturacion: tieneCuitValido ? 'factura_cuit' : 'consumidor_final',
        cuit: clienteData.cuit || ''
      })

      // Cargar turnos del cliente
      const { data: turnosData } = await supabase
        .from('agenda_turnos')
        .select(`
          *,
          servicios:agenda_turno_servicios(
            id,
            precio,
            duracion,
            servicio:agenda_servicios(id, nombre, color)
          ),
          pagos:agenda_turno_pagos(
            id,
            tipo,
            monto,
            fecha_pago
          )
        `)
        .eq('cliente_id', clienteId)
        .order('fecha', { ascending: false })
        .limit(50)

      setTurnos(turnosData || [])
      calcularEstadisticas(turnosData || [])
    } catch (err) {
      console.error('Error cargando ficha:', err)
      setError('Error al cargar los datos del cliente')
    }
    setLoading(false)
  }

  const calcularEstadisticas = (turnosData) => {
    const stats = {
      totalTurnos: turnosData.length,
      completados: 0,
      cancelados: 0,
      noAsistio: 0,
      pendientes: 0,
      totalGastado: 0,
      promedioGasto: 0,
      ultimaVisita: null,
      primeraVisita: null,
      serviciosFavoritos: {},
      tasaAsistencia: 0
    }

    turnosData.forEach(turno => {
      if (turno.estado === 'completado') {
        stats.completados++
        const pagos = turno.pagos || []
        pagos.forEach(pago => {
          if (pago.tipo !== 'devolucion') {
            stats.totalGastado += parseFloat(pago.monto) || 0
          } else {
            stats.totalGastado -= parseFloat(pago.monto) || 0
          }
        })
        const servicios = turno.servicios || []
        servicios.forEach(s => {
          const nombre = s.servicio?.nombre || 'Sin nombre'
          stats.serviciosFavoritos[nombre] = (stats.serviciosFavoritos[nombre] || 0) + 1
        })
      } else if (turno.estado === 'cancelado') {
        stats.cancelados++
      } else if (turno.estado === 'no_asistio') {
        stats.noAsistio++
      } else if (['pendiente', 'confirmado'].includes(turno.estado)) {
        stats.pendientes++
      }

      if (turno.estado === 'completado') {
        if (!stats.ultimaVisita || turno.fecha > stats.ultimaVisita) {
          stats.ultimaVisita = turno.fecha
        }
      }
      if (!stats.primeraVisita || turno.fecha < stats.primeraVisita) {
        stats.primeraVisita = turno.fecha
      }
    })

    if (stats.completados > 0) {
      stats.promedioGasto = stats.totalGastado / stats.completados
    }

    const turnosRelevantes = stats.completados + stats.cancelados + stats.noAsistio
    if (turnosRelevantes > 0) {
      stats.tasaAsistencia = (stats.completados / turnosRelevantes) * 100
    }

    stats.topServicios = Object.entries(stats.serviciosFavoritos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))

    setEstadisticas(stats)
  }

  const handleGuardar = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    setGuardando(true)
    setError(null)

    try {
      // Procesar CUIT: solo guardar si es factura_cuit Y tiene 11 dígitos
      let cuitParaGuardar = null
      if (form.tipoFacturacion === 'factura_cuit') {
        const cuitLimpio = form.cuit.replace(/\D/g, '')
        if (cuitLimpio.length === 11) {
          cuitParaGuardar = cuitLimpio
        }
      }

      const { data, error: updateError } = await updateCliente(clienteId, {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
        instagram: form.instagram.trim() || null,
        origen: form.origen || null,
        notas: form.notas.trim() || null,
        direccion: form.direccion.trim() || null,
        piso: form.piso.trim() || null,
        departamento: form.departamento.trim() || null,
        localidad: form.localidad.trim() || null,
        provincia: form.provincia.trim() || null,
        indicaciones_ubicacion: form.indicaciones_ubicacion.trim() || null,
        cuit: cuitParaGuardar
      })

      if (updateError) throw updateError

      setCliente(data)
      setEditando(false)
      onClienteActualizado?.(data)
    } catch (err) {
      setError(err.message || 'Error al guardar')
    }
    setGuardando(false)
  }

  const cancelarEdicion = () => {
    const tieneCuitValido = cliente?.cuit && cliente.cuit.replace(/\D/g, '').length === 11
    setForm({
      nombre: cliente?.nombre || '',
      apellido: cliente?.apellido || '',
      whatsapp: cliente?.whatsapp || '',
      email: cliente?.email || '',
      instagram: cliente?.instagram || '',
      origen: cliente?.origen || '',
      notas: cliente?.notas || '',
      direccion: cliente?.direccion || '',
      piso: cliente?.piso || '',
      departamento: cliente?.departamento || '',
      localidad: cliente?.localidad || '',
      provincia: cliente?.provincia || '',
      indicaciones_ubicacion: cliente?.indicaciones_ubicacion || '',
      tipoFacturacion: tieneCuitValido ? 'factura_cuit' : 'consumidor_final',
      cuit: cliente?.cuit || ''
    })
    setEditando(false)
    setError(null)
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { color: 'bg-yellow-100 text-yellow-700', label: 'Pendiente' },
      confirmado: { color: 'bg-green-100 text-green-700', label: 'Confirmado' },
      completado: { color: 'bg-gray-100 text-gray-700', label: 'Completado' },
      cancelado: { color: 'bg-red-100 text-red-700', label: 'Cancelado' },
      no_asistio: { color: 'bg-orange-100 text-orange-700', label: 'No asistió' }
    }
    return badges[estado] || { color: 'bg-gray-100 text-gray-600', label: estado }
  }

  // Verificar campos incompletos
  const camposIncompletos = cliente && (
    !cliente.whatsapp || !cliente.email || !cliente.instagram || !cliente.origen
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-start justify-center p-4 py-8">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {cliente?.nombre?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-emerald-100 text-xs uppercase tracking-wide mb-0.5">Ficha del cliente</p>
                  <h3 className="font-heading font-semibold text-xl">
                    {cliente?.nombre} {cliente?.apellido || ''}
                  </h3>
                  <p className="text-emerald-100 text-sm">
                    Cliente desde {cliente?.created_at ? formatFechaCorta(cliente.created_at.split('T')[0]) : '-'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {/* Alerta de campos incompletos */}
              {camposIncompletos && !editando && (
                <div className="mx-5 mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-800">Ficha incompleta</p>
                    <p className="text-xs text-amber-600">Faltan algunos datos del cliente</p>
                  </div>
                  <button
                    onClick={() => setEditando(true)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"
                  >
                    Completar
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mx-5 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Datos del Cliente */}
              <div className="p-5 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Datos del cliente
                  </h4>
                  {!editando ? (
                    <button
                      onClick={() => setEditando(true)}
                      className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={cancelarEdicion}
                        disabled={guardando}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancelar
                      </button>
                      {cliente?.whatsapp && (
                        <a
                          href={`https://wa.me/${cliente.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {editando ? (
                  /* Modo edición */
                  <div className="space-y-4">
                    {/* Fila 1: Nombre, Apellido, WhatsApp, Email */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
                        <input
                          type="text"
                          value={form.nombre}
                          onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Apellido</label>
                        <input
                          type="text"
                          value={form.apellido}
                          onChange={(e) => setForm(f => ({ ...f, apellido: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp</label>
                        <input
                          type="tel"
                          value={form.whatsapp}
                          onChange={(e) => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                          placeholder="Número"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="correo@ejemplo.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Fila 2: Instagram, Origen */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Instagram</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                          <input
                            type="text"
                            value={form.instagram}
                            onChange={(e) => setForm(f => ({ ...f, instagram: e.target.value.replace('@', '') }))}
                            placeholder="usuario"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">¿Cómo nos conoció?</label>
                        <div className="relative">
                          <select
                            value={form.origen}
                            onChange={(e) => setForm(f => ({ ...f, origen: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
                          >
                            {ORIGENES.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Notas</label>
                        <input
                          type="text"
                          value={form.notas}
                          onChange={(e) => setForm(f => ({ ...f, notas: e.target.value }))}
                          placeholder="Preferencias, observaciones..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Dirección (solo si trabaja a domicilio) */}
                    {tieneDomicilio && (
                      <>
                        <div className="pt-3 border-t">
                          <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <Navigation className="w-4 h-4" />
                            Dirección del cliente
                          </h5>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Dirección (opcional)
                            </label>
                            <input
                              type="text"
                              value={form.direccion}
                              onChange={(e) => setForm(f => ({ ...f, direccion: e.target.value }))}
                              placeholder="Calle y número"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Piso</label>
                              <input
                                type="text"
                                value={form.piso}
                                onChange={(e) => setForm(f => ({ ...f, piso: e.target.value }))}
                                placeholder="Ej: 2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Depto</label>
                              <input
                                type="text"
                                value={form.departamento}
                                onChange={(e) => setForm(f => ({ ...f, departamento: e.target.value }))}
                                placeholder="Ej: A"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Localidad</label>
                              <input
                                type="text"
                                value={form.localidad}
                                onChange={(e) => setForm(f => ({ ...f, localidad: e.target.value }))}
                                placeholder="Ciudad"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Provincia</label>
                              <div className="relative">
                                <select
                                  value={form.provincia}
                                  onChange={(e) => setForm(f => ({ ...f, provincia: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
                                >
                                  {PROVINCIAS_ARGENTINA.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Indicaciones adicionales
                            </label>
                            <textarea
                              value={form.indicaciones_ubicacion}
                              onChange={(e) => setForm(f => ({ ...f, indicaciones_ubicacion: e.target.value }))}
                              placeholder="Timbre, portón, entre calles, referencias..."
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                            />
                          </div>

                          {/* Botón Validar en Mapa - Solo si dirección, localidad y provincia están completos */}
                          {form.direccion.trim() && form.localidad.trim() && form.provincia && (
                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={() => setMostrarMapa(!mostrarMapa)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors border border-blue-200"
                              >
                                <MapPin className="w-4 h-4" />
                                {mostrarMapa ? 'Ocultar mapa' : 'Validar en mapa'}
                              </button>

                              {mostrarMapa && (
                                <div className="rounded-lg overflow-hidden border border-gray-300">
                                  <iframe
                                    title="Mapa de ubicación"
                                    width="100%"
                                    height="180"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                                      `${form.direccion}, ${form.localidad}, ${form.provincia}, Argentina`
                                    )}&output=embed`}
                                  />
                                  <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600">
                                    Verificá que el pin esté en la ubicación correcta
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Facturación - Solo si el usuario tiene facturación habilitada */}
                    {tieneFacturacion && (
                      <>
                        <div className="pt-3 border-t">
                          <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <Receipt className="w-4 h-4" />
                            Datos fiscales
                          </h5>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Tipo de facturación
                            </label>
                            <div className="relative">
                              <select
                                value={form.tipoFacturacion}
                                onChange={(e) => setForm(f => ({ ...f, tipoFacturacion: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
                              >
                                <option value="consumidor_final">Consumidor Final</option>
                                <option value="factura_cuit">Factura con CUIT</option>
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                          </div>

                          {form.tipoFacturacion === 'factura_cuit' && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                CUIT (11 dígitos)
                              </label>
                              <input
                                type="text"
                                value={form.cuit}
                                onChange={(e) => {
                                  const soloNumeros = e.target.value.replace(/\D/g, '')
                                  if (soloNumeros.length <= 11) {
                                    setForm(f => ({ ...f, cuit: soloNumeros }))
                                  }
                                }}
                                placeholder="Ej: 20123456789"
                                maxLength={11}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                                  form.cuit && form.cuit.length !== 11
                                    ? 'border-amber-300 bg-amber-50'
                                    : 'border-gray-300'
                                }`}
                              />
                              {form.cuit && form.cuit.length !== 11 && (
                                <p className="text-xs text-amber-600 mt-1">
                                  {form.cuit.length}/11 dígitos - Se facturará como Consumidor Final
                                </p>
                              )}
                              {form.cuit && form.cuit.length === 11 && (
                                <p className="text-xs text-green-600 mt-1">
                                  CUIT válido
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* Modo visualización */
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">WhatsApp</p>
                        {cliente?.whatsapp ? (
                          <a
                            href={`https://wa.me/${cliente.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 truncate block"
                          >
                            {cliente.whatsapp}
                          </a>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Sin completar</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Email</p>
                        {cliente?.email ? (
                          <p className="text-sm font-medium text-gray-900 truncate">{cliente.email}</p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Sin completar</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Instagram className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Instagram</p>
                        {cliente?.instagram ? (
                          <a
                            href={`https://instagram.com/${cliente.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-pink-600 hover:text-pink-700 truncate block"
                          >
                            @{cliente.instagram}
                          </a>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Sin completar</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Origen</p>
                        {cliente?.origen ? (
                          <p className="text-sm font-medium text-gray-900">{ORIGENES_MAP[cliente.origen] || cliente.origen}</p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Sin completar</p>
                        )}
                      </div>
                    </div>

                    {cliente?.notas && (
                      <div className="col-span-2 md:col-span-4 flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Notas</p>
                          <p className="text-sm text-gray-700">{cliente.notas}</p>
                        </div>
                      </div>
                    )}

                    {/* Aviso de dirección faltante (solo si trabaja a domicilio y NO tiene dirección completa) */}
                    {tieneDomicilio && cliente && (!cliente.direccion || !cliente.localidad || !cliente.provincia) && (
                      <div className="col-span-2 md:col-span-4">
                        <div className="border-t pt-3 mt-1">
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-orange-800">Faltan datos de domicilio</p>
                              <p className="text-xs text-orange-600 mt-0.5">
                                Para turnos a domicilio necesitás: dirección, localidad y provincia
                              </p>
                              {!editando && (
                                <button
                                  onClick={() => setEditando(true)}
                                  className="mt-2 text-xs font-medium text-orange-700 hover:text-orange-800 underline"
                                >
                                  Completar datos
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dirección (solo si trabaja a domicilio y tiene dirección) */}
                    {tieneDomicilio && cliente?.direccion && cliente?.localidad && cliente?.provincia && (
                      <div className="col-span-2 md:col-span-4">
                        <div className="border-t pt-3 mt-1">
                          <h5 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                            <Navigation className="w-3.5 h-3.5" />
                            Dirección del cliente
                          </h5>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-gray-900">
                              {cliente.direccion}
                              {cliente.piso && `, Piso ${cliente.piso}`}
                              {cliente.departamento && ` ${cliente.departamento}`}
                            </p>
                            {(cliente.localidad || cliente.provincia) && (
                              <p className="text-sm text-gray-600 mt-0.5">
                                {cliente.localidad}
                                {cliente.localidad && cliente.provincia && ', '}
                                {cliente.provincia}
                              </p>
                            )}
                            {cliente.indicaciones_ubicacion && (
                              <p className="text-xs text-gray-500 mt-2 italic">
                                {cliente.indicaciones_ubicacion}
                              </p>
                            )}

                            {/* Botón Ver en mapa - Solo si tiene localidad y provincia */}
                            {cliente.localidad && cliente.provincia && (
                              <div className="mt-3 space-y-2">
                                <button
                                  type="button"
                                  onClick={() => setMostrarMapa(!mostrarMapa)}
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  <MapPin className="w-3 h-3" />
                                  {mostrarMapa ? 'Ocultar mapa' : 'Ver en mapa'}
                                </button>

                                {mostrarMapa && (
                                  <div className="rounded-lg overflow-hidden border border-blue-300">
                                    <iframe
                                      title="Mapa de ubicación"
                                      width="100%"
                                      height="180"
                                      style={{ border: 0 }}
                                      loading="lazy"
                                      referrerPolicy="no-referrer-when-downgrade"
                                      src={`https://www.google.com/maps?q=${encodeURIComponent(
                                        `${cliente.direccion}, ${cliente.localidad}, ${cliente.provincia}, Argentina`
                                      )}&output=embed`}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Datos Fiscales - Solo si el usuario tiene facturación habilitada */}
                    {tieneFacturacion && (
                      <div className="col-span-2 md:col-span-4">
                        <div className="border-t pt-3 mt-1">
                          <h5 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                            <Receipt className="w-3.5 h-3.5" />
                            Datos fiscales
                          </h5>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Receipt className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500">Facturación</p>
                              {cliente?.cuit && cliente.cuit.length === 11 ? (
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    CUIT: {cliente.cuit.replace(/(\d{2})(\d{8})(\d{1})/, '$1-$2-$3')}
                                  </p>
                                  <p className="text-xs text-gray-500">Factura con datos fiscales</p>
                                </div>
                              ) : (
                                <p className="text-sm font-medium text-gray-900">Consumidor Final</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Estadísticas */}
              {estadisticas && (
                <div className="p-5 border-b bg-gray-50">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4" />
                    Estadísticas
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <Calendar className="w-3 h-3" />
                        Turnos
                      </div>
                      <p className="text-xl font-bold text-gray-900">{estadisticas.totalTurnos}</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Completados
                      </div>
                      <p className="text-xl font-bold text-green-600">{estadisticas.completados}</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <DollarSign className="w-3 h-3" />
                        Total
                      </div>
                      <p className="text-xl font-bold text-gray-900">{formatearMonto(estadisticas.totalGastado)}</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <TrendingUp className="w-3 h-3" />
                        Asistencia
                      </div>
                      <p className={`text-xl font-bold ${
                        estadisticas.tasaAsistencia >= 80 ? 'text-green-600' :
                        estadisticas.tasaAsistencia >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {estadisticas.tasaAsistencia.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {estadisticas.topServicios.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Servicios favoritos
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {estadisticas.topServicios.map((s, i) => (
                          <span key={i} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                            {s.nombre} ({s.cantidad}x)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex gap-4 text-xs text-gray-500">
                    {estadisticas.primeraVisita && (
                      <span>Primera visita: {formatFechaCorta(estadisticas.primeraVisita)}</span>
                    )}
                    {estadisticas.ultimaVisita && (
                      <span>Última visita: {formatFechaCorta(estadisticas.ultimaVisita)}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Historial de Turnos */}
              <div className="p-5">
                <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4" />
                  Historial de turnos
                </h4>

                {turnos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay turnos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {turnos.map(turno => {
                      const badge = getEstadoBadge(turno.estado)
                      const servicios = turno.servicios || []
                      const pagos = turno.pagos || []
                      const totalPagado = pagos.reduce((acc, p) =>
                        acc + (p.tipo !== 'devolucion' ? parseFloat(p.monto) : -parseFloat(p.monto)), 0
                      )

                      return (
                        <div key={turno.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900 text-sm">
                                  {formatFechaCorta(turno.fecha)}
                                </span>
                                <span className="text-gray-500 text-sm">
                                  {turno.hora_inicio?.substring(0, 5)}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${badge.color}`}>
                                  {badge.label}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {servicios.map((s, i) => (
                                  <span
                                    key={i}
                                    className="text-xs text-gray-600 flex items-center gap-1"
                                  >
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: s.servicio?.color || '#6B7280' }}
                                    />
                                    {s.servicio?.nombre || 'Servicio'}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {totalPagado > 0 && (
                              <span className="text-sm font-medium text-gray-700">
                                {formatearMonto(totalPagado)}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t px-5 py-4 bg-gray-50 flex-shrink-0">
            <div className="flex gap-3">
              {editando ? (
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  {guardando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Guardar cambios
                </button>
              ) : (
                cliente?.whatsapp && (
                  <a
                    href={`https://wa.me/${cliente.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </a>
                )
              )}
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
