/**
 * Pagina principal de Mis Finanzas
 * Acciones: Registrar gasto, Ver mi mes, Presupuestos, Recurrentes
 */

import { useState } from 'react'
import { PlusCircle, BarChart3, Wallet, Target, RefreshCw, Settings, PiggyBank } from 'lucide-react'
import { Layout } from '../../../components/layout'
import { useResumenMensual } from '../hooks/useResumenMensual'
import { useIngresos } from '../hooks/useIngresos'
import { formatearMonto, getNombreMesActual } from '../utils/formatters'
import RegistrarGasto from './RegistrarGasto'
import VistaDelMes from './VistaDelMes'
import SeccionPresupuestos from './SeccionPresupuestos'
import SeccionRecurrentes from './SeccionRecurrentes'
import ModalConfigurarIngresos from './ModalConfigurarIngresos'

export default function MisFinanzasPage() {
  const [vistaActiva, setVistaActiva] = useState('inicio') // inicio, registrar, mes, presupuestos, recurrentes
  const [mostrarModalIngresos, setMostrarModalIngresos] = useState(false)
  const resumen = useResumenMensual()
  const { ingresos, totalIngresos, guardar: guardarIngresos } = useIngresos()

  // Volver al inicio
  const volverInicio = () => setVistaActiva('inicio')

  // Contenido segun vista activa
  const renderContenido = () => {
    if (vistaActiva === 'registrar') {
      return (
        <RegistrarGasto
          onVolver={volverInicio}
          onGastoRegistrado={() => {
            resumen.recargar()
            volverInicio()
          }}
        />
      )
    }

    if (vistaActiva === 'mes') {
      return (
        <VistaDelMes
          resumen={resumen}
          onVolver={volverInicio}
        />
      )
    }

    if (vistaActiva === 'presupuestos') {
      return (
        <SeccionPresupuestos
          gastosPorCategoria={resumen.categorias}
          onVolver={volverInicio}
        />
      )
    }

    if (vistaActiva === 'recurrentes') {
      return (
        <SeccionRecurrentes
          onVolver={volverInicio}
          onGastoCargado={() => resumen.recargar()}
        />
      )
    }

    // Vista inicio
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-violet-700 text-white px-4 py-6">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-8 h-8" />
          <h1 className="text-2xl font-heading font-bold">Mis Finanzas</h1>
        </div>
        <p className="text-violet-100 text-sm">
          Controlá tus gastos personales de forma simple
        </p>
      </div>

      {/* Resumen rapido */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500">{getNombreMesActual()}</div>
            <button
              onClick={() => setMostrarModalIngresos(true)}
              className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
            >
              <Settings className="w-3 h-3" />
              {totalIngresos > 0 ? 'Editar ingresos' : 'Configurar ingresos'}
            </button>
          </div>
          {resumen.loading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-32" />
          ) : (
            <>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatearMonto(resumen.totalMesActual)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {resumen.cantidadGastos} {resumen.cantidadGastos === 1 ? 'gasto' : 'gastos'} registrados
                  </div>
                </div>
                {totalIngresos > 0 && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">de {formatearMonto(totalIngresos)}</div>
                  </div>
                )}
              </div>

              {/* Barra de progreso si hay ingresos */}
              {totalIngresos > 0 && (
                <div className="mt-3">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        resumen.totalMesActual > totalIngresos ? 'bg-red-500' :
                        resumen.totalMesActual > totalIngresos * 0.8 ? 'bg-amber-500' :
                        'bg-violet-500'
                      }`}
                      style={{ width: `${Math.min((resumen.totalMesActual / totalIngresos) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Info de saldo y ahorro */}
              {resumen.ahorro && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  {/* Saldo disponible */}
                  <div className={`flex items-center gap-2 ${resumen.ahorro.monto >= 0 ? 'text-violet-600' : 'text-red-600'}`}>
                    <PiggyBank className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {resumen.ahorro.monto >= 0 ? 'Saldo disponible: ' : 'Deficit: '}
                      {formatearMonto(Math.abs(resumen.ahorro.monto))}
                    </span>
                  </div>

                  {/* Objetivo de ahorro con progreso */}
                  {resumen.ahorro.objetivoPorcentaje > 0 && (
                    <div className="bg-emerald-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-emerald-700 font-medium">
                          Objetivo de ahorro: {resumen.ahorro.objetivoPorcentaje}% = {formatearMonto(resumen.ahorro.ahorroObjetivo)}
                        </div>
                        <div className="text-xs font-bold text-emerald-600">
                          {resumen.ahorro.porcentajeObjetivoCumplido}%
                        </div>
                      </div>

                      {/* Barra de progreso del ahorro */}
                      <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            resumen.ahorro.objetivoCumplido ? 'bg-emerald-500' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${resumen.ahorro.porcentajeObjetivoCumplido}%` }}
                        />
                      </div>

                      {/* Estado del objetivo */}
                      <div className="text-xs">
                        {resumen.ahorro.totalInvertidoAhorro > 0 && (
                          <span className="text-emerald-700">
                            Ya invertiste: {formatearMonto(resumen.ahorro.totalInvertidoAhorro)}
                          </span>
                        )}
                        {resumen.ahorro.objetivoCumplido ? (
                          <span className="text-emerald-600 font-medium ml-2">
                            ¡Objetivo cumplido!
                          </span>
                        ) : resumen.ahorro.faltaParaObjetivo > 0 && (
                          <span className="text-emerald-600 ml-2">
                            · Te faltan {formatearMonto(resumen.ahorro.faltaParaObjetivo)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 3 Botones grandes */}
      <div className="px-4 mt-6 space-y-4">
        {/* Registrar gasto */}
        <button
          onClick={() => setVistaActiva('registrar')}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl p-5 flex items-center gap-4 shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="bg-white/20 rounded-full p-3">
            <PlusCircle className="w-8 h-8" />
          </div>
          <div className="text-left">
            <div className="text-lg font-semibold">Registrar gasto</div>
            <div className="text-violet-100 text-sm">Anotá un nuevo gasto rapidamente</div>
          </div>
        </button>

        {/* Ver mi mes */}
        <button
          onClick={() => setVistaActiva('mes')}
          className="w-full bg-white hover:bg-gray-50 text-gray-900 rounded-xl p-5 flex items-center gap-4 shadow-lg border border-gray-200 transition-all active:scale-[0.98]"
        >
          <div className="bg-blue-100 rounded-full p-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-left">
            <div className="text-lg font-semibold">Ver mi mes</div>
            <div className="text-gray-500 text-sm">Resumen y estadisticas del mes</div>
          </div>
        </button>

        {/* Botones secundarios */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Presupuestos */}
          <button
            onClick={() => setVistaActiva('presupuestos')}
            className="bg-white hover:bg-gray-50 text-gray-900 rounded-xl p-4 flex flex-col items-center gap-2 shadow border border-gray-200 transition-all active:scale-[0.98]"
          >
            <div className="bg-emerald-100 rounded-full p-2">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="text-center">
              <div className="font-medium text-sm">Presupuestos</div>
              <div className="text-gray-400 text-xs">Limites por categoria</div>
            </div>
          </button>

          {/* Recurrentes */}
          <button
            onClick={() => setVistaActiva('recurrentes')}
            className="bg-white hover:bg-gray-50 text-gray-900 rounded-xl p-4 flex flex-col items-center gap-2 shadow border border-gray-200 transition-all active:scale-[0.98]"
          >
            <div className="bg-cyan-100 rounded-full p-2">
              <RefreshCw className="w-6 h-6 text-cyan-600" />
            </div>
            <div className="text-center">
              <div className="font-medium text-sm">Recurrentes</div>
              <div className="text-gray-400 text-xs">Gastos fijos mensuales</div>
            </div>
          </button>
        </div>
      </div>

      {/* Modal configurar ingresos */}
      {mostrarModalIngresos && (
        <ModalConfigurarIngresos
          ingresos={ingresos}
          onGuardar={async (datos) => {
            await guardarIngresos(datos)
            resumen.recargar()
          }}
          onClose={() => setMostrarModalIngresos(false)}
        />
      )}
    </div>
    )
  }

  return (
    <Layout>
      {renderContenido()}
    </Layout>
  )
}
