import { useState, useEffect } from 'react'
import {
  ChevronDown, ChevronUp, Info, Building2, CreditCard,
  Shield, Users, MapPin, FileText, AlertTriangle, Plus, Trash2
} from 'lucide-react'
import { validateCUIT } from '../utils/validators'
import { formatCUIT } from '../utils/formatters'
import { SelectorActividadAFIP } from './SelectorActividadAFIP'
import { SelectorObraSocial } from './SelectorObraSocial'

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Cordoba',
  'Corrientes', 'Entre Rios', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquen', 'Rio Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucuman'
]

const CATEGORIAS_MONOTRIBUTO = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']

const METODOS_PAGO = [
  { value: 'debito_automatico', label: 'Debito automatico' },
  { value: 'vep', label: 'VEP (Volante Electronico de Pago)' },
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'efectivo', label: 'Efectivo / Rapipago / PagoFacil' },
  { value: 'otro', label: 'Otro' }
]

const ESTADOS_PAGO = [
  { value: 'al_dia', label: 'Al dia', color: 'green' },
  { value: 'debe_1_cuota', label: 'Debe 1 cuota', color: 'yellow' },
  { value: 'debe_2_mas', label: 'Debe 2+ cuotas', color: 'red' },
  { value: 'desconocido', label: 'No se', color: 'gray' }
]

const PARENTESCOS = [
  { value: 'conyuge', label: 'Conyuge' },
  { value: 'concubino', label: 'Concubino/a' },
  { value: 'hijo', label: 'Hijo/a' },
  { value: 'otro', label: 'Otro' }
]

/**
 * Seccion colapsable
 */
function SeccionColapsable({ titulo, icono: Icon, children, defaultOpen = true, iconColor = 'text-violet-600' }) {
  const [abierto, setAbierto] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <span className="font-medium text-gray-900">{titulo}</span>
        </div>
        {abierto ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {abierto && (
        <div className="p-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * Formulario de datos fiscales reorganizado
 */
export function FiscalDataForm({ data, onChange, errors = {}, roleName }) {
  const [cuitFormatted, setCuitFormatted] = useState(data.cuit ? formatCUIT(data.cuit) : '')

  useEffect(() => {
    if (roleName && !data.tipoContribuyente) {
      const tipoContribuyente = roleName === 'monotributista' ? 'monotributista' : 'responsable_inscripto'
      onChange({ ...data, tipoContribuyente })
    }
  }, [roleName])

  const handleCuitChange = (e) => {
    const value = e.target.value.replace(/[^0-9-]/g, '')
    const cleanCuit = value.replace(/-/g, '').slice(0, 11)
    // Solo permitir el valor si no excede 11 digitos
    if (cleanCuit.length <= 11) {
      setCuitFormatted(value.slice(0, 13)) // 11 digitos + 2 guiones max
      onChange({ ...data, cuit: cleanCuit })
    }
  }

  const handleCuitBlur = () => {
    if (data.cuit && data.cuit.length === 11) {
      setCuitFormatted(formatCUIT(data.cuit))
    }
  }

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value })
  }

  const isMonotributista = data.tipoContribuyente === 'monotributista'

  return (
    <div className="space-y-4">
      {/* SECCION 1: IDENTIFICACION FISCAL */}
      <SeccionColapsable titulo="Identificacion Fiscal" icono={Building2} defaultOpen={true}>
        {/* CUIT */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CUIT *
          </label>
          <input
            type="text"
            value={cuitFormatted}
            onChange={handleCuitChange}
            onBlur={handleCuitBlur}
            placeholder="XX-XXXXXXXX-X"
            maxLength={13}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 ${
              errors.cuit ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.cuit && <p className="text-sm text-red-600 mt-1">{errors.cuit}</p>}
          {data.cuit && data.cuit.length === 11 && !validateCUIT(data.cuit) && (
            <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
              <Info className="w-4 h-4" />
              El CUIT ingresado no es valido
            </p>
          )}
        </div>

        {/* Razon Social */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Razon Social / Nombre de Fantasia
          </label>
          <input
            type="text"
            value={data.razonSocial || ''}
            onChange={(e) => handleChange('razonSocial', e.target.value)}
            placeholder="Ej: Juan Perez o Mi Negocio"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Tipo de Contribuyente */}
        {roleName ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Contribuyente
            </label>
            <div className="p-3 rounded-lg border-2 border-violet-500 bg-violet-50 text-violet-700 text-center font-medium">
              {isMonotributista ? 'Monotributista' : 'Responsable Inscripto'}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Contribuyente *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange('tipoContribuyente', 'monotributista')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  isMonotributista
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Monotributista
              </button>
              <button
                type="button"
                onClick={() => handleChange('tipoContribuyente', 'responsable_inscripto')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  data.tipoContribuyente === 'responsable_inscripto'
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Resp. Inscripto
              </button>
            </div>
          </div>
        )}

        {/* Fecha alta monotributo */}
        {isMonotributista && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha alta en Monotributo
            </label>
            <input
              type="date"
              value={data.fechaAltaMonotributo || ''}
              onChange={(e) => handleChange('fechaAltaMonotributo', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-xs text-gray-400 mt-1">Importante para calcular los 12 meses de tope</p>
          </div>
        )}
      </SeccionColapsable>

      {/* SECCION 2: CATEGORIA Y ACTIVIDAD (solo monotributistas) */}
      {isMonotributista && (
        <SeccionColapsable titulo="Categoria y Actividad" icono={FileText} iconColor="text-blue-600">
          {/* Categoria actual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria actual *
            </label>
            <div className="relative">
              <select
                value={data.categoriaMonotributo || ''}
                onChange={(e) => handleChange('categoriaMonotributo', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-violet-500 ${
                  errors.categoriaMonotributo ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar categoria</option>
                {CATEGORIAS_MONOTRIBUTO.map(cat => (
                  <option key={cat} value={cat}>Categoria {cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {errors.categoriaMonotributo && (
              <p className="text-sm text-red-600 mt-1">{errors.categoriaMonotributo}</p>
            )}
          </div>

          {/* Categoria anterior (colapsable) */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.tuvoCategoriaAnterior || false}
                onChange={(e) => handleChange('tuvoCategoriaAnterior', e.target.checked)}
                className="mt-1 w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
              />
              <div>
                <span className="font-medium text-gray-900">Tuvo otra categoria antes</span>
                <p className="text-sm text-gray-600 mt-0.5">
                  Marcar si el cliente se recategorizo recientemente
                </p>
              </div>
            </label>

            {data.tuvoCategoriaAnterior && (
              <div className="mt-3 pt-3 border-t border-amber-200 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria anterior
                  </label>
                  <select
                    value={data.categoriaAnterior || ''}
                    onChange={(e) => handleChange('categoriaAnterior', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Seleccionar</option>
                    {CATEGORIAS_MONOTRIBUTO.map(cat => (
                      <option key={cat} value={cat}>Cat. {cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha del cambio
                  </label>
                  <input
                    type="date"
                    value={data.fechaCambioCategoria || ''}
                    onChange={(e) => handleChange('fechaCambioCategoria', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tipo de Actividad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Actividad
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['servicios', 'productos', 'ambos'].map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => handleChange('tipoActividad', tipo)}
                  className={`p-2 rounded-lg border-2 text-center text-sm transition-colors capitalize ${
                    data.tipoActividad === tipo
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          {/* Actividad ARCA */}
          <SelectorActividadAFIP
            codigo={data.codigoActividadAfip || ''}
            descripcion={data.descripcionActividadAfip || ''}
            onSelect={(codigo, descripcion) => {
              handleChange('codigoActividadAfip', codigo)
              handleChange('descripcionActividadAfip', descripcion)
            }}
          />

          {/* Punto de venta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Punto de venta ARCA
            </label>
            <input
              type="number"
              value={data.puntoVentaAfip || ''}
              onChange={(e) => handleChange('puntoVentaAfip', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Ej: 1"
              min="1"
              max="99999"
              className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 font-mono"
            />
          </div>

          {/* Gestion de facturacion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Quien gestiona la facturacion?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange('gestionFacturacion', 'autonomo')}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  data.gestionFacturacion === 'autonomo'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900 text-sm">El cliente factura solo</div>
                <div className="text-xs text-gray-500 mt-1">Carga su facturacion en la app</div>
              </button>
              <button
                type="button"
                onClick={() => handleChange('gestionFacturacion', 'contadora')}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  data.gestionFacturacion === 'contadora' || !data.gestionFacturacion
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900 text-sm">La contadora le factura</div>
                <div className="text-xs text-gray-500 mt-1">Vos cargas la facturacion</div>
              </button>
            </div>
          </div>
        </SeccionColapsable>
      )}

      {/* SECCION 3: SITUACION ESPECIAL (solo monotributistas) */}
      {isMonotributista && (
        <SeccionColapsable titulo="Situacion Especial" icono={Users} iconColor="text-orange-600" defaultOpen={false}>
          <p className="text-sm text-gray-500 mb-4">
            Esta informacion afecta la categoria maxima permitida
          </p>

          {/* Trabaja en relacion de dependencia */}
          <div className="p-3 bg-gray-50 rounded-lg space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.trabajaRelacionDependencia || false}
                onChange={(e) => handleChange('trabajaRelacionDependencia', e.target.checked)}
                className="w-5 h-5 text-violet-600 border-gray-300 rounded"
              />
              <div>
                <span className="font-medium text-gray-900">Trabaja en relacion de dependencia</span>
                <p className="text-xs text-gray-500">Ademas de ser monotributista</p>
              </div>
            </label>

            {data.trabajaRelacionDependencia && (
              <div className="ml-8 space-y-3 pt-2 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">CUIT Empleador</label>
                    <input
                      type="text"
                      value={data.empleadorCuit || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 11)
                        handleChange('empleadorCuit', val)
                      }}
                      placeholder="Ej: 30123456789"
                      maxLength={11}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Sueldo Bruto</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        value={data.sueldoBruto || ''}
                        onChange={(e) => handleChange('sueldoBruto', parseFloat(e.target.value) || null)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Razon Social Empleador</label>
                  <input
                    type="text"
                    value={data.empleadorRazonSocial || ''}
                    onChange={(e) => handleChange('empleadorRazonSocial', e.target.value)}
                    placeholder="Nombre de la empresa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tiene empleados */}
          <div className="p-3 bg-gray-50 rounded-lg space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.tieneEmpleados || false}
                onChange={(e) => handleChange('tieneEmpleados', e.target.checked)}
                className="w-5 h-5 text-violet-600 border-gray-300 rounded"
              />
              <span className="font-medium text-gray-900">Tiene empleados</span>
            </label>

            {data.tieneEmpleados && (
              <div className="ml-8">
                <label className="block text-sm text-gray-600 mb-1">Cantidad</label>
                <input
                  type="number"
                  value={data.cantidadEmpleados || ''}
                  onChange={(e) => handleChange('cantidadEmpleados', parseInt(e.target.value) || 0)}
                  min="1"
                  max="3"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Maximo 3 para monotributo</p>
              </div>
            )}
          </div>

          {/* Tiene locales */}
          <div className="p-3 bg-gray-50 rounded-lg space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.tieneLocal || false}
                onChange={(e) => {
                  handleChange('tieneLocal', e.target.checked)
                  if (e.target.checked && (!data.locales || data.locales.length === 0)) {
                    handleChange('locales', [{ descripcion: '', alquiler: null, superficie: null, esPropio: false }])
                  }
                }}
                className="w-5 h-5 text-violet-600 border-gray-300 rounded"
              />
              <span className="font-medium text-gray-900">Tiene local/es comercial/es</span>
            </label>

            {data.tieneLocal && (
              <div className="space-y-3">
                {(data.locales || []).map((local, index) => (
                  <div key={index} className="p-3 bg-white border border-gray-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Local {index + 1}</span>
                      {(data.locales || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newLocales = [...(data.locales || [])]
                            newLocales.splice(index, 1)
                            handleChange('locales', newLocales)
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={local.descripcion || ''}
                        onChange={(e) => {
                          const newLocales = [...(data.locales || [])]
                          newLocales[index] = { ...newLocales[index], descripcion: e.target.value }
                          handleChange('locales', newLocales)
                        }}
                        placeholder="Descripcion (ej: Local Centro, Deposito)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Alquiler</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                          <input
                            type="number"
                            value={local.alquiler || ''}
                            onChange={(e) => {
                              const newLocales = [...(data.locales || [])]
                              newLocales[index] = { ...newLocales[index], alquiler: parseFloat(e.target.value) || null }
                              handleChange('locales', newLocales)
                            }}
                            className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">m2</label>
                        <input
                          type="number"
                          value={local.superficie || ''}
                          onChange={(e) => {
                            const newLocales = [...(data.locales || [])]
                            newLocales[index] = { ...newLocales[index], superficie: parseInt(e.target.value) || null }
                            handleChange('locales', newLocales)
                          }}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={local.esPropio || false}
                            onChange={(e) => {
                              const newLocales = [...(data.locales || [])]
                              newLocales[index] = { ...newLocales[index], esPropio: e.target.checked }
                              handleChange('locales', newLocales)
                            }}
                            className="w-4 h-4 text-violet-600 border-gray-300 rounded"
                          />
                          Propio
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Boton agregar local */}
                <button
                  type="button"
                  onClick={() => {
                    const newLocales = [...(data.locales || [])]
                    newLocales.push({ descripcion: '', alquiler: null, superficie: null, esPropio: false })
                    handleChange('locales', newLocales)
                  }}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-violet-400 hover:text-violet-600 flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar otro local
                </button>

                {/* Totales */}
                {(data.locales || []).length > 0 && (
                  <div className="pt-2 border-t border-gray-200 flex justify-between text-sm">
                    <span className="text-gray-600">
                      Total: {(data.locales || []).length} local{(data.locales || []).length > 1 ? 'es' : ''}
                    </span>
                    <div className="flex gap-4">
                      <span className="text-gray-900">
                        Alquiler: <strong>${((data.locales || []).reduce((sum, l) => sum + (l.alquiler || 0), 0)).toLocaleString()}</strong>
                      </span>
                      <span className="text-gray-900">
                        Superficie: <strong>{(data.locales || []).reduce((sum, l) => sum + (l.superficie || 0), 0)} m2</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Obra social */}
          <div className="p-3 bg-gray-50 rounded-lg space-y-4">
            <SelectorObraSocial
              value={data.obraSocial || ''}
              onChange={(value) => handleChange('obraSocial', value)}
              label="Obra social elegida"
            />

            {/* Tipo de cobertura */}
            {data.obraSocial && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de cobertura
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoCobertura"
                        checked={data.obraSocialTipoCobertura === 'titular' || !data.obraSocialTipoCobertura}
                        onChange={() => handleChange('obraSocialTipoCobertura', 'titular')}
                        className="w-4 h-4 text-violet-600"
                      />
                      <span className="text-sm">Solo titular</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoCobertura"
                        checked={data.obraSocialTipoCobertura === 'grupo_familiar'}
                        onChange={() => handleChange('obraSocialTipoCobertura', 'grupo_familiar')}
                        className="w-4 h-4 text-violet-600"
                      />
                      <span className="text-sm">Grupo familiar</span>
                    </label>
                  </div>
                </div>

                {/* Grupo familiar */}
                {data.obraSocialTipoCobertura === 'grupo_familiar' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Integrantes del grupo familiar
                    </label>

                    {(data.grupoFamiliar || []).map((integrante, index) => (
                      <div key={index} className="p-3 bg-white border border-gray-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Integrante {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newGrupo = [...(data.grupoFamiliar || [])]
                              newGrupo.splice(index, 1)
                              handleChange('grupoFamiliar', newGrupo)
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={integrante.nombre || ''}
                            onChange={(e) => {
                              const newGrupo = [...(data.grupoFamiliar || [])]
                              newGrupo[index] = { ...newGrupo[index], nombre: e.target.value }
                              handleChange('grupoFamiliar', newGrupo)
                            }}
                            placeholder="Nombre completo"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={integrante.dni || ''}
                            onChange={(e) => {
                              const newGrupo = [...(data.grupoFamiliar || [])]
                              newGrupo[index] = { ...newGrupo[index], dni: e.target.value.replace(/[^0-9]/g, '').slice(0, 8) }
                              handleChange('grupoFamiliar', newGrupo)
                            }}
                            placeholder="DNI"
                            maxLength={8}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                          />
                          <select
                            value={integrante.parentesco || ''}
                            onChange={(e) => {
                              const newGrupo = [...(data.grupoFamiliar || [])]
                              newGrupo[index] = { ...newGrupo[index], parentesco: e.target.value }
                              handleChange('grupoFamiliar', newGrupo)
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                          >
                            <option value="">Parentesco</option>
                            {PARENTESCOS.map(p => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newGrupo = [...(data.grupoFamiliar || [])]
                        newGrupo.push({ nombre: '', dni: '', parentesco: '' })
                        handleChange('grupoFamiliar', newGrupo)
                      }}
                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-violet-400 hover:text-violet-600 flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar integrante
                    </button>
                  </div>
                )}

                {/* Obra social adicional */}
                <div className="pt-3 border-t border-gray-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.obraSocialAdicional || false}
                      onChange={(e) => handleChange('obraSocialAdicional', e.target.checked)}
                      className="w-5 h-5 text-violet-600 border-gray-300 rounded"
                    />
                    <div>
                      <span className="font-medium text-gray-900 text-sm">Paga obra social adicional/superadora</span>
                      <p className="text-xs text-gray-500">Aparte de la incluida en el monotributo</p>
                    </div>
                  </label>

                  {data.obraSocialAdicional && (
                    <div className="mt-2 ml-8">
                      <input
                        type="text"
                        value={data.obraSocialAdicionalNombre || ''}
                        onChange={(e) => handleChange('obraSocialAdicionalNombre', e.target.value)}
                        placeholder="Nombre del plan adicional (ej: OSDE 310)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </SeccionColapsable>
      )}

      {/* SECCION 4: PAGO DEL MONOTRIBUTO (solo monotributistas) */}
      {isMonotributista && (
        <SeccionColapsable titulo="Pago del Monotributo" icono={CreditCard} iconColor="text-green-600" defaultOpen={false}>
          {/* Metodo de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿Como paga la cuota?
            </label>
            <div className="relative">
              <select
                value={data.metodoPagoMonotributo || ''}
                onChange={(e) => handleChange('metodoPagoMonotributo', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Seleccionar</option>
                {METODOS_PAGO.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* CBU si es debito automatico */}
          {data.metodoPagoMonotributo === 'debito_automatico' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CBU / Alias para debito
              </label>
              <input
                type="text"
                value={data.cbuDebito || ''}
                onChange={(e) => handleChange('cbuDebito', e.target.value)}
                placeholder="CBU o Alias"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 font-mono text-sm"
              />
            </div>
          )}

          {/* Estado de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado de pago
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ESTADOS_PAGO.map(estado => (
                <button
                  key={estado.value}
                  type="button"
                  onClick={() => handleChange('estadoPagoMonotributo', estado.value)}
                  className={`p-2 rounded-lg border-2 text-center text-sm transition-colors ${
                    data.estadoPagoMonotributo === estado.value
                      ? estado.color === 'green' ? 'border-green-500 bg-green-50 text-green-700'
                      : estado.color === 'yellow' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : estado.color === 'red' ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-500 bg-gray-50 text-gray-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {estado.label}
                </button>
              ))}
            </div>
          </div>
        </SeccionColapsable>
      )}

      {/* SECCION 5: ACCESOS ARCA (solo monotributistas) */}
      {isMonotributista && (
        <SeccionColapsable titulo="Accesos ARCA" icono={Shield} iconColor="text-purple-600" defaultOpen={false}>
          {/* Nivel clave fiscal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nivel de clave fiscal
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map(nivel => (
                <button
                  key={nivel}
                  type="button"
                  onClick={() => handleChange('nivelClaveFiscal', nivel)}
                  className={`w-12 h-12 rounded-lg border-2 font-bold transition-colors ${
                    data.nivelClaveFiscal === nivel
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {nivel}
                </button>
              ))}
            </div>
          </div>

          {/* Servicios delegados */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={data.serviciosDelegados || false}
                onChange={(e) => handleChange('serviciosDelegados', e.target.checked)}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded"
              />
              <div>
                <span className="font-medium text-gray-900">Servicios delegados</span>
                <p className="text-xs text-gray-500">El cliente te delego servicios en ARCA</p>
              </div>
            </label>

            {data.serviciosDelegados && (
              <div className="ml-8">
                <label className="block text-sm text-gray-600 mb-1">Fecha de delegacion</label>
                <input
                  type="date"
                  value={data.fechaDelegacion || ''}
                  onChange={(e) => handleChange('fechaDelegacion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            )}
          </div>

          {/* Factura electronica */}
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
            <input
              type="checkbox"
              checked={data.facturaElectronicaHabilitada || false}
              onChange={(e) => handleChange('facturaElectronicaHabilitada', e.target.checked)}
              className="w-5 h-5 text-purple-600 border-gray-300 rounded"
            />
            <div>
              <span className="font-medium text-gray-900">Factura electronica habilitada</span>
              <p className="text-xs text-gray-500">Ya puede emitir facturas electronicas</p>
            </div>
          </label>
        </SeccionColapsable>
      )}

      {/* SECCION 6: DOMICILIO */}
      <SeccionColapsable titulo="Domicilio Fiscal" icono={MapPin} iconColor="text-red-600" defaultOpen={false}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Direccion
          </label>
          <input
            type="text"
            value={data.domicilioFiscal || ''}
            onChange={(e) => handleChange('domicilioFiscal', e.target.value)}
            placeholder="Calle, numero, piso, depto"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localidad
            </label>
            <input
              type="text"
              value={data.localidad || ''}
              onChange={(e) => handleChange('localidad', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Codigo Postal
            </label>
            <input
              type="text"
              value={data.codigoPostal || ''}
              onChange={(e) => handleChange('codigoPostal', e.target.value)}
              maxLength={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provincia
            </label>
            <div className="relative">
              <select
                value={data.provincia || ''}
                onChange={(e) => handleChange('provincia', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Seleccionar</option>
                {PROVINCIAS.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </SeccionColapsable>

      {/* SECCION 7: INGRESOS BRUTOS */}
      <SeccionColapsable titulo="Ingresos Brutos" icono={FileText} iconColor="text-teal-600" defaultOpen={false}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Regimen
          </label>
          <div className="relative">
            <select
              value={data.regimenIibb || ''}
              onChange={(e) => {
                const newRegimen = e.target.value
                // Autocompletar numero IIBB con CUIT si es simplificado
                if (newRegimen === 'simplificado' && data.cuit) {
                  onChange({ ...data, regimenIibb: newRegimen, numeroIibb: data.cuit })
                } else {
                  handleChange('regimenIibb', newRegimen)
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Seleccionar</option>
              <option value="local">Local (Provincial)</option>
              <option value="simplificado">Simplificado</option>
              <option value="convenio_multilateral">Convenio Multilateral</option>
              <option value="exento">Exento</option>
              <option value="no_inscripto">No inscripto</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {data.regimenIibb && !['exento', 'no_inscripto'].includes(data.regimenIibb) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numero de inscripcion IIBB
            </label>
            <input
              type="text"
              value={data.numeroIibb || ''}
              onChange={(e) => handleChange('numeroIibb', e.target.value.replace(/[^0-9-]/g, '').slice(0, 30))}
              placeholder="Numero de inscripcion"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 font-mono"
            />
          </div>
        )}
      </SeccionColapsable>

      {/* SECCION 8: NOTAS INTERNAS */}
      <SeccionColapsable titulo="Notas Internas" icono={AlertTriangle} iconColor="text-yellow-600" defaultOpen={false}>
        <textarea
          value={data.notasInternasFiscales || ''}
          onChange={(e) => handleChange('notasInternasFiscales', e.target.value)}
          placeholder="Observaciones internas sobre la situacion fiscal del cliente..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 resize-none"
        />
        <p className="text-xs text-gray-400">Solo visible para la contadora</p>
      </SeccionColapsable>

      {/* ES ALTA DE CLIENTE */}
      {isMonotributista && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.esAltaCliente || false}
              onChange={(e) => handleChange('esAltaCliente', e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-900">Es un alta de cliente nuevo</span>
              <p className="text-sm text-gray-600 mt-1">
                Marca si recien se inscribe. Si viene de otro contador, deja desmarcado para cargar facturacion historica.
              </p>
            </div>
          </label>
        </div>
      )}
    </div>
  )
}

export default FiscalDataForm
