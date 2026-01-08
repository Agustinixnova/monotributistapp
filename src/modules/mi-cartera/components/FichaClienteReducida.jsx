import { useState, useEffect } from 'react'
import {
  User, Phone, Mail, MapPin, Building2, Briefcase,
  CreditCard, Heart, Users, FileText, ChevronDown, ChevronUp,
  Edit3, AlertCircle
} from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { CAMPOS_SUGERIBLES, CAMPOS_NO_SUGERIBLES, getCampoLabel } from '../utils/camposSugeribles'
import { ModalSugerirCambio } from './ModalSugerirCambio'

/**
 * Ficha reducida para que el cliente vea sus datos
 * Solo muestra campos permitidos y permite sugerir cambios
 */
export function FichaClienteReducida() {
  const { user } = useAuth()
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalSugerencia, setModalSugerencia] = useState(null)
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    personal: true,
    fiscal: false,
    obraSocial: false,
    facturacion: false
  })

  // Cargar datos del cliente
  useEffect(() => {
    const fetchMisDatos = async () => {
      if (!user?.id) return

      try {
        setLoading(true)

        // Obtener profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError

        // Obtener datos fiscales
        const { data: fiscal, error: fiscalError } = await supabase
          .from('client_fiscal_data')
          .select('*, locales:client_locales(*), grupo_familiar:client_grupo_familiar(*)')
          .eq('user_id', user.id)
          .single()

        if (fiscalError && fiscalError.code !== 'PGRST116') {
          throw fiscalError
        }

        setCliente({
          profile,
          fiscal: fiscal || {},
          locales: fiscal?.locales || [],
          grupoFamiliar: fiscal?.grupo_familiar || [],
          clientId: fiscal?.id
        })
      } catch (err) {
        console.error('Error cargando datos:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMisDatos()
  }, [user?.id])

  const toggleSeccion = (seccion) => {
    setSeccionesAbiertas(prev => ({
      ...prev,
      [seccion]: !prev[seccion]
    }))
  }

  const abrirModalSugerencia = (campo, valorActual, tabla = 'client_fiscal_data') => {
    const config = CAMPOS_SUGERIBLES[campo]
    if (!config) return

    setModalSugerencia({
      campo,
      campoLabel: config.label,
      valorActual,
      tabla,
      tipo: config.tipo,
      opciones: config.opciones,
      descripcion: config.descripcion
    })
  }

  const cerrarModal = () => {
    setModalSugerencia(null)
  }

  const handleSugerenciaEnviada = () => {
    cerrarModal()
    // Podriamos mostrar un toast aqui
  }

  // Campo editable con boton de sugerencia
  const CampoConSugerencia = ({ campo, valor, tabla = 'client_fiscal_data', className = '' }) => {
    const esSugerible = campo in CAMPOS_SUGERIBLES && !CAMPOS_NO_SUGERIBLES.includes(campo)
    const label = getCampoLabel(campo)
    const valorMostrar = formatearValor(campo, valor)

    return (
      <div className={`flex items-start justify-between gap-2 py-2 ${className}`}>
        <div className="flex-1 min-w-0">
          <span className="text-xs text-gray-500 block">{label}</span>
          <span className="text-sm text-gray-900 break-words">
            {valorMostrar || <span className="text-gray-400 italic">Sin datos</span>}
          </span>
        </div>
        {esSugerible && (
          <button
            onClick={() => abrirModalSugerencia(campo, valor, tabla)}
            className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded flex-shrink-0"
            title="Sugerir cambio"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  // Formatear valores segun tipo
  const formatearValor = (campo, valor) => {
    if (valor === null || valor === undefined || valor === '') return null

    const config = CAMPOS_SUGERIBLES[campo]
    if (!config) return String(valor)

    switch (config.tipo) {
      case 'boolean':
        return valor ? 'Si' : 'No'
      case 'currency':
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          maximumFractionDigits: 0
        }).format(valor)
      case 'select':
        const opcion = config.opciones?.find(o => o.value === valor)
        return opcion?.label || valor
      default:
        return String(valor)
    }
  }

  // Seccion colapsable
  const Seccion = ({ id, titulo, icono: Icono, iconColor, children }) => {
    const abierta = seccionesAbiertas[id]

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSeccion(id)}
          className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icono className={`w-5 h-5 ${iconColor}`} />
            <span className="font-medium text-gray-900">{titulo}</span>
          </div>
          {abierta ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {abierta && (
          <div className="px-4 py-3 divide-y divide-gray-100">
            {children}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-800 font-medium">Error cargando datos</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="text-center py-12 text-gray-500">
        No se encontraron datos fiscales
      </div>
    )
  }

  const { profile, fiscal, locales, grupoFamiliar } = cliente

  return (
    <div className="space-y-4">
      {/* Encabezado con info principal */}
      <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-lg p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">
              {profile.full_name || `${profile.nombre || ''} ${profile.apellido || ''}`.trim() || 'Mi cuenta'}
            </h2>
            {fiscal?.cuit && (
              <p className="text-violet-200 text-sm">CUIT: {fiscal.cuit}</p>
            )}
          </div>
        </div>
        {fiscal?.categoria_monotributo && (
          <div className="mt-3 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm">
            <span>Categoria {fiscal.categoria_monotributo}</span>
          </div>
        )}
      </div>

      {/* Nota informativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-blue-800 text-sm">
          Si encontras algun dato incorrecto, podes sugerir una correccion tocando el icono
          <Edit3 className="w-4 h-4 inline mx-1" />
          junto al campo. Tu contadora revisara la sugerencia.
        </p>
      </div>

      {/* Secciones de datos */}
      <div className="space-y-3">
        {/* Datos Personales */}
        <Seccion id="personal" titulo="Datos Personales" icono={User} iconColor="text-violet-600">
          <CampoConSugerencia campo="nombre" valor={profile.nombre} tabla="profiles" />
          <CampoConSugerencia campo="apellido" valor={profile.apellido} tabla="profiles" />
          <CampoConSugerencia campo="telefono" valor={profile.telefono} tabla="profiles" />
          <CampoConSugerencia campo="whatsapp" valor={profile.whatsapp} tabla="profiles" />
          <CampoConSugerencia campo="email" valor={profile.email} tabla="profiles" />
        </Seccion>

        {/* Domicilio Fiscal */}
        <Seccion id="fiscal" titulo="Domicilio Fiscal" icono={MapPin} iconColor="text-green-600">
          <CampoConSugerencia campo="domicilio_fiscal" valor={fiscal?.domicilio_fiscal} />
          <CampoConSugerencia campo="localidad" valor={fiscal?.localidad} />
          <CampoConSugerencia campo="provincia" valor={fiscal?.provincia} />
          <CampoConSugerencia campo="codigo_postal" valor={fiscal?.codigo_postal} />
        </Seccion>

        {/* Situacion Laboral */}
        {(fiscal?.trabaja_relacion_dependencia || fiscal?.tiene_empleados) && (
          <Seccion id="laboral" titulo="Situacion Laboral" icono={Briefcase} iconColor="text-blue-600">
            <CampoConSugerencia campo="trabaja_relacion_dependencia" valor={fiscal?.trabaja_relacion_dependencia} />
            {fiscal?.trabaja_relacion_dependencia && (
              <>
                <CampoConSugerencia campo="empleador_razon_social" valor={fiscal?.empleador_razon_social} />
                <CampoConSugerencia campo="empleador_cuit" valor={fiscal?.empleador_cuit} />
                <CampoConSugerencia campo="sueldo_bruto" valor={fiscal?.sueldo_bruto} />
              </>
            )}
            <CampoConSugerencia campo="tiene_empleados" valor={fiscal?.tiene_empleados} />
            {fiscal?.tiene_empleados && (
              <CampoConSugerencia campo="cantidad_empleados" valor={fiscal?.cantidad_empleados} />
            )}
          </Seccion>
        )}

        {/* Obra Social */}
        <Seccion id="obraSocial" titulo="Obra Social" icono={Heart} iconColor="text-red-600">
          <CampoConSugerencia campo="obra_social" valor={fiscal?.obra_social} />
          <CampoConSugerencia campo="obra_social_tipo_cobertura" valor={fiscal?.obra_social_tipo_cobertura} />
          <CampoConSugerencia campo="obra_social_adicional" valor={fiscal?.obra_social_adicional} />
          {fiscal?.obra_social_adicional && (
            <CampoConSugerencia campo="obra_social_adicional_nombre" valor={fiscal?.obra_social_adicional_nombre} />
          )}

          {/* Grupo familiar */}
          {grupoFamiliar.length > 0 && (
            <div className="pt-3 mt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-pink-600" />
                <span className="text-sm font-medium text-gray-700">Grupo Familiar</span>
              </div>
              <div className="space-y-2">
                {grupoFamiliar.map(integrante => (
                  <div key={integrante.id} className="bg-gray-50 rounded p-2 text-sm">
                    <span className="font-medium">{integrante.nombre}</span>
                    <span className="text-gray-500 ml-2">
                      ({integrante.parentesco === 'otro' ? integrante.parentesco_otro : integrante.parentesco})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Seccion>

        {/* Facturacion y Pagos */}
        <Seccion id="facturacion" titulo="Facturacion y Pagos" icono={CreditCard} iconColor="text-amber-600">
          <CampoConSugerencia campo="punto_venta_afip" valor={fiscal?.punto_venta_afip} />
          <CampoConSugerencia campo="metodo_pago_monotributo" valor={fiscal?.metodo_pago_monotributo} />
          {fiscal?.metodo_pago_monotributo === 'debito_automatico' && (
            <CampoConSugerencia campo="cbu_debito" valor={fiscal?.cbu_debito} />
          )}
          <CampoConSugerencia campo="regimen_iibb" valor={fiscal?.regimen_iibb} />
          <CampoConSugerencia campo="numero_iibb" valor={fiscal?.numero_iibb} />
        </Seccion>

        {/* Locales comerciales */}
        {locales.length > 0 && (
          <Seccion id="locales" titulo="Locales Comerciales" icono={Building2} iconColor="text-orange-600">
            <div className="space-y-2">
              {locales.map((local, index) => (
                <div key={local.id} className="bg-gray-50 rounded p-3">
                  <div className="font-medium text-gray-900">
                    {local.descripcion || `Local ${index + 1}`}
                  </div>
                  {local.direccion && (
                    <div className="text-sm text-gray-600 mt-1">
                      {local.direccion}
                      {local.localidad && `, ${local.localidad}`}
                      {local.provincia && ` (${local.provincia})`}
                    </div>
                  )}
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>{local.es_propio ? 'Propio' : 'Alquilado'}</span>
                    {local.superficie_m2 && <span>{local.superficie_m2} m²</span>}
                  </div>
                </div>
              ))}
            </div>
          </Seccion>
        )}
      </div>

      {/* Modal para sugerir cambio */}
      {modalSugerencia && cliente.clientId && (
        <ModalSugerirCambio
          clientId={cliente.clientId}
          campo={modalSugerencia.campo}
          campoLabel={modalSugerencia.campoLabel}
          valorActual={modalSugerencia.valorActual}
          tabla={modalSugerencia.tabla}
          tipo={modalSugerencia.tipo}
          opciones={modalSugerencia.opciones}
          descripcion={modalSugerencia.descripcion}
          onClose={cerrarModal}
          onSuccess={handleSugerenciaEnviada}
        />
      )}
    </div>
  )
}
