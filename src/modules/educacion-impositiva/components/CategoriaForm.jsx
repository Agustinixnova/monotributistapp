import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

// Iconos sugeridos para categorias
const ICONOS_DISPONIBLES = [
  'BookOpen', 'FileText', 'Calculator', 'Receipt', 'Wallet',
  'CreditCard', 'DollarSign', 'PiggyBank', 'TrendingUp', 'BarChart3',
  'Calendar', 'Clock', 'AlertCircle', 'CheckCircle', 'HelpCircle',
  'Lightbulb', 'Target', 'Award', 'Star', 'Bookmark'
]

// Colores disponibles
const COLORES_DISPONIBLES = [
  { id: 'violet', nombre: 'Violeta', clase: 'bg-violet-500' },
  { id: 'blue', nombre: 'Azul', clase: 'bg-blue-500' },
  { id: 'green', nombre: 'Verde', clase: 'bg-green-500' },
  { id: 'amber', nombre: 'Ambar', clase: 'bg-amber-500' },
  { id: 'red', nombre: 'Rojo', clase: 'bg-red-500' },
  { id: 'purple', nombre: 'Purpura', clase: 'bg-purple-500' },
  { id: 'pink', nombre: 'Rosa', clase: 'bg-pink-500' },
  { id: 'teal', nombre: 'Teal', clase: 'bg-teal-500' }
]

/**
 * Formulario para crear/editar categorias
 */
export function CategoriaForm({ categoria, onSave, onClose, guardando }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    icono: 'BookOpen',
    color: 'violet',
    orden: 0
  })
  const [errors, setErrors] = useState({})

  // Cargar datos si es edicion
  useEffect(() => {
    if (categoria) {
      setFormData({
        nombre: categoria.nombre || '',
        descripcion: categoria.descripcion || '',
        icono: categoria.icono || 'BookOpen',
        color: categoria.color || 'violet',
        orden: categoria.orden || 0
      })
    }
  }, [categoria])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSave(formData)
    }
  }

  const IconPreview = LucideIcons[formData.icono] || LucideIcons.BookOpen

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {categoria ? 'Editar categoria' : 'Nueva categoria'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${
                errors.nombre ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: Facturacion"
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
            )}
          </div>

          {/* Descripcion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripcion
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              placeholder="Breve descripcion de la categoria"
            />
          </div>

          {/* Icono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icono
            </label>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <IconPreview className="w-5 h-5 text-gray-700" />
              </div>
              <span className="text-sm text-gray-600">{formData.icono}</span>
            </div>
            <div className="grid grid-cols-10 gap-1">
              {ICONOS_DISPONIBLES.map((iconName) => {
                const Icon = LucideIcons[iconName]
                if (!Icon) return null
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => handleChange('icono', iconName)}
                    className={`p-2 rounded transition-colors ${
                      formData.icono === iconName
                        ? 'bg-violet-100 text-violet-700'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title={iconName}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORES_DISPONIBLES.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => handleChange('color', color.id)}
                  className={`w-8 h-8 rounded-full ${color.clase} transition-transform ${
                    formData.color === color.id
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  title={color.nombre}
                />
              ))}
            </div>
          </div>

          {/* Orden */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Orden
            </label>
            <input
              type="number"
              value={formData.orden}
              onChange={(e) => handleChange('orden', parseInt(e.target.value) || 0)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              min="0"
            />
            <p className="mt-1 text-xs text-gray-500">
              Menor numero = aparece primero
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {guardando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {categoria ? 'Guardar cambios' : 'Crear categoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
