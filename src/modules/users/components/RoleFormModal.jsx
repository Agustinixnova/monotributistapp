import { useState, useEffect } from 'react'
import { X, Shield, Check, AlertCircle } from 'lucide-react'
import { useModules } from '../hooks/useModules'

/**
 * Modal para crear/editar roles con asignación de módulos
 */
export function RoleFormModal({ role, onSave, onClose, loading }) {
  const { modules, loading: loadingModules } = useModules()
  const isEditing = !!role

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    moduleIds: []
  })
  const [errors, setErrors] = useState({})

  // Cargar datos del rol si estamos editando
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        displayName: role.display_name || '',
        description: role.description || '',
        moduleIds: role.default_modules?.map(dm => dm.module_id) || []
      })
    }
  }, [role])

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

  const handleSelectAll = () => {
    setFormData(prev => ({
      ...prev,
      moduleIds: modules.map(m => m.id)
    }))
  }

  const handleDeselectAll = () => {
    setFormData(prev => ({
      ...prev,
      moduleIds: []
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
      await onSave(formData)
    } catch (err) {
      setErrors({ submit: err.message })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Editar Rol' : 'Nuevo Rol'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Datos básicos */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Información del Rol</h3>

              {/* Identificador (solo en creación) */}
              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Identificador único *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value.toLowerCase().replace(/[^a-z_]/g, ''))}
                    placeholder="ej: contador_junior"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                  <p className="text-xs text-gray-500 mt-1">Solo letras minúsculas y guiones bajos</p>
                </div>
              )}

              {/* Nombre para mostrar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre para mostrar *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                  placeholder="ej: Contador Junior"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                    errors.displayName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.displayName && <p className="text-sm text-red-600 mt-1">{errors.displayName}</p>}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descripción del rol..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>

            {/* Módulos por defecto */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Módulos por Defecto</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    Seleccionar todos
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Deseleccionar todos
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Seleccioná los módulos a los que tendrán acceso los usuarios con este rol por defecto.
              </p>

              {loadingModules ? (
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {modules.map(module => {
                    const isSelected = formData.moduleIds.includes(module.id)
                    return (
                      <button
                        key={module.id}
                        type="button"
                        onClick={() => handleModuleToggle(module.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm ${isSelected ? 'text-purple-700' : 'text-gray-900'}`}>
                            {module.name}
                          </div>
                          {module.description && (
                            <div className="text-xs text-gray-500 truncate">
                              {module.description}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              <p className="text-xs text-gray-400">
                {formData.moduleIds.length} de {modules.length} módulos seleccionados
              </p>
            </div>

            {/* Error general */}
            {errors.submit && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errors.submit}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {isEditing ? 'Guardar Cambios' : 'Crear Rol'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RoleFormModal
