import { useState, useEffect, useMemo } from 'react'
import { X, Save, AlertCircle, Info, Calculator } from 'lucide-react'
import {
  CAMPOS_CATEGORIA,
  getCategoriaColor,
  validarCategoria,
  parseMoneda,
  formatMonedaCompacta,
  esSoloProductos,
  calcularTotalServicios,
  calcularTotalProductos
} from '../utils/escalasUtils'

/**
 * Modal para editar una categoria individual
 * Organizado en secciones: Limites, Impuesto Integrado, Aportes, Totales
 */
export function FormCategoria({ categoria, onClose, onSave }) {
  const soloProductos = esSoloProductos(categoria.categoria)

  const [formData, setFormData] = useState(() => {
    const initial = {}
    Object.keys(CAMPOS_CATEGORIA).forEach(campo => {
      initial[campo] = categoria[campo] ?? ''
    })
    return initial
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Calcular totales automaticamente
  const totalesCalculados = useMemo(() => {
    const impServ = parseMoneda(formData.impuesto_integrado_servicios) || 0
    const impProd = parseMoneda(formData.impuesto_integrado_productos) || 0
    const sipa = parseMoneda(formData.aporte_sipa) || 0
    const obraSocial = parseMoneda(formData.aporte_obra_social) || 0

    return {
      cuota_total_servicios: calcularTotalServicios(impServ, sipa, obraSocial),
      cuota_total_productos: calcularTotalProductos(impProd, sipa, obraSocial)
    }
  }, [
    formData.impuesto_integrado_servicios,
    formData.impuesto_integrado_productos,
    formData.aporte_sipa,
    formData.aporte_obra_social
  ])

  // Actualizar formData con totales calculados
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      cuota_total_servicios: totalesCalculados.cuota_total_servicios,
      cuota_total_productos: totalesCalculados.cuota_total_productos
    }))
  }, [totalesCalculados])

  const handleChange = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }))
    if (errors[campo]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[campo]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar
    const validation = validarCategoria(formData)
    if (!validation.isValid) {
      setErrors(validation.errores)
      return
    }

    // Parsear valores monetarios y numericos
    const dataToSave = {}
    Object.entries(formData).forEach(([campo, valor]) => {
      const config = CAMPOS_CATEGORIA[campo]
      if (!config) return

      if (config.calculado) {
        // Usar valores calculados
        dataToSave[campo] = totalesCalculados[campo]
      } else if (config.tipo === 'moneda') {
        dataToSave[campo] = parseMoneda(valor)
      } else if (config.tipo === 'superficie' || config.tipo === 'energia') {
        dataToSave[campo] = valor === '' ? null : parseFloat(valor)
      } else {
        dataToSave[campo] = valor === '' ? null : parseFloat(valor)
      }
    })

    try {
      setSaving(true)
      await onSave(dataToSave)
    } catch (err) {
      setErrors({ general: err.message })
    } finally {
      setSaving(false)
    }
  }

  // Agrupar campos por seccion
  const camposPorSeccion = useMemo(() => {
    const secciones = {
      limites: { titulo: 'Limites de la Categoria', campos: [] },
      impuesto: { titulo: 'Impuesto Integrado', campos: [] },
      aportes: { titulo: 'Aportes', campos: [] },
      totales: { titulo: 'Totales (Calculados)', campos: [] }
    }

    Object.entries(CAMPOS_CATEGORIA).forEach(([campo, config]) => {
      if (secciones[config.seccion]) {
        secciones[config.seccion].campos.push({ campo, config })
      }
    })

    return secciones
  }, [])

  const renderInput = (campo, config) => {
    const isCalculado = config.calculado
    const value = isCalculado ? totalesCalculados[campo] : formData[campo]

    return (
      <div key={campo}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {config.labelCorto || config.label}
          {config.required && !isCalculado && <span className="text-red-500 ml-1">*</span>}
          {config.unidad && <span className="text-gray-400 ml-1">({config.unidad})</span>}
        </label>
        <div className="relative">
          {config.tipo === 'moneda' && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          )}
          <input
            type="text"
            inputMode="numeric"
            value={isCalculado ? formatMonedaCompacta(value).replace('$', '').trim() : value}
            onChange={(e) => handleChange(campo, e.target.value)}
            disabled={isCalculado}
            placeholder={config.tipo === 'moneda' ? '0' : ''}
            className={`w-full px-3 py-2.5 border rounded-lg transition-colors
              ${config.tipo === 'moneda' ? 'pl-7' : ''}
              ${isCalculado
                ? 'bg-gray-100 text-gray-600 cursor-not-allowed border-gray-200'
                : errors[campo]
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-violet-500 focus:border-violet-500'
              }
              focus:ring-2 focus:ring-offset-0
            `}
          />
          {isCalculado && (
            <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          )}
        </div>
        {errors[campo] && (
          <p className="mt-1 text-xs text-red-600">{errors[campo]}</p>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg ${getCategoriaColor(categoria.categoria)}`}>
              {categoria.categoria}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Editar Categoria {categoria.categoria}</h2>
              <p className="text-sm text-gray-500">
                {soloProductos ? 'Solo venta de productos' : 'Servicios y productos'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.general}
            </div>
          )}

          {soloProductos && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-700 text-sm">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Esta categoria es exclusiva para venta de productos. Los valores de servicios no aplican.</span>
            </div>
          )}

          {/* Seccion: Limites */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">
              {camposPorSeccion.limites.titulo}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {camposPorSeccion.limites.campos.map(({ campo, config }) => {
                // Tope facturacion ocupa todo el ancho
                if (campo === 'tope_facturacion_anual') {
                  return (
                    <div key={campo} className="sm:col-span-2">
                      {renderInput(campo, config)}
                    </div>
                  )
                }
                return renderInput(campo, config)
              })}
            </div>
          </div>

          {/* Seccion: Impuesto Integrado */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">
              {camposPorSeccion.impuesto.titulo}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {camposPorSeccion.impuesto.campos.map(({ campo, config }) => (
                renderInput(campo, config)
              ))}
            </div>
          </div>

          {/* Seccion: Aportes */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">
              {camposPorSeccion.aportes.titulo}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {camposPorSeccion.aportes.campos.map(({ campo, config }) => (
                renderInput(campo, config)
              ))}
            </div>
          </div>

          {/* Seccion: Totales */}
          <div className="space-y-4 bg-violet-50 -mx-6 px-6 py-4 border-y border-violet-200">
            <h3 className="text-sm font-semibold text-violet-700 uppercase tracking-wide flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              {camposPorSeccion.totales.titulo}
            </h3>
            <p className="text-xs text-violet-600">
              Imp. Integrado + SIPA + Obra Social = Cuota Total
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {camposPorSeccion.totales.campos.map(({ campo, config }) => (
                <div key={campo}>
                  <label className="block text-sm font-medium text-violet-700 mb-1">
                    {config.labelCorto || config.label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-500">$</span>
                    <input
                      type="text"
                      value={formatMonedaCompacta(totalesCalculados[campo]).replace('$', '').trim()}
                      disabled
                      className="w-full pl-7 px-3 py-2.5 border border-violet-300 rounded-lg bg-white text-violet-700 font-semibold cursor-not-allowed"
                    />
                    <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FormCategoria
