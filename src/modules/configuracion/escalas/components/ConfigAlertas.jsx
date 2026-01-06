import { useState, useEffect } from 'react'
import { Save, AlertCircle, Bell, Percent, Calendar, CheckCircle, FileText } from 'lucide-react'
import { useAlertasConfig } from '../hooks/useAlertasConfig'

/**
 * Configuracion de umbrales de alertas globales
 */
export function ConfigAlertas({ canEdit }) {
  const { config, loading, error, saving, updateConfig } = useAlertasConfig()
  const [formData, setFormData] = useState(config)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setFormData(config)
  }, [config])

  const handleChange = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: parseInt(valor) || 0 }))
    setSuccess(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateConfig(formData)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving config:', err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Configuracion guardada correctamente
        </div>
      )}

      {/* Alerta de recategorizacion */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Percent className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Alerta de recategorizacion</h3>
            <p className="text-sm text-gray-500">
              Alertar cuando el cliente alcance este % del tope de su categoria actual
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="50"
            max="99"
            value={formData.alerta_recategorizacion_porcentaje || 80}
            onChange={(e) => handleChange('alerta_recategorizacion_porcentaje', e.target.value)}
            disabled={!canEdit}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="w-16 flex items-center justify-center">
            <input
              type="number"
              min="50"
              max="99"
              value={formData.alerta_recategorizacion_porcentaje || 80}
              onChange={(e) => handleChange('alerta_recategorizacion_porcentaje', e.target.value)}
              disabled={!canEdit}
              className="w-14 px-2 py-1 border border-gray-200 rounded-lg text-center font-semibold text-gray-900"
            />
            <span className="text-gray-500 ml-1">%</span>
          </div>
        </div>
      </div>

      {/* Alerta de exclusion */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <Percent className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Alerta de exclusion</h3>
            <p className="text-sm text-gray-500">
              Alertar cuando el cliente alcance este % del tope maximo (categoria K)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="70"
            max="99"
            value={formData.alerta_exclusion_porcentaje || 90}
            onChange={(e) => handleChange('alerta_exclusion_porcentaje', e.target.value)}
            disabled={!canEdit}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
          <div className="w-16 flex items-center justify-center">
            <input
              type="number"
              min="70"
              max="99"
              value={formData.alerta_exclusion_porcentaje || 90}
              onChange={(e) => handleChange('alerta_exclusion_porcentaje', e.target.value)}
              disabled={!canEdit}
              className="w-14 px-2 py-1 border border-gray-200 rounded-lg text-center font-semibold text-gray-900"
            />
            <span className="text-gray-500 ml-1">%</span>
          </div>
        </div>
      </div>

      {/* Dias anticipacion vencimiento cuota */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Recordatorio vencimiento cuota</h3>
            <p className="text-sm text-gray-500">
              Dias antes del dia 20 para enviar recordatorio de pago
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="15"
            value={formData.dias_alerta_vencimiento_cuota || 5}
            onChange={(e) => handleChange('dias_alerta_vencimiento_cuota', e.target.value)}
            disabled={!canEdit}
            className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center font-semibold text-gray-900"
          />
          <span className="text-gray-600">dias antes</span>
        </div>
      </div>

      {/* Dias anticipacion recategorizacion */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Alerta recategorizacion periodica</h3>
            <p className="text-sm text-gray-500">
              Dias antes del periodo de recategorizacion (enero/julio)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="5"
            max="30"
            value={formData.dias_alerta_recategorizacion || 15}
            onChange={(e) => handleChange('dias_alerta_recategorizacion', e.target.value)}
            disabled={!canEdit}
            className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center font-semibold text-gray-900"
          />
          <span className="text-gray-600">dias antes</span>
        </div>
      </div>

      {/* Alerta facturacion pendiente */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Facturacion pendiente</h3>
            <p className="text-sm text-gray-500">
              Dias antes de fin de mes para alertar si un cliente autonomo no cargo su facturacion
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="15"
            value={formData.dias_alerta_facturacion_pendiente || 5}
            onChange={(e) => handleChange('dias_alerta_facturacion_pendiente', e.target.value)}
            disabled={!canEdit}
            className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center font-semibold text-gray-900"
          />
          <span className="text-gray-600">dias antes de fin de mes</span>
        </div>
      </div>

      {/* Boton guardar */}
      {canEdit && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar configuracion
              </>
            )}
          </button>
        </div>
      )}
    </form>
  )
}

export default ConfigAlertas
