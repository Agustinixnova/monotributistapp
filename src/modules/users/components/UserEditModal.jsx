import { useState, useEffect } from 'react'
import { X, Save, User, Briefcase, FileText, Loader2 } from 'lucide-react'
import { useRoles } from '../hooks/useRoles'
import { getAvailableCounters, getUserById } from '../services/userService'
import FiscalDataForm from './FiscalDataForm'

/**
 * Modal de edicion de usuario - Todo en una sola vista
 */
export function UserEditModal({ userId, onClose, onSave, loading: externalLoading }) {
  const { roles } = useRoles()
  const [counters, setCounters] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    whatsapp: '',
    dni: '',
    notasInternas: '',
    roleId: '',
    assignedTo: '',
    fiscalData: {}
  })

  // Cargar datos del usuario
  useEffect(() => {
    async function loadUser() {
      if (!userId) return
      try {
        setLoadingData(true)
        setError(null)
        const user = await getUserById(userId)

        setFormData({
          nombre: user.nombre || '',
          apellido: user.apellido || '',
          email: user.email || '',
          telefono: user.telefono || '',
          whatsapp: user.whatsapp || '',
          dni: user.dni || '',
          notasInternas: user.notas_internas || '',
          roleId: user.role_id || '',
          assignedTo: user.assigned_to || '',
          fiscalData: {
            cuit: user.fiscal_data?.cuit || '',
            razonSocial: user.fiscal_data?.razon_social || '',
            tipoContribuyente: user.fiscal_data?.tipo_contribuyente || '',
            categoriaMonotributo: user.fiscal_data?.categoria_monotributo || '',
            tipoActividad: user.fiscal_data?.tipo_actividad || '',
            gestionFacturacion: user.fiscal_data?.gestion_facturacion || 'contadora',
            domicilioFiscal: user.fiscal_data?.domicilio_fiscal || '',
            codigoPostal: user.fiscal_data?.codigo_postal || '',
            localidad: user.fiscal_data?.localidad || '',
            provincia: user.fiscal_data?.provincia || '',
            regimenIibb: user.fiscal_data?.regimen_iibb || '',
            numeroIibb: user.fiscal_data?.numero_iibb || '',
            facturadorElectronico: user.fiscal_data?.facturador_electronico || '',
            fechaAltaMonotributo: user.fiscal_data?.fecha_alta_monotributo || '',
            fechaUltimaRecategorizacion: user.fiscal_data?.fecha_ultima_recategorizacion || '',
            codigoActividadAfip: user.fiscal_data?.codigo_actividad_afip || '',
            descripcionActividadAfip: user.fiscal_data?.descripcion_actividad_afip || '',
            puntoVentaAfip: user.fiscal_data?.punto_venta_afip || '',
            notasInternasFiscales: user.fiscal_data?.notas_internas_fiscales || '',
            trabajaRelacionDependencia: user.fiscal_data?.trabaja_relacion_dependencia || false,
            empleadorCuit: user.fiscal_data?.empleador_cuit || '',
            empleadorRazonSocial: user.fiscal_data?.empleador_razon_social || '',
            sueldoBruto: user.fiscal_data?.sueldo_bruto || null,
            tieneLocal: user.fiscal_data?.tiene_local || false,
            locales: user.locales || [],
            tieneEmpleados: user.fiscal_data?.tiene_empleados || false,
            cantidadEmpleados: user.fiscal_data?.cantidad_empleados || 0,
            obraSocial: user.fiscal_data?.obra_social || '',
            obraSocialTipoCobertura: user.fiscal_data?.obra_social_tipo_cobertura || 'titular',
            obraSocialAdicional: user.fiscal_data?.obra_social_adicional || false,
            obraSocialAdicionalNombre: user.fiscal_data?.obra_social_adicional_nombre || '',
            grupoFamiliar: user.grupo_familiar || [],
            metodoPagoMonotributo: user.fiscal_data?.metodo_pago_monotributo || '',
            estadoPagoMonotributo: user.fiscal_data?.estado_pago_monotributo || 'al_dia',
            cbuDebito: user.fiscal_data?.cbu_debito || '',
            nivelClaveFiscal: user.fiscal_data?.nivel_clave_fiscal || null,
            serviciosDelegados: user.fiscal_data?.servicios_delegados || false,
            fechaDelegacion: user.fiscal_data?.fecha_delegacion || '',
            facturaElectronicaHabilitada: user.fiscal_data?.factura_electronica_habilitada || false,
            tuvoCategoriaAnterior: !!user.fiscal_data?.categoria_anterior,
            categoriaAnterior: user.fiscal_data?.categoria_anterior || '',
            fechaCambioCategoria: user.fiscal_data?.fecha_cambio_categoria || '',
            motivoCambioCategoria: user.fiscal_data?.motivo_cambio_categoria || ''
          }
        })
      } catch (err) {
        console.error('Error cargando usuario:', err)
        setError('Error al cargar los datos del usuario')
      } finally {
        setLoadingData(false)
      }
    }
    loadUser()
  }, [userId])

  // Cargar contadores
  useEffect(() => {
    async function loadCounters() {
      try {
        const data = await getAvailableCounters()
        setCounters(data)
      } catch (err) {
        console.error('Error loading counters:', err)
      }
    }
    loadCounters()
  }, [])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFiscalDataChange = (fiscalData) => {
    setFormData(prev => ({ ...prev, fiscalData }))
  }

  // Verificar si el rol requiere datos fiscales
  const requiresFiscalData = () => {
    const role = roles.find(r => r.id === formData.roleId)
    return role?.name === 'monotributista' || role?.name === 'responsable_inscripto'
  }

  // Verificar si el rol requiere contador asignado
  const requiresCounter = () => {
    const role = roles.find(r => r.id === formData.roleId)
    return role?.name === 'monotributista' || role?.name === 'responsable_inscripto' || role?.name === 'operador_gastos'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      await onSave(formData)
    } catch (err) {
      console.error('Error guardando:', err)
      setError(err.message || 'Error al guardar los cambios')
      setSaving(false)
    }
  }

  const isLoading = loadingData || externalLoading || saving

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
              <User className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Editar Usuario</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading */}
        {loadingData && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-gray-600">Cargando datos...</span>
          </div>
        )}

        {/* Content */}
        {!loadingData && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-6 space-y-6">
              {/* Error */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                  {error}
                </div>
              )}

              {/* SECCION: Datos Personales */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-violet-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Datos Personales</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                    <input
                      type="text"
                      value={formData.apellido}
                      onChange={(e) => handleChange('apellido', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                    <input
                      type="text"
                      value={formData.dni}
                      onChange={(e) => handleChange('dni', e.target.value)}
                      placeholder="Ej: 12.345.678"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => handleChange('telefono', e.target.value)}
                      placeholder="Ej: 11 1234-5678"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => handleChange('whatsapp', e.target.value)}
                      placeholder="Ej: 11 1234-5678"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
                    <textarea
                      value={formData.notasInternas}
                      onChange={(e) => handleChange('notasInternas', e.target.value)}
                      placeholder="Observaciones internas sobre el cliente..."
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 resize-none"
                    />
                  </div>
                </div>
              </section>

              {/* SECCION: Rol y Asignacion */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Rol y Asignacion</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                    <select
                      value={formData.roleId}
                      onChange={(e) => handleChange('roleId', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 bg-white"
                      required
                    >
                      <option value="">Seleccionar rol</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.display_name || role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {requiresCounter() && counters.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contador asignado</label>
                      <select
                        value={formData.assignedTo}
                        onChange={(e) => handleChange('assignedTo', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 bg-white"
                      >
                        <option value="">Sin asignar</option>
                        {counters.map(counter => (
                          <option key={counter.id} value={counter.id}>
                            {counter.nombre} {counter.apellido}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </section>

              {/* SECCION: Datos Fiscales */}
              {requiresFiscalData() && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Datos Fiscales</h3>
                  </div>

                  <FiscalDataForm
                    data={formData.fiscalData}
                    onChange={handleFiscalDataChange}
                    errors={{}}
                    roleName={roles.find(r => r.id === formData.roleId)?.name}
                  />
                </section>
              )}
            </div>
          </form>
        )}

        {/* Footer con botones */}
        {!loadingData && (
          <div className="px-6 py-4 border-t bg-gray-50 flex gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserEditModal
