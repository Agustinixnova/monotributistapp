import { useState, useEffect } from 'react'
import {
  Check, X, Clock, AlertCircle, CheckCircle, Loader2, Edit2, Trash2, Calendar
} from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import {
  getUltimos12Meses,
  actualizarEstadoCuota,
  eliminarCuota,
  getDeudaInicial,
  actualizarDeudaInicial
} from '../services/cuotasHistorialService'
import { formatearMoneda } from '../../facturacion/utils/formatters'

const ESTADOS = {
  sin_registro: {
    label: 'Sin registro',
    color: 'bg-gray-100 text-gray-600',
    icon: AlertCircle,
    iconColor: 'text-gray-400'
  },
  pendiente: {
    label: 'Pendiente',
    color: 'bg-amber-100 text-amber-700',
    icon: Clock,
    iconColor: 'text-amber-500'
  },
  informada: {
    label: 'Pagada',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
    iconColor: 'text-green-500'
  },
  verificada: {
    label: 'Verificada',
    color: 'bg-blue-100 text-blue-700',
    icon: CheckCircle,
    iconColor: 'text-blue-500'
  }
}

/**
 * Componente para gestionar el historial de pagos de cuotas
 */
export function FichaHistorialPagos({ clientId, categoriaActual, trabajaRelacionDependencia }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [meses, setMeses] = useState([])
  const [deudaInicial, setDeudaInicial] = useState(null)
  const [editandoMes, setEditandoMes] = useState(null)
  const [editandoDeuda, setEditandoDeuda] = useState(false)
  const [formDeuda, setFormDeuda] = useState({})

  useEffect(() => {
    fetchData()
  }, [clientId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [mesesData, deudaData] = await Promise.all([
        getUltimos12Meses(clientId),
        getDeudaInicial(clientId)
      ])
      setMeses(mesesData)
      setDeudaInicial(deudaData)
      setFormDeuda({
        cuotasAdeudadas: deudaData.cuotas_adeudadas_al_alta || 0,
        periodoDesde: deudaData.periodo_deuda_desde || '',
        periodoHasta: deudaData.periodo_deuda_hasta || '',
        notas: deudaData.notas_deuda_inicial || ''
      })
    } catch (err) {
      console.error('Error cargando historial:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarEstado = async (anio, mes, estado, montoCuota = null) => {
    try {
      setSaving(true)
      await actualizarEstadoCuota(clientId, anio, mes, estado, user.id, {
        montoCuota,
        fechaPago: new Date().toISOString().split('T')[0]
      })
      await fetchData()
      setEditandoMes(null)
    } catch (err) {
      console.error('Error actualizando cuota:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async (anio, mes) => {
    if (!confirm('¿Eliminar este registro de cuota?')) return

    try {
      setSaving(true)
      await eliminarCuota(clientId, anio, mes)
      await fetchData()
    } catch (err) {
      console.error('Error eliminando cuota:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleGuardarDeuda = async () => {
    try {
      setSaving(true)
      await actualizarDeudaInicial(clientId, formDeuda)
      await fetchData()
      setEditandoDeuda(false)
    } catch (err) {
      console.error('Error actualizando deuda inicial:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" />
        <p className="text-gray-500 text-sm mt-2">Cargando historial...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Información de deuda inicial */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-blue-900">Deuda al momento del alta</h4>
            <p className="text-sm text-blue-700">
              Fecha de alta: {deudaInicial?.fecha_alta_sistema
                ? new Date(deudaInicial.fecha_alta_sistema).toLocaleDateString('es-AR')
                : 'No registrada'}
            </p>
          </div>
          <button
            onClick={() => setEditandoDeuda(!editandoDeuda)}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        {editandoDeuda ? (
          <div className="space-y-3 mt-4 pt-4 border-t border-blue-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  Cuotas adeudadas
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={formDeuda.cuotasAdeudadas}
                  onChange={(e) => setFormDeuda({ ...formDeuda, cuotasAdeudadas: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  Desde (mes/año)
                </label>
                <input
                  type="month"
                  value={formDeuda.periodoDesde}
                  onChange={(e) => setFormDeuda({ ...formDeuda, periodoDesde: e.target.value + '-01' })}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  Hasta (mes/año)
                </label>
                <input
                  type="month"
                  value={formDeuda.periodoHasta}
                  onChange={(e) => setFormDeuda({ ...formDeuda, periodoHasta: e.target.value + '-01' })}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">
                Notas
              </label>
              <textarea
                value={formDeuda.notas}
                onChange={(e) => setFormDeuda({ ...formDeuda, notas: e.target.value })}
                placeholder="Ej: Cliente llegó debiendo Mayo-Diciembre 2025"
                rows="2"
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGuardarDeuda}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors text-sm font-medium"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => setEditandoDeuda(false)}
                className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {deudaInicial?.cuotas_adeudadas_al_alta > 0 ? (
              <>
                <p className="text-blue-900">
                  <span className="font-semibold">{deudaInicial.cuotas_adeudadas_al_alta}</span> cuota(s) adeudadas
                </p>
                {deudaInicial.periodo_deuda_desde && deudaInicial.periodo_deuda_hasta && (
                  <p className="text-sm text-blue-700">
                    Período: {new Date(deudaInicial.periodo_deuda_desde).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}
                    {' → '}
                    {new Date(deudaInicial.periodo_deuda_hasta).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}
                  </p>
                )}
                {deudaInicial.notas_deuda_inicial && (
                  <p className="text-sm text-blue-600 italic">{deudaInicial.notas_deuda_inicial}</p>
                )}
              </>
            ) : (
              <p className="text-blue-700">Sin deuda inicial registrada</p>
            )}
          </div>
        )}
      </div>

      {/* Listado de últimos 12 meses */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Últimos 12 meses</h4>
        <div className="space-y-2">
          {meses.map((m, index) => {
            const config = ESTADOS[m.estado]
            const Icon = config.icon
            const esEditable = editandoMes === `${m.anio}-${m.mes}`

            return (
              <div
                key={`${m.anio}-${m.mes}`}
                className={`border rounded-lg p-3 sm:p-4 transition-all ${
                  esEditable ? 'border-violet-300 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Info del mes */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className={`w-4 h-4 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 capitalize">{m.mesNombre}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`px-2 py-0.5 rounded ${config.color}`}>
                          {config.label}
                        </span>
                        {m.montoCuota && (
                          <span>{formatearMoneda(m.montoCuota)}</span>
                        )}
                        {m.fechaPago && (
                          <span>
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(m.fechaPago).toLocaleDateString('es-AR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1">
                    {!esEditable ? (
                      <>
                        {m.estado === 'sin_registro' && (
                          <>
                            <button
                              onClick={() => handleMarcarEstado(m.anio, m.mes, 'informada')}
                              disabled={saving}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Marcar pagada"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMarcarEstado(m.anio, m.mes, 'pendiente')}
                              disabled={saving}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Marcar pendiente"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {m.estado !== 'sin_registro' && (
                          <>
                            <button
                              onClick={() => setEditandoMes(`${m.anio}-${m.mes}`)}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEliminar(m.anio, m.mes)}
                              disabled={saving}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarcarEstado(m.anio, m.mes, 'informada')}
                          disabled={saving}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
                        >
                          Pagada
                        </button>
                        <button
                          onClick={() => handleMarcarEstado(m.anio, m.mes, 'verificada')}
                          disabled={saving}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium"
                        >
                          Verificada
                        </button>
                        <button
                          onClick={() => handleMarcarEstado(m.anio, m.mes, 'pendiente')}
                          disabled={saving}
                          className="px-3 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-xs font-medium"
                        >
                          Pendiente
                        </button>
                        <button
                          onClick={() => setEditandoMes(null)}
                          className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-medium"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ayuda */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-900 mb-2">💡 Cómo usar este historial:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Marca los meses como <span className="font-medium">Pagada</span> cuando el cliente informa el pago</li>
          <li>Marca como <span className="font-medium">Verificada</span> cuando confirmes el pago en AFIP</li>
          <li>Usa <span className="font-medium">Pendiente</span> para cuotas que sabes que están impagas</li>
          <li>La deuda inicial se ajusta automáticamente al pagar meses de ese período</li>
        </ul>
      </div>
    </div>
  )
}
