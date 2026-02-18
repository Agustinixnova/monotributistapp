/**
 * Componente para configurar datos del negocio
 * Incluye modalidades de trabajo, datos de cobro y ubicación
 */

import { useState, useEffect } from 'react'
import {
  Store, Phone, MapPin, Instagram, Globe, Loader2, Check, Building2,
  Mail, MessageCircle, Home, Video, Briefcase, CreditCard, Settings2
} from 'lucide-react'
import { useNegocio } from '../../hooks/useNegocio'
import SelectorModoAgenda, { getModoInfo } from './SelectorModoAgenda'
import { supabase } from '../../../../lib/supabase'
import { getEffectiveUserId } from '../../../caja-diaria/services/empleadosService'

// Opciones de modalidades de trabajo
const MODALIDADES = [
  { id: 'local', label: 'En mi local/consultorio', icon: Store, descripcion: 'Los clientes vienen a tu dirección' },
  { id: 'domicilio', label: 'A domicilio', icon: Home, descripcion: 'Vos vas a la dirección del cliente' },
  { id: 'videollamada', label: 'Videollamadas', icon: Video, descripcion: 'Atención online por Zoom, Meet, etc.' }
]

// Tabs de configuración
const TABS_CONFIG = [
  { id: 'general', label: 'General', icon: Settings2 },
  { id: 'contacto', label: 'Contacto', icon: Phone },
  { id: 'redes', label: 'Redes', icon: Instagram }
]

export default function ConfigNegocio({ onGuardar }) {
  const { negocio, loading, saving, guardar } = useNegocio()
  const [guardado, setGuardado] = useState(false)
  const [turnosConEspacio, setTurnosConEspacio] = useState(0)
  const [nombresSalones, setNombresSalones] = useState([])
  const [tabActiva, setTabActiva] = useState('general')

  // Obtener info de turnos con espacio asignado (para el aviso al cambiar de modo)
  useEffect(() => {
    const fetchTurnosConEspacio = async () => {
      try {
        const { userId } = await getEffectiveUserId()
        if (!userId) return

        // Contar turnos con espacio_id no nulo
        const { count, error } = await supabase
          .from('agenda_turnos')
          .select('id', { count: 'exact', head: true })
          .eq('duenio_id', userId)
          .not('espacio_id', 'is', null)

        if (!error && count) {
          setTurnosConEspacio(count)
        }

        // Obtener nombres de espacios que tienen turnos
        const { data: espaciosData } = await supabase
          .from('agenda_espacios')
          .select('id, nombre')
          .eq('user_id', userId)
          .eq('activo', true)

        if (espaciosData) {
          // Verificar cuáles tienen turnos
          const nombresConTurnos = []
          for (const esp of espaciosData) {
            const { count: turnosEsp } = await supabase
              .from('agenda_turnos')
              .select('id', { count: 'exact', head: true })
              .eq('espacio_id', esp.id)

            if (turnosEsp > 0) {
              nombresConTurnos.push(esp.nombre)
            }
          }
          setNombresSalones(nombresConTurnos)
        }
      } catch (err) {
        console.error('Error obteniendo info de turnos con espacio:', err)
      }
    }

    fetchTurnosConEspacio()
  }, [])

  const [form, setForm] = useState({
    nombre_negocio: '',
    descripcion: '',
    telefono: '',
    whatsapp: '',
    email: '',
    direccion: '',
    piso: '',
    departamento: '',
    localidad: '',
    provincia: '',
    codigo_postal: '',
    instagram: '',
    tiktok: '',
    facebook: '',
    web: '',
    // Campos de configuración
    modo_agenda: 'personal',
    modalidades_trabajo: ['local'],
    alias_pago: '',
    cuit: ''
  })

  // Cargar datos cuando llega el negocio
  useEffect(() => {
    if (negocio) {
      setForm({
        nombre_negocio: negocio.nombre_negocio || '',
        descripcion: negocio.descripcion || '',
        telefono: negocio.telefono || '',
        whatsapp: negocio.whatsapp || '',
        email: negocio.email || '',
        direccion: negocio.direccion || '',
        piso: negocio.piso || '',
        departamento: negocio.departamento || '',
        localidad: negocio.localidad || '',
        provincia: negocio.provincia || '',
        codigo_postal: negocio.codigo_postal || '',
        instagram: negocio.instagram || '',
        tiktok: negocio.tiktok || '',
        facebook: negocio.facebook || '',
        web: negocio.web || '',
        modo_agenda: negocio.modo_agenda || 'personal',
        modalidades_trabajo: negocio.modalidades_trabajo || ['local'],
        alias_pago: negocio.alias_pago || '',
        cuit: negocio.cuit || ''
      })
    }
  }, [negocio])

  const handleChange = (campo, valor) => {
    setForm(f => ({ ...f, [campo]: valor }))
    setGuardado(false)
  }

  // Toggle modalidad
  const toggleModalidad = (modalidadId) => {
    setForm(f => {
      const current = f.modalidades_trabajo || []
      let nuevas
      if (current.includes(modalidadId)) {
        // Quitar, pero siempre debe quedar al menos una
        nuevas = current.filter(m => m !== modalidadId)
        if (nuevas.length === 0) nuevas = [modalidadId]
      } else {
        // Agregar
        nuevas = [...current, modalidadId]
      }
      return { ...f, modalidades_trabajo: nuevas }
    })
    setGuardado(false)
  }

  // Seleccionar todas las modalidades
  const seleccionarTodas = () => {
    const todasIds = MODALIDADES.map(m => m.id)
    setForm(f => ({ ...f, modalidades_trabajo: todasIds }))
    setGuardado(false)
  }

  const handleGuardar = async () => {
    const { success } = await guardar(form)
    if (success) {
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
      // Notificar al padre que se guardó para recargar datos
      onGuardar?.()
    }
  }

  // Helpers
  const tieneModalidad = (id) => form.modalidades_trabajo?.includes(id)
  const tieneTodas = MODALIDADES.every(m => tieneModalidad(m.id))
  const tieneLocal = tieneModalidad('local')

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
        <p className="mt-2 text-gray-500">Cargando datos...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Header con tabs */}
      <div className="border-b bg-gradient-to-r from-violet-50 to-purple-50">
        <div className="px-4 sm:px-5 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-semibold text-gray-900">Mi Negocio</h3>
            <p className="text-sm text-gray-500 hidden sm:block">Configurá los datos de tu emprendimiento</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-2 sm:px-4 gap-1">
          {TABS_CONFIG.map(tab => {
            const Icon = tab.icon
            const activa = tabActiva === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  activa
                    ? 'bg-white text-violet-700 border-t-2 border-x border-violet-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenido de tabs */}
      <div className="p-4 sm:p-5">
        {/* Tab General */}
        {tabActiva === 'general' && (
          <div className="space-y-6">
            {/* Nombre y descripción - arriba */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nombre del negocio *
                </label>
                <input
                  type="text"
                  value={form.nombre_negocio}
                  onChange={(e) => handleChange('nombre_negocio', e.target.value)}
                  placeholder="Ej: Peluquería María, Studio Nails"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                  placeholder="Breve descripción de tu negocio..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            </div>

            {/* Modo y Modalidades lado a lado en desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Modo de agenda */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Modo de operación
                </h4>
                <SelectorModoAgenda
                  modoActual={form.modo_agenda}
                  onChange={(modo) => handleChange('modo_agenda', modo)}
                  turnosConEspacio={turnosConEspacio}
                  nombresSalones={nombresSalones}
                />
              </div>

              {/* Modalidades de trabajo */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  ¿Cómo trabajás?
                </h4>
                <div className="space-y-2">
                  {MODALIDADES.map(modalidad => {
                    const Icon = modalidad.icon
                    const activa = tieneModalidad(modalidad.id)
                    return (
                      <button
                        key={modalidad.id}
                        onClick={() => toggleModalidad(modalidad.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                          activa
                            ? 'border-violet-500 bg-violet-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          activa ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${activa ? 'text-violet-700' : 'text-gray-700'}`}>
                            {modalidad.label}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{modalidad.descripcion}</p>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                          activa ? 'border-violet-500 bg-violet-500' : 'border-gray-300'
                        }`}>
                          {activa && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    )
                  })}
                  {!tieneTodas && (
                    <button
                      onClick={seleccionarTodas}
                      className="w-full text-center text-sm text-violet-600 hover:text-violet-700 py-1"
                    >
                      Seleccionar todas
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Contacto */}
        {tabActiva === 'contacto' && (
          <div className="space-y-6">
            {/* Contacto y Cobro lado a lado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contacto */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contacto
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={form.telefono}
                      onChange={(e) => handleChange('telefono', e.target.value)}
                      placeholder="011 4567-8900"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={form.whatsapp}
                      onChange={(e) => handleChange('whatsapp', e.target.value)}
                      placeholder="5491123456789"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="contacto@minegocio.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* Datos de cobro */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Datos de cobro
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Alias CBU/CVU
                    </label>
                    <input
                      type="text"
                      value={form.alias_pago}
                      onChange={(e) => handleChange('alias_pago', e.target.value)}
                      placeholder="mi.negocio.mp"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Para compartir con tus clientes</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      CUIT
                    </label>
                    <input
                      type="text"
                      value={form.cuit}
                      onChange={(e) => {
                        const valor = e.target.value.replace(/[^0-9]/g, '').slice(0, 11)
                        handleChange('cuit', valor)
                      }}
                      placeholder="20123456789"
                      maxLength="11"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">11 dígitos sin guiones</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ubicación - Solo visible si tiene local */}
            {tieneLocal && (
              <div className="space-y-4 pt-2 border-t">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Ubicación de tu local
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="col-span-2 sm:col-span-3 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={form.direccion}
                      onChange={(e) => handleChange('direccion', e.target.value)}
                      placeholder="Av. Corrientes 1234"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Piso</label>
                    <input
                      type="text"
                      value={form.piso}
                      onChange={(e) => handleChange('piso', e.target.value)}
                      placeholder="3"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Depto</label>
                    <input
                      type="text"
                      value={form.departamento}
                      onChange={(e) => handleChange('departamento', e.target.value)}
                      placeholder="A"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Localidad</label>
                    <input
                      type="text"
                      value={form.localidad}
                      onChange={(e) => handleChange('localidad', e.target.value)}
                      placeholder="CABA"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Provincia</label>
                    <input
                      type="text"
                      value={form.provincia}
                      onChange={(e) => handleChange('provincia', e.target.value)}
                      placeholder="Buenos Aires"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Redes */}
        {tabActiva === 'redes' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              Redes sociales y web
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Instagram</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input
                    type="text"
                    value={form.instagram}
                    onChange={(e) => handleChange('instagram', e.target.value.replace('@', ''))}
                    placeholder="tu_usuario"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">TikTok</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input
                    type="text"
                    value={form.tiktok}
                    onChange={(e) => handleChange('tiktok', e.target.value.replace('@', ''))}
                    placeholder="tu_usuario"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  Sitio web
                </label>
                <input
                  type="url"
                  value={form.web}
                  onChange={(e) => handleChange('web', e.target.value)}
                  placeholder="https://www.minegocio.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer con botón guardar - sticky */}
      <div className="px-4 sm:px-5 py-3 border-t bg-gray-50 flex items-center justify-between sticky bottom-0">
        <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
          {negocio ? 'Actualizado: ' + new Date(negocio.updated_at).toLocaleDateString('es-AR') : ''}
        </p>
        <button
          onClick={handleGuardar}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ml-auto ${
            guardado
              ? 'bg-green-500 text-white'
              : 'bg-violet-600 hover:bg-violet-700 text-white'
          } disabled:opacity-50`}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Guardando...</span>
            </>
          ) : guardado ? (
            <>
              <Check className="w-4 h-4" />
              <span>Guardado</span>
            </>
          ) : (
            'Guardar'
          )}
        </button>
      </div>
    </div>
  )
}
