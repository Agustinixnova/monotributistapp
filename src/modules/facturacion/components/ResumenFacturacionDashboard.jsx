import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { useFacturacionCliente } from '../hooks/useFacturacionCliente'
import { BarraProgresoTope } from './BarraProgresoTope'
import { formatearMoneda } from '../utils/formatters'
import { calcularEstadoAlerta } from '../utils/calculosFacturacion'

export function ResumenFacturacionDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    cliente,
    tope,
    acumulado,
    loading,
    error
  } = useFacturacionCliente(user?.id)

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (error || !cliente) {
    return null
  }

  const porcentaje = tope > 0 ? (acumulado?.neto || 0) / tope * 100 : 0
  const { estado: estadoAlerta } = calcularEstadoAlerta(porcentaje)
  const disponible = Math.max(0, tope - (acumulado?.neto || 0))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Tu facturacion
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium">
              Categoria {cliente.categoria_monotributo}
            </span>
            <span className="text-xs text-gray-500 capitalize">
              {cliente.tipo_actividad}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate('/facturacion')}
          className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 font-medium"
        >
          Ver detalle
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Cards de resumen compactas */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-violet-50 rounded-lg p-3">
          <div className="text-xs text-violet-600">Facturado (12 meses)</div>
          <div className="text-lg font-bold text-violet-700">
            {formatearMoneda(acumulado?.neto || 0)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Disponible</div>
          <div className="text-lg font-bold text-gray-900">
            {formatearMoneda(disponible)}
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <BarraProgresoTope
        facturado={acumulado?.neto || 0}
        tope={tope}
        porcentaje={porcentaje}
        estadoAlerta={estadoAlerta}
      />
    </div>
  )
}
