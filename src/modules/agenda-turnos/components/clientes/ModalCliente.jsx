/**
 * Modal para crear/editar clientes de agenda
 * Incluye campos de dirección cuando hay domicilio habilitado
 */

import { useState, useEffect } from 'react'
import { X, User, Mail, FileText, Loader2, Briefcase, Home, Instagram, ChevronDown, MapPin, Navigation, Receipt } from 'lucide-react'
import { useNegocio } from '../../hooks/useNegocio'
import { useFacturacion } from '../../hooks/useFacturacion'

const ORIGENES = [
  { value: '', label: 'Seleccionar...' },
  { value: 'recomendacion', label: 'Recomendación' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'google', label: 'Google' },
  { value: 'otros', label: 'Otros' }
]

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

export default function ModalCliente({
  isOpen,
  onClose,
  onGuardar,
  cliente = null, // null = crear nuevo
  esEmpleado = false // Si el usuario actual es empleado
}) {
  const { tieneDomicilio, tieneLocal, tieneVideollamada } = useNegocio()
  // Usamos tieneModuloPremium para mostrar el campo aunque no tenga config completa
  const { tieneModuloPremium: tieneFacturacion } = useFacturacion()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Si solo trabaja a domicilio, la dirección es obligatoria
  const direccionObligatoria = tieneDomicilio && !tieneLocal && !tieneVideollamada

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    whatsapp: '',
    email: '',
    instagram: '',
    origen: '',
    notas: '',
    esClientePropio: false, // Solo para empleados: true = cliente privado
    // Campos de dirección (para domicilio)
    direccion: '',
    piso: '',
    departamento: '',
    localidad: '',
    provincia: '',
    indicaciones_ubicacion: '',
    mostrarMapa: false, // Estado para preview del mapa
    // Campos de facturación
    tipoFacturacion: 'consumidor_final', // 'consumidor_final' o 'factura_cuit'
    cuit: ''
  })

  // Reset form cuando se abre/cierra o cambia el cliente
  useEffect(() => {
    if (isOpen) {
      if (cliente) {
        setForm({
          nombre: cliente.nombre || '',
          apellido: cliente.apellido || '',
          whatsapp: cliente.whatsapp || '',
          email: cliente.email || '',
          instagram: cliente.instagram || '',
          origen: cliente.origen || '',
          notas: cliente.notas || '',
          esClientePropio: cliente.es_cliente_empleado || false,
          direccion: cliente.direccion || '',
          piso: cliente.piso || '',
          departamento: cliente.departamento || '',
          localidad: cliente.localidad || '',
          provincia: cliente.provincia || '',
          indicaciones_ubicacion: cliente.indicaciones_ubicacion || '',
          mostrarMapa: false,
          tipoFacturacion: cliente.cuit && cliente.cuit.length === 11 ? 'factura_cuit' : 'consumidor_final',
          cuit: cliente.cuit || ''
        })
      } else {
        setForm({
          nombre: '',
          apellido: '',
          whatsapp: '',
          email: '',
          instagram: '',
          origen: '',
          notas: '',
          esClientePropio: false,
          direccion: '',
          piso: '',
          departamento: '',
          localidad: '',
          provincia: '',
          indicaciones_ubicacion: '',
          mostrarMapa: false,
          tipoFacturacion: 'consumidor_final',
          cuit: ''
        })
      }
      setError(null)
    }
  }, [isOpen, cliente])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    // Validar dirección si solo trabaja a domicilio
    if (direccionObligatoria && !form.direccion.trim()) {
      setError('La dirección es obligatoria para servicios a domicilio')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // CUIT: solo guardar si tiene exactamente 11 dígitos
      const cuitLimpio = form.cuit.replace(/\D/g, '')
      const cuitValido = cuitLimpio.length === 11 ? cuitLimpio : null

      await onGuardar({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
        instagram: form.instagram.trim() || null,
        origen: form.origen || null,
        notas: form.notas.trim() || null,
        esClientePropio: esEmpleado ? form.esClientePropio : false,
        // Campos de dirección
        direccion: form.direccion.trim() || null,
        piso: form.piso.trim() || null,
        departamento: form.departamento.trim() || null,
        localidad: form.localidad.trim() || null,
        provincia: form.provincia.trim() || null,
        indicaciones_ubicacion: form.indicaciones_ubicacion.trim() || null,
        // CUIT para facturación
        cuit: cuitValido
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar cliente')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-lg">
                {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  value={form.apellido}
                  onChange={(e) => setForm(f => ({ ...f, apellido: e.target.value }))}
                  placeholder="Apellido"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <svg className="w-4 h-4 inline mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                placeholder="Número de WhatsApp"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Se usa para enviar recordatorios
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="correo@ejemplo.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Instagram className="w-4 h-4 inline mr-1" />
                Instagram
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => setForm(f => ({ ...f, instagram: e.target.value.replace('@', '') }))}
                  placeholder="usuario"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Origen / Cómo nos conoció */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                ¿Cómo nos conoció?
              </label>
              <div className="relative">
                <select
                  value={form.origen}
                  onChange={(e) => setForm(f => ({ ...f, origen: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
                >
                  {ORIGENES.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Facturación - Solo si el usuario tiene el módulo premium habilitado */}
            {tieneFacturacion && (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Receipt className="w-4 h-4 inline mr-1" />
                  Facturación
                </label>
                <div className="relative mb-3">
                  <select
                    value={form.tipoFacturacion}
                    onChange={(e) => setForm(f => ({ ...f, tipoFacturacion: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
                  >
                    <option value="consumidor_final">Consumidor Final</option>
                    <option value="factura_cuit">Factura con CUIT</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Campo CUIT - solo si seleccionó factura con CUIT */}
                {form.tipoFacturacion === 'factura_cuit' && (
                  <div>
                    <input
                      type="text"
                      value={form.cuit}
                      onChange={(e) => setForm(f => ({ ...f, cuit: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                      placeholder="CUIT (11 dígitos)"
                      maxLength={11}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                        form.cuit && form.cuit.length !== 11 ? 'border-amber-300 bg-amber-50' : 'border-gray-300'
                      }`}
                    />
                    <p className={`text-xs mt-1 ${
                      form.cuit && form.cuit.length !== 11 ? 'text-amber-600' : 'text-gray-500'
                    }`}>
                      {form.cuit && form.cuit.length !== 11
                        ? `Faltan ${11 - form.cuit.length} dígitos. Si no se completa, se facturará como Consumidor Final.`
                        : form.cuit.length === 11
                          ? 'CUIT válido'
                          : 'Sin guiones, 11 dígitos'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Dirección (solo si hay domicilio habilitado) */}
            {tieneDomicilio && (
              <div className="border-t pt-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  <Navigation className="w-4 h-4 inline mr-1" />
                  Dirección del cliente {direccionObligatoria ? '*' : '(opcional)'}
                </label>
                <p className="text-xs text-gray-500 -mt-2">
                  {direccionObligatoria
                    ? 'Requerida para todos los servicios'
                    : 'Solo para turnos a domicilio'}
                </p>

                <div>
                  <input
                    type="text"
                    value={form.direccion}
                    onChange={(e) => setForm(f => ({ ...f, direccion: e.target.value }))}
                    placeholder="Calle y número"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      value={form.piso}
                      onChange={(e) => setForm(f => ({ ...f, piso: e.target.value }))}
                      placeholder="Piso"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={form.departamento}
                      onChange={(e) => setForm(f => ({ ...f, departamento: e.target.value }))}
                      placeholder="Depto"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={form.localidad}
                      onChange={(e) => setForm(f => ({ ...f, localidad: e.target.value }))}
                      placeholder="Localidad"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                  </div>
                  <div>
                    <div className="relative">
                      <select
                        value={form.provincia}
                        onChange={(e) => setForm(f => ({ ...f, provincia: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white text-sm"
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
                  <input
                    type="text"
                    value={form.indicaciones_ubicacion}
                    onChange={(e) => setForm(f => ({ ...f, indicaciones_ubicacion: e.target.value }))}
                    placeholder="Indicaciones: timbre, portón, referencias..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  />
                </div>

                {/* Botón Validar en Mapa - Solo si dirección, localidad y provincia están completos */}
                {form.direccion.trim() && form.localidad.trim() && form.provincia && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, mostrarMapa: !f.mostrarMapa }))}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors border border-blue-200"
                    >
                      <MapPin className="w-4 h-4" />
                      {form.mostrarMapa ? 'Ocultar mapa' : 'Validar en mapa'}
                    </button>

                    {form.mostrarMapa && (
                      <div className="rounded-lg overflow-hidden border border-gray-300">
                        <iframe
                          title="Mapa de ubicación"
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://www.google.com/maps?q=${encodeURIComponent(
                            `${form.direccion}${form.localidad ? ', ' + form.localidad : ''}${form.provincia ? ', ' + form.provincia : ''}, Argentina`
                          )}&output=embed`}
                        />
                        <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600 flex items-center justify-between">
                          <span>Verificá que el pin esté en la ubicación correcta</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${form.direccion}${form.localidad ? ', ' + form.localidad : ''}${form.provincia ? ', ' + form.provincia : ''}, Argentina`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Abrir en Maps
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="w-4 h-4 inline mr-1" />
                Notas
              </label>
              <textarea
                value={form.notas}
                onChange={(e) => setForm(f => ({ ...f, notas: e.target.value }))}
                placeholder="Preferencias, alergias, observaciones..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Tipo de cliente (solo para empleados) */}
            {esEmpleado && !cliente && (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de cliente
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, esClientePropio: false }))}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      !form.esClientePropio
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Briefcase className={`w-5 h-5 mb-1 ${!form.esClientePropio ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <p className={`font-medium ${!form.esClientePropio ? 'text-emerald-700' : 'text-gray-700'}`}>
                      Del local
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Cliente del salón/negocio
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, esClientePropio: true }))}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      form.esClientePropio
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Home className={`w-5 h-5 mb-1 ${form.esClientePropio ? 'text-purple-600' : 'text-gray-400'}`} />
                    <p className={`font-medium ${form.esClientePropio ? 'text-purple-700' : 'text-gray-700'}`}>
                      Mi cliente
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Particular, trabajo propio
                    </p>
                  </button>
                </div>
              </div>
            )}
          </form>

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
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                cliente ? 'Guardar cambios' : 'Crear cliente'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
