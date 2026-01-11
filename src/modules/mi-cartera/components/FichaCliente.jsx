import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Phone, MessageCircle, Mail, FileText, Receipt,
  Building2, CreditCard, Shield, MapPin, Users, Briefcase,
  AlertTriangle, Heart, History, Plus, Trash2, MoreVertical
} from 'lucide-react'
import { useClienteDetalle } from '../hooks/useClienteDetalle'
import { FichaSeccion, FichaCampo } from './FichaSeccion'
import { FichaSeccionLocales } from './FichaSeccionLocales'
import { FichaSeccionGrupoFamiliar } from './FichaSeccionGrupoFamiliar'
import { FichaHistorialCategorias } from './FichaHistorialCategorias'
import { FichaAuditoria } from './FichaAuditoria'
import { FichaSeccionNotificaciones } from './FichaSeccionNotificaciones'
import { HistorialCambiosCliente } from '../../../components/common/HistorialCambiosCliente'

const CATEGORIAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
const TIPOS_ACTIVIDAD = [
  { value: 'servicios', label: 'Servicios' },
  { value: 'comercio', label: 'Comercio' },
  { value: 'industria', label: 'Industria' }
]
const GESTION_FACTURACION = [
  { value: 'contadora', label: 'Contadora' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'mixta', label: 'Mixta' }
]
const METODOS_PAGO = [
  { value: 'debito_automatico', label: 'Debito automatico' },
  { value: 'vep', label: 'VEP' },
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'efectivo', label: 'Efectivo / Rapipago / PagoFacil' },
  { value: 'otro', label: 'Otro' }
]
const ESTADOS_PAGO = [
  { value: 'al_dia', label: 'Al dia' },
  { value: 'debe_1_cuota', label: 'Debe 1 cuota' },
  { value: 'debe_2_mas', label: 'Debe 2+ cuotas' },
  { value: 'desconocido', label: 'No se' }
]
const REGIMENES_IIBB = [
  { value: 'no_inscripto', label: 'No inscripto' },
  { value: 'exento', label: 'Exento' },
  { value: 'convenio_multilateral', label: 'Convenio Multilateral' },
  { value: 'local', label: 'Regimen local' }
]
const PARENTESCOS = [
  { value: 'conyuge', label: 'Conyuge' },
  { value: 'concubino', label: 'Concubino/a' },
  { value: 'hijo', label: 'Hijo/a' },
  { value: 'otro', label: 'Otro' }
]

/**
 * Ficha completa del cliente con edicion inline
 */
export function FichaCliente({ clientId }) {
  const {
    cliente, perfil, contador, auditoria,
    loading, saving,
    actualizarCampos, guardarLocales, guardarGrupo, refetch
  } = useClienteDetalle(clientId)

  // Estados de edicion por seccion
  const [editingSection, setEditingSection] = useState(null)
  const [editData, setEditData] = useState({})

  // Estados para arrays editables
  const [editLocales, setEditLocales] = useState([])
  const [editGrupo, setEditGrupo] = useState([])

  // Estado para ActionMenu mobile
  const [showActionsMenu, setShowActionsMenu] = useState(false)

  const formatCuit = (cuit) => {
    if (!cuit) return '-'
    return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`
  }

  const formatMonto = (monto) => {
    if (!monto) return '-'
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(monto)
  }

  const startEditing = (section, initialData = {}) => {
    setEditingSection(section)
    setEditData(initialData)
    if (section === 'locales') {
      setEditLocales(cliente.locales?.map(l => ({
        id: l.id,
        descripcion: l.descripcion || '',
        alquiler: l.alquiler_mensual || null,
        superficie: l.superficie_m2 || null,
        esPropio: l.es_propio || false
      })) || [])
    }
    if (section === 'grupo_familiar') {
      setEditGrupo(cliente.grupoFamiliar?.map(g => ({
        id: g.id,
        nombre: g.nombre || '',
        dni: g.dni || '',
        parentesco: g.parentesco || ''
      })) || [])
    }
  }

  const cancelEditing = () => {
    setEditingSection(null)
    setEditData({})
    setEditLocales([])
    setEditGrupo([])
  }

  const handleSave = async (section) => {
    let success = false
    if (section === 'locales') {
      success = await guardarLocales(editLocales)
    } else if (section === 'grupo_familiar') {
      success = await guardarGrupo(editGrupo)
    } else {
      success = await actualizarCampos(editData)
    }
    if (success) {
      cancelEditing()
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent"></div>
        <p className="text-gray-500 mt-2">Cargando cliente...</p>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cliente no encontrado</p>
        <Link to="/mi-cartera" className="text-violet-600 hover:underline mt-2 inline-block">
          Volver a Mi Cartera
        </Link>
      </div>
    )
  }

  const isMonotributista = cliente.tipo_contribuyente === 'monotributista'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Link
              to="/mi-cartera"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {perfil?.nombre} {perfil?.apellido}
              </h1>
              <p className="text-gray-500 font-mono">{formatCuit(cliente.cuit)}</p>
              {cliente.razon_social && cliente.razon_social !== `${perfil?.nombre} ${perfil?.apellido}` && (
                <p className="text-sm text-gray-600">{cliente.razon_social}</p>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2">
            {cliente.categoria_monotributo && (
              <span className="px-3 py-1 bg-violet-100 text-violet-700 font-bold rounded-lg">
                Cat. {cliente.categoria_monotributo}
              </span>
            )}
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
              cliente.estado_pago_monotributo === 'al_dia' ? 'bg-green-100 text-green-700' :
              cliente.estado_pago_monotributo === 'debe_1_cuota' ? 'bg-amber-100 text-amber-700' :
              cliente.estado_pago_monotributo === 'debe_2_mas' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {ESTADOS_PAGO.find(e => e.value === cliente.estado_pago_monotributo)?.label || 'Sin info'}
            </span>
          </div>
        </div>

        {/* Acciones rapidas - Desktop */}
        <div className="hidden md:flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          {perfil?.telefono && (
            <a
              href={`tel:${perfil.telefono}`}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
            >
              <Phone className="w-4 h-4" />
              Llamar
            </a>
          )}
          {perfil?.whatsapp && (
            <a
              href={`https://wa.me/54${perfil.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          )}
          {perfil?.email && (
            <a
              href={`mailto:${perfil.email}`}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email
            </a>
          )}
          <Link
            to={`/facturacion/${clientId}`}
            state={{ fromCartera: true, clientId }}
            className="flex items-center gap-2 px-3 py-2 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg text-sm transition-colors"
          >
            <Receipt className="w-4 h-4" />
            Facturacion
          </Link>
        </div>

        {/* Acciones rapidas - Mobile: ActionMenu */}
        <div className="md:hidden mt-4 pt-4 border-t border-gray-100 relative">
          <button
            onClick={() => setShowActionsMenu(!showActionsMenu)}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium text-sm"
          >
            <MoreVertical className="w-4 h-4" />
            Acciones
          </button>
          {showActionsMenu && (
            <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
              {perfil?.telefono && (
                <a
                  href={`tel:${perfil.telefono}`}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => setShowActionsMenu(false)}
                >
                  <Phone className="w-4 h-4 text-gray-500" />
                  Llamar
                </a>
              )}
              {perfil?.whatsapp && (
                <a
                  href={`https://wa.me/54${perfil.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => setShowActionsMenu(false)}
                >
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  WhatsApp
                </a>
              )}
              {perfil?.email && (
                <a
                  href={`mailto:${perfil.email}`}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => setShowActionsMenu(false)}
                >
                  <Mail className="w-4 h-4 text-gray-500" />
                  Email
                </a>
              )}
              <Link
                to={`/facturacion/${clientId}`}
                state={{ fromCartera: true, clientId }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-violet-600"
                onClick={() => setShowActionsMenu(false)}
              >
                <Receipt className="w-4 h-4" />
                Facturacion
              </Link>
            </div>
          )}
        </div>

        {/* Contador asignado */}
        {contador && (
          <p className="text-sm text-gray-500 mt-3">
            Asignado a: <span className="font-medium">{contador.nombre} {contador.apellido}</span>
          </p>
        )}
      </div>

      {/* Notificaciones al cliente */}
      <FichaSeccionNotificaciones clientId={clientId} />

      {/* Historial de categorias */}
      {isMonotributista && (
        <FichaSeccion
          titulo="Historial de Categorias"
          icono={History}
          iconColor="text-violet-600"
          defaultOpen={true}
        >
          <FichaHistorialCategorias
            historial={cliente.historialCategorias}
            categoriaActual={cliente.categoria_monotributo}
          />
        </FichaSeccion>
      )}

      {/* Datos Fiscales */}
      <FichaSeccion
        titulo="Datos Fiscales"
        icono={Building2}
        iconColor="text-violet-600"
        editable
        editing={editingSection === 'fiscal'}
        onEdit={() => startEditing('fiscal', {
          tipo_contribuyente: cliente.tipo_contribuyente,
          categoria_monotributo: cliente.categoria_monotributo,
          tipo_actividad: cliente.tipo_actividad,
          gestion_facturacion: cliente.gestion_facturacion,
          razon_social: cliente.razon_social,
          codigo_actividad_afip: cliente.codigo_actividad_afip,
          descripcion_actividad_afip: cliente.descripcion_actividad_afip,
          punto_venta_afip: cliente.punto_venta_afip
        })}
        onSave={() => handleSave('fiscal')}
        onCancel={cancelEditing}
        saving={saving}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <FichaCampo
            label="Tipo contribuyente"
            value={cliente.tipo_contribuyente === 'monotributista' ? 'Monotributista' : 'Resp. Inscripto'}
            editValue={editData.tipo_contribuyente}
            onChange={(v) => setEditData(p => ({ ...p, tipo_contribuyente: v }))}
            editing={editingSection === 'fiscal'}
            type="select"
            options={[
              { value: 'monotributista', label: 'Monotributista' },
              { value: 'responsable_inscripto', label: 'Responsable Inscripto' }
            ]}
          />
          {isMonotributista && (
            <FichaCampo
              label="Categoria"
              value={cliente.categoria_monotributo}
              editValue={editData.categoria_monotributo}
              onChange={(v) => setEditData(p => ({ ...p, categoria_monotributo: v }))}
              editing={editingSection === 'fiscal'}
              type="select"
              options={CATEGORIAS.map(c => ({ value: c, label: `Categoria ${c}` }))}
            />
          )}
          <FichaCampo
            label="Tipo actividad"
            value={TIPOS_ACTIVIDAD.find(t => t.value === cliente.tipo_actividad)?.label || cliente.tipo_actividad}
            editValue={editData.tipo_actividad}
            onChange={(v) => setEditData(p => ({ ...p, tipo_actividad: v }))}
            editing={editingSection === 'fiscal'}
            type="select"
            options={TIPOS_ACTIVIDAD}
          />
          <FichaCampo
            label="Gestion facturacion"
            value={GESTION_FACTURACION.find(g => g.value === cliente.gestion_facturacion)?.label || cliente.gestion_facturacion}
            editValue={editData.gestion_facturacion}
            onChange={(v) => setEditData(p => ({ ...p, gestion_facturacion: v }))}
            editing={editingSection === 'fiscal'}
            type="select"
            options={GESTION_FACTURACION}
          />
          <FichaCampo
            label="Razon social"
            value={cliente.razon_social}
            editValue={editData.razon_social}
            onChange={(v) => setEditData(p => ({ ...p, razon_social: v }))}
            editing={editingSection === 'fiscal'}
            className="md:col-span-3"
          />
          <FichaCampo
            label="Codigo actividad AFIP"
            value={cliente.codigo_actividad_afip}
            editValue={editData.codigo_actividad_afip}
            onChange={(v) => setEditData(p => ({ ...p, codigo_actividad_afip: v }))}
            editing={editingSection === 'fiscal'}
          />
          <FichaCampo
            label="Descripcion actividad"
            value={cliente.descripcion_actividad_afip}
            editValue={editData.descripcion_actividad_afip}
            onChange={(v) => setEditData(p => ({ ...p, descripcion_actividad_afip: v }))}
            editing={editingSection === 'fiscal'}
            className="md:col-span-2"
          />
          <FichaCampo
            label="Punto de venta AFIP"
            value={cliente.punto_venta_afip}
            editValue={editData.punto_venta_afip}
            onChange={(v) => setEditData(p => ({ ...p, punto_venta_afip: v }))}
            editing={editingSection === 'fiscal'}
          />
        </div>
      </FichaSeccion>

      {/* Situacion especial - Relacion de dependencia */}
      {isMonotributista && (
        <FichaSeccion
          titulo="Situacion Laboral"
          icono={Briefcase}
          iconColor="text-teal-600"
          defaultOpen={true}
          editable
          editing={editingSection === 'laboral'}
          onEdit={() => startEditing('laboral', {
            trabaja_relacion_dependencia: cliente.trabaja_relacion_dependencia,
            empleador_cuit: cliente.empleador_cuit,
            empleador_razon_social: cliente.empleador_razon_social,
            sueldo_bruto: cliente.sueldo_bruto,
            tiene_empleados: cliente.tiene_empleados,
            cantidad_empleados: cliente.cantidad_empleados
          })}
          onSave={() => handleSave('laboral')}
          onCancel={cancelEditing}
          saving={saving}
        >
          <div className="space-y-4 pt-4">
            <FichaCampo
              label="Trabaja en relacion de dependencia"
              value={cliente.trabaja_relacion_dependencia}
              editValue={editData.trabaja_relacion_dependencia}
              onChange={(v) => setEditData(p => ({ ...p, trabaja_relacion_dependencia: v }))}
              editing={editingSection === 'laboral'}
              type="checkbox"
            />
            {(cliente.trabaja_relacion_dependencia || editData.trabaja_relacion_dependencia) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
                <FichaCampo
                  label="CUIT Empleador"
                  value={cliente.empleador_cuit}
                  editValue={editData.empleador_cuit}
                  onChange={(v) => setEditData(p => ({ ...p, empleador_cuit: v }))}
                  editing={editingSection === 'laboral'}
                />
                <FichaCampo
                  label="Empleador"
                  value={cliente.empleador_razon_social}
                  editValue={editData.empleador_razon_social}
                  onChange={(v) => setEditData(p => ({ ...p, empleador_razon_social: v }))}
                  editing={editingSection === 'laboral'}
                />
                <FichaCampo
                  label="Sueldo bruto"
                  value={formatMonto(cliente.sueldo_bruto)}
                  editValue={editData.sueldo_bruto}
                  onChange={(v) => setEditData(p => ({ ...p, sueldo_bruto: v }))}
                  editing={editingSection === 'laboral'}
                  type="number"
                />
              </div>
            )}
            <div className="pt-2 border-t border-gray-100">
              <FichaCampo
                label="Tiene empleados"
                value={cliente.tiene_empleados}
                editValue={editData.tiene_empleados}
                onChange={(v) => setEditData(p => ({ ...p, tiene_empleados: v }))}
                editing={editingSection === 'laboral'}
                type="checkbox"
              />
              {(cliente.tiene_empleados || editData.tiene_empleados) && (
                <div className="ml-6 mt-2">
                  <FichaCampo
                    label="Cantidad"
                    value={cliente.cantidad_empleados}
                    editValue={editData.cantidad_empleados}
                    onChange={(v) => setEditData(p => ({ ...p, cantidad_empleados: v }))}
                    editing={editingSection === 'laboral'}
                    type="number"
                  />
                </div>
              )}
            </div>
          </div>
        </FichaSeccion>
      )}

      {/* Locales comerciales - usando nuevo componente */}
      {isMonotributista && (
        <FichaSeccionLocales
          locales={cliente.locales || []}
          onAgregar={async (data) => {
            // Mapear campos del formulario al servicio
            const localData = {
              descripcion: data.descripcion,
              direccion: data.direccion,
              localidad: data.localidad,
              provincia: data.provincia,
              alquiler: data.alquiler_mensual,
              superficie: data.superficie_m2,
              esPropio: data.es_propio
            }
            const success = await guardarLocales([...cliente.locales || [], localData])
            if (success) refetch()
          }}
          onActualizar={async (localId, data) => {
            const localesActualizados = (cliente.locales || []).map(l =>
              l.id === localId ? { ...l, ...data } : l
            )
            const success = await guardarLocales(localesActualizados)
            if (success) refetch()
          }}
          onEliminar={async (localId) => {
            const localesFiltrados = (cliente.locales || []).filter(l => l.id !== localId)
            const success = await guardarLocales(localesFiltrados)
            if (success) refetch()
          }}
          saving={saving}
          editable={true}
        />
      )}

      {/* Obra Social */}
      {isMonotributista && (
        <FichaSeccion
          titulo="Obra Social"
          icono={Heart}
          iconColor="text-pink-600"
          defaultOpen={true}
          editable
          editing={editingSection === 'obra_social'}
          onEdit={() => startEditing('obra_social', {
            obra_social: cliente.obra_social,
            obra_social_tipo_cobertura: cliente.obra_social_tipo_cobertura,
            obra_social_adicional: cliente.obra_social_adicional,
            obra_social_adicional_nombre: cliente.obra_social_adicional_nombre
          })}
          onSave={() => handleSave('obra_social')}
          onCancel={cancelEditing}
          saving={saving}
        >
          <div className="space-y-4 pt-4">
            <FichaCampo
              label="Obra social elegida"
              value={cliente.obra_social}
              editValue={editData.obra_social}
              onChange={(v) => setEditData(p => ({ ...p, obra_social: v }))}
              editing={editingSection === 'obra_social'}
            />
            <div className="grid grid-cols-2 gap-4">
              <FichaCampo
                label="Tipo cobertura"
                value={cliente.obra_social_tipo_cobertura === 'grupo_familiar' ? 'Grupo familiar' : 'Solo titular'}
                editValue={editData.obra_social_tipo_cobertura}
                onChange={(v) => setEditData(p => ({ ...p, obra_social_tipo_cobertura: v }))}
                editing={editingSection === 'obra_social'}
                type="select"
                options={[
                  { value: 'titular', label: 'Solo titular' },
                  { value: 'grupo_familiar', label: 'Grupo familiar' }
                ]}
              />
              <FichaCampo
                label="Obra social adicional"
                value={cliente.obra_social_adicional}
                editValue={editData.obra_social_adicional}
                onChange={(v) => setEditData(p => ({ ...p, obra_social_adicional: v }))}
                editing={editingSection === 'obra_social'}
                type="checkbox"
              />
            </div>
            {(cliente.obra_social_adicional || editData.obra_social_adicional) && (
              <FichaCampo
                label="Nombre plan adicional"
                value={cliente.obra_social_adicional_nombre}
                editValue={editData.obra_social_adicional_nombre}
                onChange={(v) => setEditData(p => ({ ...p, obra_social_adicional_nombre: v }))}
                editing={editingSection === 'obra_social'}
              />
            )}

          </div>
        </FichaSeccion>
      )}

      {/* Grupo Familiar - seccion separada con nuevo componente */}
      {isMonotributista && (
        <FichaSeccionGrupoFamiliar
          integrantes={cliente.grupoFamiliar || []}
          onAgregar={async (data) => {
            const nuevoIntegrante = {
              nombre: data.nombre,
              dni: data.dni,
              fechaNacimiento: data.fecha_nacimiento,
              parentesco: data.parentesco,
              parentescoOtro: data.parentesco_otro,
              cuil: data.cuil
            }
            const success = await guardarGrupo([...cliente.grupoFamiliar || [], nuevoIntegrante])
            if (success) refetch()
          }}
          onActualizar={async (integranteId, data) => {
            const integrantesActualizados = (cliente.grupoFamiliar || []).map(i =>
              i.id === integranteId ? { ...i, ...data } : i
            )
            const success = await guardarGrupo(integrantesActualizados)
            if (success) refetch()
          }}
          onEliminar={async (integranteId) => {
            const integrantesFiltrados = (cliente.grupoFamiliar || []).filter(i => i.id !== integranteId)
            const success = await guardarGrupo(integrantesFiltrados)
            if (success) refetch()
          }}
          saving={saving}
          editable={true}
        />
      )}

      {/* Pago del Monotributo */}
      {isMonotributista && (
        <FichaSeccion
          titulo="Pago del Monotributo"
          icono={CreditCard}
          iconColor="text-green-600"
          defaultOpen={true}
          editable
          editing={editingSection === 'pago'}
          onEdit={() => startEditing('pago', {
            metodo_pago_monotributo: cliente.metodo_pago_monotributo,
            estado_pago_monotributo: cliente.estado_pago_monotributo,
            cbu_debito: cliente.cbu_debito
          })}
          onSave={() => handleSave('pago')}
          onCancel={cancelEditing}
          saving={saving}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <FichaCampo
              label="Metodo de pago"
              value={METODOS_PAGO.find(m => m.value === cliente.metodo_pago_monotributo)?.label || cliente.metodo_pago_monotributo}
              editValue={editData.metodo_pago_monotributo}
              onChange={(v) => setEditData(p => ({ ...p, metodo_pago_monotributo: v }))}
              editing={editingSection === 'pago'}
              type="select"
              options={METODOS_PAGO}
            />
            <FichaCampo
              label="Estado de pago"
              value={ESTADOS_PAGO.find(e => e.value === cliente.estado_pago_monotributo)?.label || cliente.estado_pago_monotributo}
              editValue={editData.estado_pago_monotributo}
              onChange={(v) => setEditData(p => ({ ...p, estado_pago_monotributo: v }))}
              editing={editingSection === 'pago'}
              type="select"
              options={ESTADOS_PAGO}
            />
            {(cliente.metodo_pago_monotributo === 'debito_automatico' || editData.metodo_pago_monotributo === 'debito_automatico') && (
              <FichaCampo
                label="CBU / Alias"
                value={cliente.cbu_debito}
                editValue={editData.cbu_debito}
                onChange={(v) => setEditData(p => ({ ...p, cbu_debito: v }))}
                editing={editingSection === 'pago'}
              />
            )}
          </div>
        </FichaSeccion>
      )}

      {/* Accesos ARCA */}
      {isMonotributista && (
        <FichaSeccion
          titulo="Accesos ARCA"
          icono={Shield}
          iconColor="text-purple-600"
          defaultOpen={true}
          editable
          editing={editingSection === 'arca'}
          onEdit={() => startEditing('arca', {
            nivel_clave_fiscal: cliente.nivel_clave_fiscal,
            servicios_delegados: cliente.servicios_delegados,
            fecha_delegacion: cliente.fecha_delegacion,
            factura_electronica_habilitada: cliente.factura_electronica_habilitada
          })}
          onSave={() => handleSave('arca')}
          onCancel={cancelEditing}
          saving={saving}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <FichaCampo
              label="Nivel clave fiscal"
              value={cliente.nivel_clave_fiscal ? `Nivel ${cliente.nivel_clave_fiscal}` : '-'}
              editValue={editData.nivel_clave_fiscal}
              onChange={(v) => setEditData(p => ({ ...p, nivel_clave_fiscal: v }))}
              editing={editingSection === 'arca'}
              type="select"
              options={[2, 3, 4, 5].map(n => ({ value: n, label: `Nivel ${n}` }))}
            />
            <FichaCampo
              label="Servicios delegados"
              value={cliente.servicios_delegados}
              editValue={editData.servicios_delegados}
              onChange={(v) => setEditData(p => ({ ...p, servicios_delegados: v }))}
              editing={editingSection === 'arca'}
              type="checkbox"
            />
            <FichaCampo
              label="Factura electronica"
              value={cliente.factura_electronica_habilitada}
              editValue={editData.factura_electronica_habilitada}
              onChange={(v) => setEditData(p => ({ ...p, factura_electronica_habilitada: v }))}
              editing={editingSection === 'arca'}
              type="checkbox"
            />
            {(cliente.servicios_delegados || editData.servicios_delegados) && (
              <FichaCampo
                label="Fecha delegacion"
                value={cliente.fecha_delegacion}
                editValue={editData.fecha_delegacion}
                onChange={(v) => setEditData(p => ({ ...p, fecha_delegacion: v }))}
                editing={editingSection === 'arca'}
                type="date"
              />
            )}
          </div>
        </FichaSeccion>
      )}

      {/* Domicilio Fiscal */}
      <FichaSeccion
        titulo="Domicilio Fiscal"
        icono={MapPin}
        iconColor="text-red-600"
        defaultOpen={true}
        editable
        editing={editingSection === 'domicilio'}
        onEdit={() => startEditing('domicilio', {
          domicilio_fiscal: cliente.domicilio_fiscal,
          codigo_postal: cliente.codigo_postal,
          localidad: cliente.localidad,
          provincia: cliente.provincia
        })}
        onSave={() => handleSave('domicilio')}
        onCancel={cancelEditing}
        saving={saving}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <FichaCampo
            label="Domicilio"
            value={cliente.domicilio_fiscal}
            editValue={editData.domicilio_fiscal}
            onChange={(v) => setEditData(p => ({ ...p, domicilio_fiscal: v }))}
            editing={editingSection === 'domicilio'}
            className="md:col-span-2"
          />
          <FichaCampo
            label="Codigo postal"
            value={cliente.codigo_postal}
            editValue={editData.codigo_postal}
            onChange={(v) => setEditData(p => ({ ...p, codigo_postal: v }))}
            editing={editingSection === 'domicilio'}
          />
          <FichaCampo
            label="Localidad"
            value={cliente.localidad}
            editValue={editData.localidad}
            onChange={(v) => setEditData(p => ({ ...p, localidad: v }))}
            editing={editingSection === 'domicilio'}
          />
          <FichaCampo
            label="Provincia"
            value={cliente.provincia}
            editValue={editData.provincia}
            onChange={(v) => setEditData(p => ({ ...p, provincia: v }))}
            editing={editingSection === 'domicilio'}
          />
        </div>
      </FichaSeccion>

      {/* Ingresos Brutos */}
      <FichaSeccion
        titulo="Ingresos Brutos"
        icono={FileText}
        iconColor="text-teal-600"
        defaultOpen={true}
        editable
        editing={editingSection === 'iibb'}
        onEdit={() => startEditing('iibb', {
          regimen_iibb: cliente.regimen_iibb,
          numero_iibb: cliente.numero_iibb
        })}
        onSave={() => handleSave('iibb')}
        onCancel={cancelEditing}
        saving={saving}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <FichaCampo
            label="Regimen"
            value={REGIMENES_IIBB.find(r => r.value === cliente.regimen_iibb)?.label || cliente.regimen_iibb}
            editValue={editData.regimen_iibb}
            onChange={(v) => setEditData(p => ({ ...p, regimen_iibb: v }))}
            editing={editingSection === 'iibb'}
            type="select"
            options={REGIMENES_IIBB}
          />
          <FichaCampo
            label="Numero IIBB"
            value={cliente.numero_iibb}
            editValue={editData.numero_iibb}
            onChange={(v) => setEditData(p => ({ ...p, numero_iibb: v }))}
            editing={editingSection === 'iibb'}
          />
        </div>
      </FichaSeccion>

      {/* Notas internas */}
      {cliente.notas_internas_fiscales && (
        <FichaSeccion
          titulo="Notas Internas"
          icono={AlertTriangle}
          iconColor="text-amber-600"
          defaultOpen={true}
        >
          <div className="pt-4">
            <p className="text-gray-700 whitespace-pre-wrap">{cliente.notas_internas_fiscales}</p>
          </div>
        </FichaSeccion>
      )}

      {/* Historial de cambios completo */}
      <FichaSeccion
        titulo="Historial de Cambios"
        icono={History}
        iconColor="text-indigo-600"
        defaultOpen={true}
      >
        <div className="pt-4">
          <HistorialCambiosCliente
            userId={perfil?.id}
            clientFiscalDataId={cliente.id}
          />
        </div>
      </FichaSeccion>

      {/* Auditoria */}
      <FichaAuditoria auditoria={auditoria} />
    </div>
  )
}
