import { useState } from 'react'
import { ChevronDown, ChevronUp, Edit2, Save, X, Check } from 'lucide-react'

/**
 * Componente generico para secciones editables inline en la ficha del cliente
 */
export function FichaSeccion({
  titulo,
  icono: Icon,
  iconColor = 'text-violet-600',
  defaultOpen = true,
  children,
  editable = false,
  editing = false,
  onEdit,
  onSave,
  onCancel,
  saving = false
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={() => !editing && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
          <h3 className="font-semibold text-gray-900">{titulo}</h3>
        </div>

        <div className="flex items-center gap-2">
          {editable && !editing && isOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.()
              }}
              className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {editing && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSave?.()
                }}
                disabled={saving}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                title="Guardar"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCancel?.()
                }}
                disabled={saving}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {!editing && (
            isOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )
          )}
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * Campo de la ficha - muestra valor o input segun modo edicion
 */
export function FichaCampo({
  label,
  value,
  editValue,
  onChange,
  editing = false,
  type = 'text',
  options = [],
  placeholder = '',
  readonly = false,
  className = ''
}) {
  const displayValue = value || '-'

  if (editing && !readonly) {
    if (type === 'select') {
      return (
        <div className={className}>
          <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
          <select
            value={editValue ?? value ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 bg-white"
          >
            <option value="">Seleccionar...</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )
    }

    if (type === 'textarea') {
      return (
        <div className={className}>
          <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
          <textarea
            value={editValue ?? value ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
          />
        </div>
      )
    }

    if (type === 'checkbox') {
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <input
            type="checkbox"
            checked={editValue ?? value ?? false}
            onChange={(e) => onChange?.(e.target.checked)}
            className="w-4 h-4 text-violet-600 border-gray-300 rounded"
          />
          <label className="text-sm text-gray-700">{label}</label>
        </div>
      )
    }

    return (
      <div className={className}>
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <input
          type={type}
          value={editValue ?? value ?? ''}
          onChange={(e) => onChange?.(type === 'number' ? parseFloat(e.target.value) || null : e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
        />
      </div>
    )
  }

  // Vista solo lectura
  return (
    <div className={className}>
      <span className="block text-xs font-medium text-gray-500">{label}</span>
      <span className="text-gray-900">
        {type === 'checkbox' ? (value ? 'Si' : 'No') : displayValue}
      </span>
    </div>
  )
}
