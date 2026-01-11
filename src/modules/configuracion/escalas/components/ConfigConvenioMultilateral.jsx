import { useState, useEffect } from 'react'
import { Save, Loader2, AlertCircle, Calendar, Info } from 'lucide-react'
import { supabase } from '../../../../lib/supabase'

/**
 * Componente para configurar vencimientos de Convenio Multilateral
 */
export function ConfigConvenioMultilateral({ canEdit }) {
  const [vencimientos, setVencimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [editedValues, setEditedValues] = useState({})

  useEffect(() => {
    fetchVencimientos()
  }, [])

  const fetchVencimientos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('convenio_multilateral_vencimientos')
        .select('*')
        .is('vigente_hasta', null)
        .order('orden')

      if (error) throw error
      setVencimientos(data || [])

      // Inicializar valores editados
      const initial = {}
      data?.forEach(v => {
        initial[v.id] = v.dia_vencimiento
      })
      setEditedValues(initial)
    } catch (err) {
      console.error('Error fetching vencimientos:', err)
      setError('Error al cargar los vencimientos')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (id, value) => {
    const numValue = parseInt(value)
    if (numValue >= 1 && numValue <= 28) {
      setEditedValues(prev => ({ ...prev, [id]: numValue }))
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      // Actualizar cada vencimiento que cambio
      for (const venc of vencimientos) {
        const newValue = editedValues[venc.id]
        if (newValue !== venc.dia_vencimiento) {
          const { error } = await supabase
            .from('convenio_multilateral_vencimientos')
            .update({ dia_vencimiento: newValue })
            .eq('id', venc.id)

          if (error) throw error
        }
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      fetchVencimientos() // Recargar
    } catch (err) {
      console.error('Error saving:', err)
      setError('Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = vencimientos.some(v => editedValues[v.id] !== v.dia_vencimiento)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Vencimientos Convenio Multilateral</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configura los dias de vencimiento mensual de IIBB segun el ultimo digito del CUIT
        </p>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <h4 className="font-medium">Como funciona</h4>
            <p className="mt-1">
              Los contribuyentes en Convenio Multilateral tienen vencimientos mensuales de IIBB
              que varian segun el ultimo digito de su CUIT. Estos valores se usan para calcular
              las alertas de vencimiento en el calendario fiscal de cada cliente.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          Cambios guardados correctamente
        </div>
      )}

      {/* Tabla de vencimientos */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                Ultimo digito CUIT
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                Dia de vencimiento
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                Ejemplo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vencimientos.map((venc) => (
              <tr key={venc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-violet-600">
                      {venc.digitos_cuit}
                    </span>
                    <span className="text-sm text-gray-500">
                      (CUIT termina en {venc.digitos_cuit.split('-').join(' o ')})
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {canEdit ? (
                      <input
                        type="number"
                        min="1"
                        max="28"
                        value={editedValues[venc.id] || venc.dia_vencimiento}
                        onChange={(e) => handleChange(venc.id, e.target.value)}
                        className="w-20 px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-violet-500 focus:border-violet-500 font-semibold"
                      />
                    ) : (
                      <span className="font-medium">{venc.dia_vencimiento}</span>
                    )}
                    <span className="text-sm text-gray-500">de cada mes</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  CUIT 20-12345678-{venc.digitos_cuit.split('-')[0]} vence el {editedValues[venc.id] || venc.dia_vencimiento}/01
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Boton guardar */}
      {canEdit && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              hasChanges
                ? 'bg-violet-600 text-white hover:bg-violet-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      )}

      {/* Nota */}
      <p className="text-xs text-gray-400">
        Los vencimientos pueden variar segun el calendario fiscal de cada ano.
        Actualizalos cuando ARBA o el organismo correspondiente publique nuevas fechas.
      </p>
    </div>
  )
}

export default ConfigConvenioMultilateral
