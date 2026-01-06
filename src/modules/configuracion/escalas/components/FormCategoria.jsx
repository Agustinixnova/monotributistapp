import { useState } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'
import { CAMPOS_CATEGORIA, getCategoriaColor, validarCategoria, parseMoneda } from '../utils/escalasUtils'

/**
 * Modal para editar una categoria individual
 */
export function FormCategoria({ categoria, onClose, onSave }) {
  const [formData, setFormData] = useState(() => {
    const initial = {}
    Object.keys(CAMPOS_CATEGORIA).forEach(campo => {
      initial[campo] = categoria[campo] ?? ''
    })
    return initial
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleChange = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }))
    // Limpiar error del campo
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

    // Parsear valores monetarios
    const dataToSave = {}
    Object.entries(formData).forEach(([campo, valor]) => {
      if (CAMPOS_CATEGORIA[campo]?.tipo === 'moneda') {
        dataToSave[campo] = parseMoneda(valor)
      } else if (CAMPOS_CATEGORIA[campo]?.tipo === 'numero') {
        dataToSave[campo] = valor === '' ? null : parseFloat(valor)
      } else {
        dataToSave[campo] = valor
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg ${getCategoriaColor(categoria.categoria)}`}>
              {categoria.categoria}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Editar Categoria {categoria.categoria}</h2>
              <p className="text-sm text-gray-500">Modifica los valores de esta categoria</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(CAMPOS_CATEGORIA).map(([campo, config]) => (
              <div key={campo} className={campo === 'tope_facturacion_anual' ? 'sm:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {config.label}
                  {config.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="relative">
                  {config.tipo === 'moneda' && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  )}
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData[campo]}
                    onChange={(e) => handleChange(campo, e.target.value)}
                    placeholder={config.tipo === 'moneda' ? '0' : ''}
                    className={`w-full px-3 py-2.5 border rounded-lg transition-colors
                      ${config.tipo === 'moneda' ? 'pl-7' : ''}
                      ${errors[campo]
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:ring-violet-500 focus:border-violet-500'
                      }
                      focus:ring-2 focus:ring-offset-0
                    `}
                  />
                </div>
                {errors[campo] && (
                  <p className="mt-1 text-xs text-red-600">{errors[campo]}</p>
                )}
              </div>
            ))}
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
