import { useState, useEffect } from 'react'
import { ChevronDown, Info } from 'lucide-react'
import { validateCUIT } from '../utils/validators'
import { formatCUIT } from '../utils/formatters'

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán'
]

const CATEGORIAS_MONOTRIBUTO = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']

/**
 * Formulario de datos fiscales
 * @param {string} roleName - Nombre del rol seleccionado (monotributista, responsable_inscripto)
 */
export function FiscalDataForm({ data, onChange, errors = {}, roleName }) {
  const [cuitFormatted, setCuitFormatted] = useState(data.cuit ? formatCUIT(data.cuit) : '')

  // Auto-establecer tipo de contribuyente según el rol
  useEffect(() => {
    if (roleName && !data.tipoContribuyente) {
      const tipoContribuyente = roleName === 'monotributista' ? 'monotributista' : 'responsable_inscripto'
      onChange({ ...data, tipoContribuyente })
    }
  }, [roleName])

  const handleCuitChange = (e) => {
    const value = e.target.value.replace(/[^0-9-]/g, '')
    setCuitFormatted(value)

    // Guardar sin guiones
    const cleanCuit = value.replace(/-/g, '')
    onChange({ ...data, cuit: cleanCuit })
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
    <div className="space-y-6">
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
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            errors.cuit ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.cuit && <p className="text-sm text-red-600 mt-1">{errors.cuit}</p>}
        {data.cuit && data.cuit.length === 11 && !validateCUIT(data.cuit) && (
          <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
            <Info className="w-4 h-4" />
            El CUIT ingresado no es válido
          </p>
        )}
      </div>

      {/* Razón Social */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Razón Social / Nombre de Fantasía
        </label>
        <input
          type="text"
          value={data.razonSocial || ''}
          onChange={(e) => handleChange('razonSocial', e.target.value)}
          placeholder="Ej: Juan Pérez o Mi Negocio"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tipo de Contribuyente - Solo lectura cuando viene del rol */}
      {roleName ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Contribuyente
          </label>
          <div className="p-3 rounded-lg border-2 border-blue-500 bg-blue-50 text-blue-700 text-center font-medium">
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
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
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
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              Resp. Inscripto
            </button>
          </div>
          {errors.tipoContribuyente && (
            <p className="text-sm text-red-600 mt-1">{errors.tipoContribuyente}</p>
          )}
        </div>
      )}

      {/* Categoría Monotributo (solo si es monotributista) */}
      {isMonotributista && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría Monotributo *
          </label>
          <div className="relative">
            <select
              value={data.categoriaMonotributo || ''}
              onChange={(e) => handleChange('categoriaMonotributo', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 ${
                errors.categoriaMonotributo ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar categoría</option>
              {CATEGORIAS_MONOTRIBUTO.map(cat => (
                <option key={cat} value={cat}>Categoría {cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          {errors.categoriaMonotributo && (
            <p className="text-sm text-red-600 mt-1">{errors.categoriaMonotributo}</p>
          )}
        </div>
      )}

      {/* Tipo de Actividad */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Actividad
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'servicios', label: 'Servicios' },
            { value: 'productos', label: 'Productos' },
            { value: 'ambos', label: 'Ambos' }
          ].map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('tipoActividad', option.value)}
              className={`p-2 text-sm rounded-lg border-2 transition-colors ${
                data.tipoActividad === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gestión de Facturación (solo para monotributistas) */}
      {isMonotributista && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿Quién gestiona la facturación?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChange('gestionFacturacion', 'autonomo')}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                data.gestionFacturacion === 'autonomo'
                  ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-900">El cliente factura solo</div>
              <div className="text-sm text-gray-500 mt-1">
                Carga su total facturado mensual en la app
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleChange('gestionFacturacion', 'contadora')}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                data.gestionFacturacion === 'contadora' || !data.gestionFacturacion
                  ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-900">La contadora le factura</div>
              <div className="text-sm text-gray-500 mt-1">
                Vos cargás la facturación por él
              </div>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Podés cambiar esto después desde la edición del cliente
          </p>
        </div>
      )}

      {/* Domicilio Fiscal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Domicilio Fiscal
        </label>
        <input
          type="text"
          value={data.domicilioFiscal || ''}
          onChange={(e) => handleChange('domicilioFiscal', e.target.value)}
          placeholder="Calle, número, piso, depto"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Localidad, CP y Provincia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Localidad
          </label>
          <input
            type="text"
            value={data.localidad || ''}
            onChange={(e) => handleChange('localidad', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código Postal
          </label>
          <input
            type="text"
            value={data.codigoPostal || ''}
            onChange={(e) => handleChange('codigoPostal', e.target.value)}
            maxLength={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500"
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

      {/* Régimen IIBB */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Régimen Ingresos Brutos
        </label>
        <div className="relative">
          <select
            value={data.regimenIibb || ''}
            onChange={(e) => handleChange('regimenIibb', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar</option>
            <option value="simplificado">Simplificado</option>
            <option value="general">Régimen General</option>
            <option value="convenio_multilateral">Convenio Multilateral</option>
            <option value="exento">Exento</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  )
}

export default FiscalDataForm
