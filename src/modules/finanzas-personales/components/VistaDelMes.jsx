/**
 * Vista del resumen mensual
 * Muestra grafico, categorias, lista de gastos
 */

import { useState } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, DollarSign, PiggyBank, MessageCircle } from 'lucide-react'
import { formatearMonto, getNombreMesActual } from '../utils/formatters'
import { getCategoriaIcono } from '../utils/categoriasConfig'
import GraficoDonut from './GraficoDonut'
import ListaGastos from './ListaGastos'
import TopCategorias from './TopCategorias'
import ModalEditarGasto from './ModalEditarGasto'

export default function VistaDelMes({ resumen, onVolver }) {
  const [vistaActiva, setVistaActiva] = useState('resumen') // resumen, gastos
  const [gastoEditando, setGastoEditando] = useState(null)

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
        <h1 className="text-lg font-heading font-semibold text-gray-900">
          {getNombreMesActual()}
        </h1>
      </div>

      {/* Tabs */}
      <div className="bg-white px-4 py-2 border-b border-gray-200 flex gap-2">
        <button
          onClick={() => setVistaActiva('resumen')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            vistaActiva === 'resumen'
              ? 'bg-violet-100 text-violet-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => setVistaActiva('gastos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            vistaActiva === 'gastos'
              ? 'bg-violet-100 text-violet-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Lista de gastos
        </button>
      </div>

      {resumen.loading ? (
        <div className="px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-gray-200 rounded-xl" />
            <div className="h-20 bg-gray-200 rounded-xl" />
            <div className="h-32 bg-gray-200 rounded-xl" />
          </div>
        </div>
      ) : vistaActiva === 'resumen' ? (
        <div className="px-4 py-6 space-y-6">
          {/* Cards de resumen */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total gastado */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs">Total gastado</span>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {formatearMonto(resumen.totalMesActual)}
              </div>
            </div>

            {/* Variacion */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                {resumen.variacionTotal?.porcentaje >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-xs">vs mes anterior</span>
              </div>
              <div className={`text-xl font-bold ${
                resumen.variacionTotal?.porcentaje >= 0 ? 'text-red-600' : 'text-violet-600'
              }`}>
                {resumen.variacionTotal?.porcentaje >= 0 ? '+' : ''}
                {resumen.variacionTotal?.porcentaje?.toFixed(0) || 0}%
              </div>
            </div>

            {/* Dias restantes */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Dias restantes</span>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {resumen.diasRestantes}
              </div>
            </div>

            {/* Ahorro */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <PiggyBank className="w-4 h-4" />
                <span className="text-xs">
                  {resumen.ahorro?.monto >= 0 ? 'Ahorro' : 'Deficit'}
                </span>
              </div>
              {resumen.ahorro ? (
                <div className={`text-xl font-bold ${
                  resumen.ahorro.monto >= 0 ? 'text-violet-600' : 'text-red-600'
                }`}>
                  {formatearMonto(Math.abs(resumen.ahorro.monto))}
                </div>
              ) : (
                <div className="text-sm text-gray-400">Sin ingresos</div>
              )}
            </div>
          </div>

          {/* Mensaje comparativo inteligente */}
          {resumen.variacionCategorias?.mayorAumento && resumen.totalMesAnterior > 0 && (
            <MensajeComparativo variacion={resumen.variacionCategorias} />
          )}

          {/* Grafico donut */}
          {resumen.categorias?.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Distribucion por categoria</h3>
              <GraficoDonut categorias={resumen.categorias} total={resumen.totalMesActual} />
            </div>
          )}

          {/* Top categorias */}
          {resumen.topCategorias?.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Top categorias</h3>
              <TopCategorias categorias={resumen.topCategorias} />
            </div>
          )}

          {/* Por metodo de pago */}
          {resumen.porMetodoPago?.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Por metodo de pago</h3>
              <div className="space-y-3">
                {resumen.porMetodoPago.map(mp => (
                  <div key={mp.metodo} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-sm text-gray-700 capitalize">{mp.metodo}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatearMonto(mp.total)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sin gastos */}
          {resumen.cantidadGastos === 0 && (
            <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <div className="text-gray-500">No hay gastos registrados este mes</div>
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 py-4">
          <ListaGastos
            gastos={resumen.gastos || []}
            onEditarGasto={setGastoEditando}
          />
        </div>
      )}

      {/* Modal editar gasto */}
      {gastoEditando && (
        <ModalEditarGasto
          gasto={gastoEditando}
          onClose={() => setGastoEditando(null)}
          onGuardado={() => {
            resumen.recargar()
            setGastoEditando(null)
          }}
        />
      )}
    </div>
  )
}

/**
 * Componente de mensaje comparativo inteligente
 */
function MensajeComparativo({ variacion }) {
  const { mayorAumento, mayorReduccion } = variacion

  // Si hay aumento significativo, mostrar alerta
  if (mayorAumento && mayorAumento.porcentajeCambio > 10) {
    const IconComponent = getCategoriaIcono(mayorAumento.nombre)
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="bg-amber-100 rounded-full p-2 flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-amber-900 mb-1">
              Atencion con {mayorAumento.nombre}
            </div>
            <div className="text-sm text-amber-700">
              Gastaste <span className="font-semibold">{mayorAumento.porcentajeCambio}% mas</span> en esta categoria que el mes pasado
              {mayorAumento.diferencia > 0 && (
                <span className="text-amber-600"> (+{formatearMonto(mayorAumento.diferencia)})</span>
              )}
            </div>
          </div>
          <div className="bg-amber-100 rounded-full p-2 flex-shrink-0">
            <IconComponent className="w-4 h-4 text-amber-600" />
          </div>
        </div>
      </div>
    )
  }

  // Si hay reduccion significativa, mostrar mensaje positivo
  if (mayorReduccion && mayorReduccion.porcentajeCambio < -10) {
    const IconComponent = getCategoriaIcono(mayorReduccion.nombre)
    return (
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="bg-violet-100 rounded-full p-2 flex-shrink-0">
            <TrendingDown className="w-4 h-4 text-violet-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-violet-900 mb-1">
              Bien ahi con {mayorReduccion.nombre}!
            </div>
            <div className="text-sm text-violet-700">
              Gastaste <span className="font-semibold">{Math.abs(mayorReduccion.porcentajeCambio)}% menos</span> en esta categoria que el mes pasado
              <span className="text-violet-600"> ({formatearMonto(Math.abs(mayorReduccion.diferencia))} menos)</span>
            </div>
          </div>
          <div className="bg-violet-100 rounded-full p-2 flex-shrink-0">
            <IconComponent className="w-4 h-4 text-violet-600" />
          </div>
        </div>
      </div>
    )
  }

  return null
}
