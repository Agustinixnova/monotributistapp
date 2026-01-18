/**
 * Modal para configurar ingresos mensuales y objetivo de ahorro
 */

import { useState, useEffect } from 'react'
import { X, DollarSign, PiggyBank, Wallet, Plus, Save } from 'lucide-react'
import { formatearMonto, formatearInputMonto, parsearInputMonto } from '../utils/formatters'

export default function ModalConfigurarIngresos({ ingresos, onGuardar, onClose }) {
  const [formData, setFormData] = useState({
    ingresoPrincipal: '',
    otrosIngresos: '',
    ingresosExtra: '',
    objetivoAhorroPorcentaje: ''
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  // Cargar datos existentes
  useEffect(() => {
    if (ingresos) {
      setFormData({
        ingresoPrincipal: ingresos.ingreso_principal ? formatearInputMonto(Math.round(ingresos.ingreso_principal).toString()) : '',
        otrosIngresos: ingresos.otros_ingresos ? formatearInputMonto(Math.round(ingresos.otros_ingresos).toString()) : '',
        ingresosExtra: ingresos.ingresos_extra ? formatearInputMonto(Math.round(ingresos.ingresos_extra).toString()) : '',
        objetivoAhorroPorcentaje: ingresos.objetivo_ahorro_porcentaje?.toString() || ''
      })
    }
  }, [ingresos])

  // Calcular total y ahorro objetivo
  const totalIngresos = parsearInputMonto(formData.ingresoPrincipal) +
                        parsearInputMonto(formData.otrosIngresos) +
                        parsearInputMonto(formData.ingresosExtra)

  const porcentajeAhorro = parseFloat(formData.objetivoAhorroPorcentaje) || 0
  const montoAhorroObjetivo = totalIngresos * (porcentajeAhorro / 100)
  const montoDisponibleGastos = totalIngresos - montoAhorroObjetivo

  // Manejar cambios
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  // Guardar
  const handleGuardar = async () => {
    const ingresoPrincipalNum = parsearInputMonto(formData.ingresoPrincipal)
    if (!formData.ingresoPrincipal || ingresoPrincipalNum <= 0) {
      setError('Ingresá tu ingreso principal')
      return
    }

    setGuardando(true)
    setError(null)

    try {
      await onGuardar({
        ingresoPrincipal: ingresoPrincipalNum,
        otrosIngresos: parsearInputMonto(formData.otrosIngresos),
        ingresosExtra: parsearInputMonto(formData.ingresosExtra),
        objetivoAhorroPorcentaje: parseFloat(formData.objetivoAhorroPorcentaje) || 0
      })
      onClose()
    } catch (err) {
      console.error('Error guardando ingresos:', err)
      setError('Error al guardar los ingresos')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-violet-100 rounded-full p-2">
              <Wallet className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="text-lg font-heading font-semibold text-gray-900">
              Mis ingresos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Ingreso principal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingreso principal *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={formData.ingresoPrincipal}
                onChange={(e) => handleChange('ingresoPrincipal', formatearInputMonto(e.target.value))}
                placeholder="500.000"
                className="w-full pl-10 pr-4 py-3 text-lg font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Tu sueldo o ingreso principal mensual</p>
          </div>

          {/* Otros ingresos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Otros ingresos fijos (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={formData.otrosIngresos}
                onChange={(e) => handleChange('otrosIngresos', formatearInputMonto(e.target.value))}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Alquileres, rentas, pensiones, etc.</p>
          </div>

          {/* Ingresos extra */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingresos extra este mes (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={formData.ingresosExtra}
                onChange={(e) => handleChange('ingresosExtra', formatearInputMonto(e.target.value))}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Aguinaldo, bonos, trabajos freelance, etc.</p>
          </div>

          {/* Total ingresos */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total ingresos del mes</span>
              <span className="text-xl font-bold text-gray-900">{formatearMonto(totalIngresos)}</span>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-4">
              <PiggyBank className="w-5 h-5 text-violet-600" />
              <span className="font-medium text-gray-900">Objetivo de ahorro</span>
            </div>

            {/* Porcentaje de ahorro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Qué porcentaje querés ahorrar?
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  value={formData.objetivoAhorroPorcentaje}
                  onChange={(e) => handleChange('objetivoAhorroPorcentaje', e.target.value)}
                  placeholder="Ej: 20"
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>

            {/* Resumen ahorro */}
            {porcentajeAhorro > 0 && totalIngresos > 0 && (
              <div className="mt-4 bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-violet-700">Deberías separar</span>
                  <span className="font-bold text-violet-900">{formatearMonto(montoAhorroObjetivo)}/mes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-violet-700">Disponible para gastos</span>
                  <span className="font-semibold text-violet-800">{formatearMonto(montoDisponibleGastos)}</span>
                </div>
              </div>
            )}
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
                Guardar ingresos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
