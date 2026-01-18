/**
 * Panel de consejos personalizados
 */

import { ArrowLeft, Lightbulb, AlertTriangle, TrendingUp, Info, CheckCircle, Flame } from 'lucide-react'
import { CONSEJO_COLORS, TIPO_CONSEJO } from '../utils/consejosLogic'

// Iconos por tipo
const ICONOS_TIPO = {
  [TIPO_CONSEJO.ALERTA]: AlertTriangle,
  [TIPO_CONSEJO.PELIGRO]: Flame,
  [TIPO_CONSEJO.EXITO]: CheckCircle,
  [TIPO_CONSEJO.INFO]: Info,
  [TIPO_CONSEJO.MOTIVACION]: Lightbulb
}

export default function PanelConsejos({ consejos, resumen, onVolver }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={onVolver}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-heading font-semibold text-gray-900">Consejos</h1>
        {consejos.length > 0 && (
          <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded-full">
            {consejos.length}
          </span>
        )}
      </div>

      <div className="px-4 py-6">
        {consejos.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
            <CheckCircle className="w-12 h-12 text-violet-500 mx-auto mb-3" />
            <div className="text-lg font-medium text-gray-900 mb-1">
              Todo en orden
            </div>
            <div className="text-gray-500 text-sm">
              No hay consejos por el momento. Segui asi!
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {consejos.map((consejo, index) => (
              <ConsejoCard key={index} consejo={consejo} />
            ))}
          </div>
        )}

        {/* Info adicional */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Sobre los consejos</div>
              <div className="text-blue-700">
                Los consejos se generan automaticamente basandose en tus gastos y patrones.
                Son sugerencias personalizadas para ayudarte a mejorar tus finanzas.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConsejoCard({ consejo }) {
  const colors = CONSEJO_COLORS[consejo.tipo] || CONSEJO_COLORS.info
  const Icono = ICONOS_TIPO[consejo.tipo] || Lightbulb

  return (
    <div className={`rounded-xl p-4 border ${colors.bg} ${colors.border}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${colors.bg}`}>
          <Icono className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div className="flex-1">
          <div className={`text-sm ${colors.text}`}>
            {consejo.mensaje}
          </div>
        </div>
      </div>
    </div>
  )
}
