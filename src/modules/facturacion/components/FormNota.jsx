import { useState } from 'react'
import { AlertTriangle, FileText, Calendar, StickyNote } from 'lucide-react'

const TIPOS = [
  { value: 'general', label: 'General', icon: StickyNote, color: 'yellow' },
  { value: 'urgente', label: 'Urgente', icon: AlertTriangle, color: 'red' },
  { value: 'facturacion', label: 'Facturacion', icon: FileText, color: 'blue' },
  { value: 'recordatorio', label: 'Recordatorio', icon: Calendar, color: 'purple' }
]

export function FormNota({ onSave, onCancel, notaInicial = null }) {
  const [tipo, setTipo] = useState(notaInicial?.tipo || 'general')
  const [contenido, setContenido] = useState(notaInicial?.contenido || '')
  const [fechaRecordatorio, setFechaRecordatorio] = useState(
    notaInicial?.fecha_recordatorio || ''
  )
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!contenido.trim()) return

    setSaving(true)
    try {
      await onSave({
        tipo,
        contenido: contenido.trim(),
        fechaRecordatorio: tipo === 'recordatorio' ? fechaRecordatorio : null
      })
    } finally {
      setSaving(false)
    }
  }

  const getButtonColor = (tipoBtn, isActive) => {
    if (!isActive) return 'border-gray-200 text-gray-600 hover:border-gray-300'

    const colors = {
      general: 'border-yellow-500 bg-yellow-50 text-yellow-700',
      urgente: 'border-red-500 bg-red-50 text-red-700',
      facturacion: 'border-blue-500 bg-blue-50 text-blue-700',
      recordatorio: 'border-purple-500 bg-purple-50 text-purple-700'
    }
    return colors[tipoBtn]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Selector de tipo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de nota
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TIPOS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTipo(t.value)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                  getButtonColor(t.value, tipo === t.value)
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenido */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nota
        </label>
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          placeholder="Escribi tu nota..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
          autoFocus
        />
      </div>

      {/* Fecha recordatorio (solo si tipo es recordatorio) */}
      {tipo === 'recordatorio' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha del recordatorio
          </label>
          <input
            type="date"
            value={fechaRecordatorio}
            onChange={(e) => setFechaRecordatorio(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
          />
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!contenido.trim() || saving}
          className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 text-sm transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
