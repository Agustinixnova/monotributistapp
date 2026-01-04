import { useState, useEffect } from 'react'
import { X, Check, Info } from 'lucide-react'
import { useModules } from '../hooks/useModules'

/**
 * Formulario de rol (crear/editar)
 */
export function RoleForm({ role, onSubmit, onCancel, loading }) {
  const { modules } = useModules()
  const isEditing = !!role

  const [formData, setFormData] = useState({
    name: role?.name || '',
    displayName: role?.display_name || '',
    description: role?.description || '',
    moduleIds: role?.default_modules?.map(dm => dm.module_id) || []
  })

  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleModuleToggle = (moduleId) => {
    setFormData(prev => ({
      ...prev,
      moduleIds: prev.moduleIds.includes(moduleId)
        ? prev.moduleIds.filter(id => id !== moduleId)
        : [...prev.moduleIds, moduleId]
    }))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'El nombre es requerido'
    }

    if (!isEditing && !formData.name.trim()) {
      newErrors.name = 'El identificador es requerido'
    }

    if (!isEditing && formData.name && !/^[a-z_]+$/.test(formData.name)) {
      newErrors.name = 'Solo letras minúsculas y guiones bajos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    try {
      await onSubmit(formData)
    } catch (err) {
      setErrors({ submit: err.message })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Editar Rol' : 'Nuevo Rol'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Nombre para mostrar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del rol *
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              placeholder="Ej: Contador Junior"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.displayName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.displayName && (
              <p className="text-sm text-red-600 mt-1">{errors.displayName}</p>
            )}
          </div>

          {/* Identificador (solo nuevo) */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identificador único *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value.toLowerCase().replace(/[^a-z_]/g, ''))}
                placeholder="Ej: contador_junior"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name ? (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Solo letras minúsculas y guiones bajos. No se puede cambiar después.
                </p>
              )}
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              placeholder="Describe las responsabilidades de este rol..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Módulos por defecto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Módulos por defecto
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Los usuarios con este rol tendrán acceso automático a estos módulos.
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {modules.map(module => {
                const isSelected = formData.moduleIds.includes(module.id)
                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => handleModuleToggle(module.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-sm transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="truncate">{module.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error general */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {errors.submit}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {isEditing ? 'Guardar' : 'Crear Rol'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RoleForm
