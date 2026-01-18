/**
 * Modal para editar o eliminar un gasto
 */

import { useState } from 'react'
import { X, Trash2, Save } from 'lucide-react'
import { useCategorias } from '../hooks/useCategorias'
import { useGastos } from '../hooks/useGastos'
import { getCategoriaColor, getCategoriaIcono } from '../utils/categoriasConfig'
import { METODOS_PAGO } from '../utils/metodoPagoConfig'
import { formatearInputMonto, parsearInputMonto } from '../utils/formatters'

export default function ModalEditarGasto({ gasto, onClose, onGuardado }) {
  const { categorias } = useCategorias()
  const { editar, eliminar } = useGastos()

  const [formData, setFormData] = useState({
    monto: gasto.monto ? formatearInputMonto(Math.round(gasto.monto).toString()) : '',
    descripcion: gasto.descripcion || '',
    categoria_id: gasto.categoria_id || '',
    metodo_pago: gasto.metodo_pago || 'efectivo',
    fecha: gasto.fecha || '',
    notas: gasto.notas || ''
  })
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState(null)
  const [confirmEliminar, setConfirmEliminar] = useState(false)

  // Manejar cambios
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  // Guardar cambios
  const handleGuardar = async () => {
    const montoNumerico = parsearInputMonto(formData.monto)
    if (!formData.monto || montoNumerico <= 0) {
      setError('Ingresá un monto válido')
      return
    }
    if (!formData.categoria_id) {
      setError('Seleccioná una categoría')
      return
    }

    setGuardando(true)
    setError(null)

    try {
      await editar(gasto.id, {
        monto: montoNumerico,
        descripcion: formData.descripcion.trim() || null,
        categoria_id: formData.categoria_id,
        metodo_pago: formData.metodo_pago,
        fecha: formData.fecha,
        notas: formData.notas.trim() || null
      })
      onGuardado()
    } catch (err) {
      console.error('Error actualizando gasto:', err)
      setError('Error al actualizar el gasto')
    } finally {
      setGuardando(false)
    }
  }

  // Eliminar gasto
  const handleEliminar = async () => {
    if (!confirmEliminar) {
      setConfirmEliminar(true)
      return
    }

    setEliminando(true)
    try {
      await eliminar(gasto.id)
      onGuardado()
    } catch (err) {
      console.error('Error eliminando gasto:', err)
      setError('Error al eliminar el gasto')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold text-gray-900">
            Editar gasto
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={formData.monto}
                onChange={(e) => handleChange('monto', formatearInputMonto(e.target.value))}
                className="w-full pl-10 pr-4 py-3 text-xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>

          {/* Descripcion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripcion
            </label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Opcional"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categorias.map(cat => {
                const isSelected = formData.categoria_id === cat.id
                const colors = getCategoriaColor(cat.color)
                const IconComponent = getCategoriaIcono(cat.nombre)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleChange('categoria_id', cat.id)}
                    className={`p-1.5 rounded-lg border-2 transition-all flex flex-col items-center ${
                      isSelected
                        ? `${colors.bg} ${colors.border} ${colors.text}`
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 mb-0.5 ${isSelected ? '' : 'text-gray-500'}`} />
                    <div className={`text-[10px] truncate w-full text-center ${isSelected ? '' : 'text-gray-600'}`}>
                      {cat.nombre}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Metodo de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metodo de pago
            </label>
            <select
              value={formData.metodo_pago}
              onChange={(e) => handleChange('metodo_pago', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              {Object.entries(METODOS_PAGO).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => handleChange('fecha', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleEliminar}
              disabled={eliminando || guardando}
              className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                confirmEliminar
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              {eliminando ? 'Eliminando...' : confirmEliminar ? 'Confirmar' : 'Eliminar'}
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando || eliminando}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
