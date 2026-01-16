import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Check, User, Briefcase, FileText, Settings, History } from 'lucide-react'
import { validateUserForm, validateFiscalDataForm, validatePhone } from '../utils/validators'
import { useRoles } from '../hooks/useRoles'
import { getAvailableCounters } from '../services/userService'
import RoleSelector from './RoleSelector'
import FiscalDataForm from './FiscalDataForm'
import ModuleAccessManager from './ModuleAccessManager'
import HistoricalBillingForm from './HistoricalBillingForm'

const STEPS = [
  { id: 1, title: 'Datos Personales', icon: User },
  { id: 2, title: 'Rol y Asignación', icon: Briefcase },
  { id: 3, title: 'Datos Fiscales', icon: FileText },
  { id: 4, title: 'Fact. Historica', icon: History }
]

/**
 * Formulario de usuario (wizard en mobile, tabs en desktop)
 */
export function UserForm({ user, onSubmit, onCancel, loading }) {
  const { roles } = useRoles()
  const [currentStep, setCurrentStep] = useState(1)
  const [counters, setCounters] = useState([])
  const [defaultModules, setDefaultModules] = useState([])

  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.email || '',
    password: '',
    telefono: user?.telefono || '',
    whatsapp: user?.whatsapp || '',
    dni: user?.dni || '',
    notasInternas: user?.notas_internas || '',
    roleId: user?.role_id || '',
    assignedTo: user?.assigned_to || '',
    fiscalData: {
      cuit: user?.fiscal_data?.cuit || '',
      razonSocial: user?.fiscal_data?.razon_social || '',
      tipoContribuyente: user?.fiscal_data?.tipo_contribuyente || '',
      categoriaMonotributo: user?.fiscal_data?.categoria_monotributo || '',
      tipoActividad: user?.fiscal_data?.tipo_actividad || '',
      gestionFacturacion: user?.fiscal_data?.gestion_facturacion || 'contadora',
      domicilioFiscal: user?.fiscal_data?.domicilio_fiscal || '',
      codigoPostal: user?.fiscal_data?.codigo_postal || '',
      localidad: user?.fiscal_data?.localidad || '',
      provincia: user?.fiscal_data?.provincia || '',
      regimenIibb: user?.fiscal_data?.regimen_iibb || '',
      numeroIibb: user?.fiscal_data?.numero_iibb || '',
      facturadorElectronico: user?.fiscal_data?.facturador_electronico || '',
      fechaAltaMonotributo: user?.fiscal_data?.fecha_alta_monotributo || '',
      fechaUltimaRecategorizacion: user?.fiscal_data?.fecha_ultima_recategorizacion || '',
      codigoActividadAfip: user?.fiscal_data?.codigo_actividad_afip || '',
      descripcionActividadAfip: user?.fiscal_data?.descripcion_actividad_afip || '',
      puntoVentaAfip: user?.fiscal_data?.punto_venta_afip || '',
      notasInternasFiscales: user?.fiscal_data?.notas_internas_fiscales || '',
      esAltaCliente: true, // Por defecto asumimos que es un alta (nuevo cliente)
      // Situacion especial
      trabajaRelacionDependencia: user?.fiscal_data?.trabaja_relacion_dependencia || false,
      empleadorCuit: user?.fiscal_data?.empleador_cuit || '',
      empleadorRazonSocial: user?.fiscal_data?.empleador_razon_social || '',
      sueldoBruto: user?.fiscal_data?.sueldo_bruto || null,
      tieneLocal: user?.fiscal_data?.tiene_local || false,
      locales: user?.locales || [], // Cargados desde client_locales
      // Empleados
      tieneEmpleados: user?.fiscal_data?.tiene_empleados || false,
      cantidadEmpleados: user?.fiscal_data?.cantidad_empleados || 0,
      // Obra social
      obraSocial: user?.fiscal_data?.obra_social || '',
      obraSocialTipoCobertura: user?.fiscal_data?.obra_social_tipo_cobertura || 'titular',
      obraSocialAdicional: user?.fiscal_data?.obra_social_adicional || false,
      obraSocialAdicionalNombre: user?.fiscal_data?.obra_social_adicional_nombre || '',
      grupoFamiliar: user?.grupo_familiar || [], // Cargados desde client_grupo_familiar
      // Pago monotributo
      metodoPagoMonotributo: user?.fiscal_data?.metodo_pago_monotributo || '',
      estadoPagoMonotributo: user?.fiscal_data?.estado_pago_monotributo || 'al_dia',
      cbuDebito: user?.fiscal_data?.cbu_debito || '',
      // Pago IIBB
      metodoPagoIibb: user?.fiscal_data?.metodo_pago_iibb || '',
      // Accesos ARCA
      nivelClaveFiscal: user?.fiscal_data?.nivel_clave_fiscal || null,
      serviciosDelegados: user?.fiscal_data?.servicios_delegados || false,
      fechaDelegacion: user?.fiscal_data?.fecha_delegacion || '',
      facturaElectronicaHabilitada: user?.fiscal_data?.factura_electronica_habilitada || false,
      // Historial categoria simple
      tuvoCategoriaAnterior: !!user?.fiscal_data?.categoria_anterior,
      categoriaAnterior: user?.fiscal_data?.categoria_anterior || '',
      fechaCambioCategoria: user?.fiscal_data?.fecha_cambio_categoria || '',
      motivoCambioCategoria: user?.fiscal_data?.motivo_cambio_categoria || ''
    },
    historicalBilling: {
      modoHistorico: 'total',
      totalAcumulado12Meses: null,
      fechaCorte: '',
      notaHistorico: '',
      facturacionMensual: null,
      omitirHistorico: false
    },
    extraModules: user?.module_access?.map(ma => ma.module_id) || []
  })

  const [errors, setErrors] = useState({})
  const justChangedStep = useRef(false)

  // Cargar contadores disponibles
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

  // Actualizar módulos por defecto cuando cambia el rol
  useEffect(() => {
    if (formData.roleId) {
      const role = roles.find(r => r.id === formData.roleId)
      if (role?.default_modules) {
        setDefaultModules(role.default_modules.map(dm => dm.module_id))
      }
    }
  }, [formData.roleId, roles])

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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleFiscalDataChange = (fiscalData) => {
    setFormData(prev => ({ ...prev, fiscalData }))
    // Limpiar errores de campos fiscales cuando se editan
    if (Object.keys(errors).some(key => ['cuit', 'tipoContribuyente', 'categoriaMonotributo'].includes(key))) {
      setErrors(prev => ({
        ...prev,
        cuit: undefined,
        tipoContribuyente: undefined,
        categoriaMonotributo: undefined
      }))
    }
  }

  const handleHistoricalBillingChange = (historicalBilling) => {
    setFormData(prev => ({ ...prev, historicalBilling }))
  }

  // Verificar si necesita cargar facturacion historica
  const requiresHistoricalBilling = () => {
    // Solo para nuevos usuarios monotributistas que NO son alta
    if (user) return false // No mostrar en edicion
    const role = roles.find(r => r.id === formData.roleId)
    const isMonotributista = role?.name === 'monotributista'
    return isMonotributista && !formData.fiscalData.esAltaCliente
  }

  const validateStep = (step) => {
    switch (step) {
      case 1: {
        const isNewUser = !user // Si no hay user, es un usuario nuevo
        const validation = validateUserForm(formData, isNewUser)
        if (!validation.valid) {
          setErrors(validation.errors)
          return false
        }
        return true
      }
      case 2: {
        if (!formData.roleId) {
          setErrors({ roleId: 'Debe seleccionar un rol' })
          return false
        }
        return true
      }
      case 3: {
        if (requiresFiscalData()) {
          const validation = validateFiscalDataForm(formData.fiscalData)
          if (!validation.valid) {
            setErrors(validation.errors)
            return false
          }
        }
        return true
      }
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setErrors({})
      let nextStepNum = currentStep + 1

      // Saltar paso 3 y 4 si no requiere datos fiscales
      if (currentStep === 2 && !requiresFiscalData()) {
        nextStepNum = 4 // Ir al final para enviar
      }
      // Saltar paso 4 si no requiere facturacion historica
      else if (currentStep === 3 && !requiresHistoricalBilling()) {
        nextStepNum = 4 // Ir al final para enviar
      }

      // Marcar que acabamos de cambiar de paso (para prevenir submit accidental)
      justChangedStep.current = true
      setTimeout(() => { justChangedStep.current = false }, 500)

      setCurrentStep(Math.min(nextStepNum, 4))
    }
  }

  const prevStep = () => {
    setErrors({})
    let prevStepNum = currentStep - 1

    // Volver correctamente si se saltó el paso 4
    if (currentStep === 4 && !requiresHistoricalBilling()) {
      prevStepNum = requiresFiscalData() ? 3 : 2
    }
    // Volver correctamente si se saltó el paso 3
    else if (currentStep === 4 && !requiresFiscalData()) {
      prevStepNum = 2
    }

    setCurrentStep(Math.max(prevStepNum, 1))
  }

  // Determinar el último paso
  const getLastStep = () => {
    if (!requiresFiscalData()) return 2
    if (!requiresHistoricalBilling()) return 3
    return 4
  }

  const isLastStep = currentStep === getLastStep() || currentStep === 4

  // Prevenir que Enter envíe el formulario excepto en el último paso con botón explícito
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Prevenir submit accidental justo después de cambiar de paso
    if (justChangedStep.current) {
      console.log('Submit bloqueado - acabamos de cambiar de paso')
      return
    }

    // Validar todos los pasos relevantes
    const stepsToValidate = [1, 2]
    if (requiresFiscalData()) stepsToValidate.push(3)
    if (requiresHistoricalBilling()) stepsToValidate.push(4)

    for (const step of stepsToValidate) {
      if (!validateStep(step)) {
        setCurrentStep(step)
        return
      }
    }

    // DEBUG: Ver formData antes de enviar
    console.log('UserForm handleSubmit - formData:', formData)
    console.log('UserForm handleSubmit - fiscalData:', formData.fiscalData)
    console.log('UserForm handleSubmit - fiscalData.cuit:', formData.fiscalData?.cuit)

    try {
      await onSubmit(formData)
    } catch (err) {
      setErrors({ submit: err.message })
    }
  }

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="max-w-2xl mx-auto">
      {/* Steps indicator */}
      <div className="mb-8">
        <div className="flex justify-between">
          {STEPS.map((step, index) => {
            // Ocultar paso 3 si no requiere datos fiscales
            if (step.id === 3 && !requiresFiscalData()) return null
            // Ocultar paso 4 si no requiere facturacion historica
            if (step.id === 4 && !requiresHistoricalBilling()) return null

            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            const StepIcon = step.icon

            return (
              <div key={step.id} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`mt-2 text-xs text-center hidden sm:block ${
                    isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && step.id !== 3 && step.id !== 4 && (
                  <div className={`h-1 flex-1 mx-2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        {/* Paso 1: Datos Personales */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Datos Personales</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.nombre && <p className="text-sm text-red-600 mt-1">{errors.nombre}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => handleChange('apellido', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.apellido ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.apellido && <p className="text-sm text-red-600 mt-1">{errors.apellido}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={!!user}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } ${user ? 'bg-gray-100' : ''}`}
              />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>

            {!user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 8 caracteres, una mayúscula, una minúscula y un número
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  placeholder="Ej: 11 1234-5678"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.telefono ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.telefono && <p className="text-sm text-red-600 mt-1">{errors.telefono}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp *
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  placeholder="Ej: 11 1234-5678"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.whatsapp ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.whatsapp && <p className="text-sm text-red-600 mt-1">{errors.whatsapp}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI
              </label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => handleChange('dni', e.target.value)}
                placeholder="Ej: 12.345.678"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.dni ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.dni && <p className="text-sm text-red-600 mt-1">{errors.dni}</p>}
            </div>

            {/* Notas internas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas internas
              </label>
              <textarea
                value={formData.notasInternas}
                onChange={(e) => handleChange('notasInternas', e.target.value)}
                placeholder="Observaciones internas sobre el cliente..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Solo visible para la contadora
              </p>
            </div>
          </div>
        )}

        {/* Paso 2: Rol y Asignación */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold mb-4">Rol y Asignación</h2>

            <RoleSelector
              value={formData.roleId}
              onChange={(value) => handleChange('roleId', value)}
              error={errors.roleId}
            />

            {requiresCounter() && counters.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contador asignado
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => handleChange('assignedTo', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
        )}

        {/* Paso 3: Datos Fiscales */}
        {currentStep === 3 && requiresFiscalData() && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Datos Fiscales</h2>
            <FiscalDataForm
              data={formData.fiscalData}
              onChange={handleFiscalDataChange}
              errors={errors}
              roleName={roles.find(r => r.id === formData.roleId)?.name}
            />
          </div>
        )}

        {/* Paso 4: Facturacion Historica */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Facturacion Historica</h2>
            <HistoricalBillingForm
              data={formData.historicalBilling}
              onChange={handleHistoricalBillingChange}
            />
          </div>
        )}

      </div>

      {/* Error general */}
      {errors.submit && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {errors.submit}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={currentStep === 1 ? onCancel : prevStep}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ChevronLeft className="w-5 h-5" />
          {currentStep === 1 ? 'Cancelar' : 'Anterior'}
        </button>

        {!isLastStep ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Siguiente
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                {user ? 'Guardar Cambios' : 'Crear Usuario'}
              </>
            )}
          </button>
        )}
      </div>
    </form>
  )
}

export default UserForm
