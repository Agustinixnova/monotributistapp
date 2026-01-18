/**
 * Seccion de gastos recurrentes (gastos fijos mensuales)
 */

import { useState } from 'react'
import { ArrowLeft, RefreshCw, Plus, Edit2, Trash2, Check, X, Calendar, ToggleLeft, ToggleRight } from 'lucide-react'
import { useCategorias } from '../hooks/useCategorias'
import { useRecurrentes } from '../hooks/useRecurrentes'
import { getCategoriaColor, getCategoriaIcono } from '../utils/categoriasConfig'
import { formatearMonto, getHoy } from '../utils/formatters'
import { METODOS_PAGO } from '../utils/metodoPagoConfig'

export default function SeccionRecurrentes({ onVolver, onGastoCargado }) {
  const { categorias } = useCategorias()
  const { recurrentes, totalMensual, loading, crear, actualizar, eliminar, toggleActivo, cargarGasto } = useRecurrentes(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [cargandoGasto, setCargandoGasto] = useState(null)

  const [formData, setFormData] = useState({
    descripcion: '',
    monto: '',
    categoriaId: '',
    metodoPago: 'debito',
    diadelMes: ''
  })

  // Reset form
  const resetForm = () => {
    setFormData({
      descripcion: '',
      monto: '',
      categoriaId: '',
      metodoPago: 'debito',
      diadelMes: ''
    })
    setMostrarFormulario(false)
    setEditando(null)
  }

  // Iniciar edicion
  const iniciarEdicion = (recurrente) => {
    setFormData({
      descripcion: recurrente.descripcion || '',
      monto: recurrente.monto?.toString() || '',
      categoriaId: recurrente.categoria_id || '',
      metodoPago: recurrente.metodo_pago || 'debito',
      diadelMes: recurrente.dia_del_mes?.toString() || ''
    })
    setEditando(recurrente.id)
    setMostrarFormulario(true)
  }

  // Guardar recurrente
  const handleGuardar = async () => {
    if (!formData.descripcion.trim()) return
    if (!formData.monto || parseFloat(formData.monto) <= 0) return
    if (!formData.categoriaId) return

    setGuardando(true)
    try {
      const datos = {
        descripcion: formData.descripcion.trim(),
        monto: parseFloat(formData.monto),
        categoriaId: formData.categoriaId,
        metodoPago: formData.metodoPago,
        diadelMes: formData.diadelMes ? parseInt(formData.diadelMes) : null
      }

      if (editando) {
        await actualizar(editando, datos)
      } else {
        await crear(datos)
      }
      resetForm()
    } catch (err) {
      console.error('Error guardando recurrente:', err)
    } finally {
      setGuardando(false)
    }
  }

  // Cargar gasto desde recurrente
  const handleCargarGasto = async (recurrente) => {
    setCargandoGasto(recurrente.id)
    try {
      await cargarGasto(recurrente, getHoy())
      onGastoCargado?.()
    } catch (err) {
      console.error('Error cargando gasto:', err)
    } finally {
      setCargandoGasto(null)
    }
  }

  // Eliminar recurrente
  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este gasto recurrente?')) return
    try {
      await eliminar(id)
    } catch (err) {
      console.error('Error eliminando:', err)
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
          <RefreshCw className="w-5 h-5 text-violet-600" />
          <h1 className="text-lg font-heading font-semibold text-gray-900">Gastos recurrentes</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            Guardá tus gastos fijos (Netflix, alquiler, internet) y cargalos con un solo click cada mes.
          </p>
        </div>

        {/* Total mensual */}
        {recurrentes.filter(r => r.activo).length > 0 && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-violet-700">Total gastos fijos mensuales</span>
              <span className="text-lg font-bold text-violet-900">{formatearMonto(totalMensual)}</span>
            </div>
          </div>
        )}

        {/* Boton agregar */}
        {!mostrarFormulario && (
          <button
            onClick={() => setMostrarFormulario(true)}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl p-4 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar gasto recurrente
          </button>
        )}

        {/* Formulario */}
        {mostrarFormulario && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">
                {editando ? 'Editar recurrente' : 'Nuevo gasto recurrente'}
              </h3>
              <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Descripcion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion *</label>
              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Ej: Netflix, Alquiler, Internet"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={formData.monto}
                  onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <div className="grid grid-cols-4 gap-2">
                {categorias.map(cat => {
                  const isSelected = formData.categoriaId === cat.id
                  const colors = getCategoriaColor(cat.color)
                  const IconComponent = getCategoriaIcono(cat.nombre)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, categoriaId: cat.id }))}
                      className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center ${
                        isSelected
                          ? `${colors.bg} ${colors.border} ${colors.text}`
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 mb-0.5 ${isSelected ? '' : 'text-gray-500'}`} />
                      <div className={`text-[9px] truncate w-full text-center ${isSelected ? '' : 'text-gray-600'}`}>
                        {cat.nombre}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Metodo de pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metodo de pago</label>
              <select
                value={formData.metodoPago}
                onChange={(e) => setFormData(prev => ({ ...prev, metodoPago: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                {Object.entries(METODOS_PAGO).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* Dia del mes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dia del mes (opcional)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.diadelMes}
                onChange={(e) => setFormData(prev => ({ ...prev, diadelMes: e.target.value }))}
                placeholder="Ej: 10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
              <p className="text-xs text-gray-500 mt-1">¿Qué dia se cobra normalmente?</p>
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={resetForm}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando || !formData.descripcion || !formData.monto || !formData.categoriaId}
                className="flex-1 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-violet-400 transition-colors"
              >
                {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de recurrentes */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-xl p-4 h-20" />
            ))}
          </div>
        ) : recurrentes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay gastos recurrentes</p>
            <p className="text-sm text-gray-400 mt-1">Agregá tus gastos fijos para cargarlos mas rapido</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recurrentes.map(recurrente => {
              const categoria = recurrente.categoria || recurrente.fp_categorias || {}
              const colors = getCategoriaColor(categoria.color || 'gray')
              const IconComponent = getCategoriaIcono(categoria.nombre)
              const esCargando = cargandoGasto === recurrente.id

              return (
                <div
                  key={recurrente.id}
                  className={`bg-white rounded-xl border border-gray-200 p-4 ${!recurrente.activo ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Icono */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.bg}`}>
                      <IconComponent className={`w-5 h-5 ${colors.text}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{recurrente.descripcion}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span>{categoria.nombre}</span>
                        {recurrente.dia_del_mes && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Dia {recurrente.dia_del_mes}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Monto */}
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatearMonto(recurrente.monto)}</div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {/* Toggle activo */}
                      <button
                        onClick={() => toggleActivo(recurrente.id, !recurrente.activo)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        {recurrente.activo ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-violet-600" />
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5" />
                            <span>Inactivo</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Editar */}
                      <button
                        onClick={() => iniciarEdicion(recurrente)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>

                      {/* Eliminar */}
                      <button
                        onClick={() => handleEliminar(recurrente.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>

                      {/* Cargar como gasto */}
                      {recurrente.activo && (
                        <button
                          onClick={() => handleCargarGasto(recurrente)}
                          disabled={esCargando}
                          className="px-3 py-1.5 bg-violet-100 text-violet-700 text-sm font-medium rounded-lg hover:bg-violet-200 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {esCargando ? (
                            <div className="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Cargar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
