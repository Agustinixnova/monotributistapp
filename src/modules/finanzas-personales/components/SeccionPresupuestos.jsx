/**
 * Seccion de presupuestos por categoria con barras de progreso
 */

import { useState } from 'react'
import { ArrowLeft, Target, Plus, AlertTriangle, CheckCircle, Edit2, Trash2, Copy } from 'lucide-react'
import { useCategorias } from '../hooks/useCategorias'
import { usePresupuestos } from '../hooks/usePresupuestos'
import { getCategoriaColor, getCategoriaIcono } from '../utils/categoriasConfig'
import { formatearMonto } from '../utils/formatters'
import { calcularUsoPresupuesto } from '../utils/calculosFinanzas'

export default function SeccionPresupuestos({ gastosPorCategoria, onVolver }) {
  const { categorias } = useCategorias()
  const { presupuestos, loading, guardar, eliminar, copiarMesAnterior } = usePresupuestos()
  const [editando, setEditando] = useState(null) // categoria_id que se esta editando
  const [montoEditando, setMontoEditando] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [copiando, setCopiando] = useState(false)

  // Crear mapa de gastos por categoria para busqueda rapida
  const gastosMap = {}
  gastosPorCategoria?.forEach(cat => {
    gastosMap[cat.categoria_id] = cat.total
  })

  // Crear mapa de presupuestos
  const presupuestosMap = {}
  presupuestos.forEach(p => {
    presupuestosMap[p.categoria_id] = p
  })

  // Iniciar edicion
  const iniciarEdicion = (categoriaId) => {
    const presupuesto = presupuestosMap[categoriaId]
    setEditando(categoriaId)
    setMontoEditando(presupuesto?.monto_limite?.toString() || '')
  }

  // Guardar presupuesto
  const handleGuardar = async (categoriaId) => {
    const monto = parseFloat(montoEditando)
    if (!monto || monto <= 0) {
      setEditando(null)
      return
    }

    setGuardando(true)
    try {
      await guardar(categoriaId, monto)
      setEditando(null)
      setMontoEditando('')
    } catch (err) {
      console.error('Error guardando presupuesto:', err)
    } finally {
      setGuardando(false)
    }
  }

  // Eliminar presupuesto
  const handleEliminar = async (presupuestoId) => {
    try {
      await eliminar(presupuestoId)
    } catch (err) {
      console.error('Error eliminando presupuesto:', err)
    }
  }

  // Copiar del mes anterior
  const handleCopiarMesAnterior = async () => {
    setCopiando(true)
    try {
      const copiados = await copiarMesAnterior()
      if (copiados.length === 0) {
        alert('No hay presupuestos del mes anterior para copiar')
      }
    } catch (err) {
      console.error('Error copiando presupuestos:', err)
    } finally {
      setCopiando(false)
    }
  }

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
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-violet-600" />
          <h1 className="text-lg font-heading font-semibold text-gray-900">Presupuestos</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            Definí un límite de gasto para cada categoría y te avisamos cuando estés llegando al 80%.
          </p>
        </div>

        {/* Boton copiar mes anterior */}
        {presupuestos.length === 0 && (
          <button
            onClick={handleCopiarMesAnterior}
            disabled={copiando}
            className="w-full bg-white border border-gray-200 hover:bg-gray-50 rounded-xl p-4 flex items-center justify-center gap-2 text-gray-700 transition-colors"
          >
            <Copy className="w-5 h-5" />
            {copiando ? 'Copiando...' : 'Copiar presupuestos del mes anterior'}
          </button>
        )}

        {/* Lista de categorias con presupuestos */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-xl p-4 h-24" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {categorias.map(categoria => {
              const presupuesto = presupuestosMap[categoria.id]
              const gastado = gastosMap[categoria.id] || 0
              const limite = presupuesto?.monto_limite || 0
              const uso = calcularUsoPresupuesto(gastado, limite)
              const colors = getCategoriaColor(categoria.color)
              const IconComponent = getCategoriaIcono(categoria.nombre)
              const estaEditando = editando === categoria.id

              return (
                <div
                  key={categoria.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  {/* Header categoria */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.bg}`}>
                        <IconComponent className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{categoria.nombre}</div>
                        <div className="text-sm text-gray-500">
                          {categoria.nombre === 'Ahorro' ? 'Invertido' : 'Gastado'}: {formatearMonto(gastado)}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    {!estaEditando && (
                      <button
                        onClick={() => iniciarEdicion(categoria.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {presupuesto ? (
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Plus className="w-4 h-4 text-violet-600" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Modo edicion */}
                  {estaEditando ? (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={montoEditando}
                          onChange={(e) => setMontoEditando(e.target.value)}
                          placeholder="Límite mensual"
                          autoFocus
                          className="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        />
                      </div>
                      <button
                        onClick={() => handleGuardar(categoria.id)}
                        disabled={guardando}
                        className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:bg-violet-400"
                      >
                        {guardando ? '...' : 'OK'}
                      </button>
                      <button
                        onClick={() => setEditando(null)}
                        className="px-3 py-2 text-gray-500 text-sm hover:bg-gray-100 rounded-lg"
                      >
                        ✕
                      </button>
                    </div>
                  ) : presupuesto ? (
                    <>
                      {/* Barra de progreso */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">
                            {formatearMonto(gastado)} de {formatearMonto(limite)}
                          </span>
                          <span className={`font-medium ${
                            uso.estado === 'excedido' ? 'text-red-600' :
                            uso.estado === 'alerta' ? 'text-amber-600' :
                            'text-violet-600'
                          }`}>
                            {uso.porcentaje}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              uso.estado === 'excedido' ? 'bg-red-500' :
                              uso.estado === 'alerta' ? 'bg-amber-500' :
                              'bg-violet-500'
                            }`}
                            style={{ width: `${Math.min(uso.porcentaje, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Mensaje de estado */}
                      {uso.estado === 'excedido' && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Excediste el presupuesto por {formatearMonto(Math.abs(uso.restante))}</span>
                        </div>
                      )}
                      {uso.estado === 'alerta' && (
                        <div className="flex items-center gap-2 text-amber-600 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Cuidado! Te queda {formatearMonto(uso.restante)}</span>
                        </div>
                      )}
                      {uso.estado === 'ok' && uso.restante > 0 && (
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <CheckCircle className="w-4 h-4 text-violet-500" />
                          <span>Disponible: {formatearMonto(uso.restante)}</span>
                        </div>
                      )}

                      {/* Boton eliminar */}
                      <button
                        onClick={() => handleEliminar(presupuesto.id)}
                        className="mt-2 text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Quitar límite
                      </button>
                    </>
                  ) : (
                    <div className="text-sm text-gray-400">
                      Sin presupuesto definido
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
