/**
 * Vista para registrar un nuevo gasto
 */

import { useState } from 'react'
import { ArrowLeft, Save, Calculator } from 'lucide-react'
import { useCategorias } from '../hooks/useCategorias'
import { useGastos } from '../hooks/useGastos'
import { getCategoriaColor, getCategoriaIcono } from '../utils/categoriasConfig'
import { METODOS_PAGO } from '../utils/metodoPagoConfig'
import { getHoy, formatearInputMonto, parsearInputMonto } from '../utils/formatters'

export default function RegistrarGasto({ onVolver, onGastoRegistrado }) {
  const { categorias, loading: loadingCategorias } = useCategorias()
  const { agregar } = useGastos()

  const [formData, setFormData] = useState({
    monto: '',
    descripcion: '',
    categoria_id: '',
    metodo_pago: 'efectivo',
    fecha: getHoy(),
    notas: ''
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  // Manejar cambios
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  // Guardar gasto
  const handleGuardar = async () => {
    // Validaciones
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
      await agregar({
        monto: montoNumerico,
        descripcion: formData.descripcion.trim() || null,
        categoria_id: formData.categoria_id,
        metodo_pago: formData.metodo_pago,
        fecha: formData.fecha,
        notas: formData.notas.trim() || null
      })
      onGastoRegistrado()
    } catch (err) {
      console.error('Error guardando gasto:', err)
      setError('Error al guardar el gasto')
    } finally {
      setGuardando(false)
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
        <h1 className="text-lg font-heading font-semibold text-gray-900">Registrar gasto</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Monto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={formData.monto}
              onChange={(e) => handleChange('monto', formatearInputMonto(e.target.value))}
              placeholder="100.000"
              className="w-full pl-10 pr-4 py-4 text-2xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
        </div>

        {/* Descripcion */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripcion (opcional)
          </label>
          <input
            type="text"
            value={formData.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            placeholder="Ej: Almuerzo, Nafta, etc."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria *
          </label>
          {loadingCategorias ? (
            <div className="grid grid-cols-4 gap-2">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="animate-pulse h-14 bg-gray-200 rounded-lg" />
              ))}
            </div>
          ) : (
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
                    className={`p-2 rounded-lg border-2 transition-all text-center flex flex-col items-center ${
                      isSelected
                        ? `${colors.bg} ${colors.border} ${colors.text}`
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 mb-0.5 ${isSelected ? '' : 'text-gray-500'}`} />
                    <div className={`text-[10px] font-medium truncate w-full ${isSelected ? '' : 'text-gray-700'}`}>
                      {cat.nombre}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Metodo de pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Metodo de pago
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(METODOS_PAGO).map(([key, config]) => {
              const isSelected = formData.metodo_pago === key
              const Icon = config.icon
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleChange('metodo_pago', key)}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                    isSelected
                      ? `${config.bgSelected} ${config.borderSelected} ${config.textSelected}`
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? '' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${isSelected ? '' : 'text-gray-700'}`}>
                    {config.label}
                  </span>
                </button>
              )
            })}
          </div>
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

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas adicionales (opcional)
          </label>
          <textarea
            value={formData.notas}
            onChange={(e) => handleChange('notas', e.target.value)}
            placeholder="Algun detalle extra..."
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Boton guardar */}
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {guardando ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar gasto
            </>
          )}
        </button>
      </div>
    </div>
  )
}
