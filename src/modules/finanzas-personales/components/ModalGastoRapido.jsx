/**
 * Modal de gasto rapido - solo monto y categoria
 * Para usar como atajo desde cualquier parte de la app
 */

import { useState } from 'react'
import { X, Plus, Check, DollarSign, Banknote, PiggyBank, HelpCircle } from 'lucide-react'
import { useCategorias } from '../hooks/useCategorias'
import { useGastos } from '../hooks/useGastos'
import { getCategoriaColor, getCategoriaIcono, TIPOS_AHORRO } from '../utils/categoriasConfig'
import { getHoy, formatearInputMonto, parsearInputMonto } from '../utils/formatters'

export default function ModalGastoRapido({ onClose, onGastoRegistrado }) {
  const { categorias, loading: loadingCategorias } = useCategorias()
  const { agregar } = useGastos()

  const [paso, setPaso] = useState(1) // 1: monto, 2: categoria, 3: detalle ahorro
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [categoriaNombre, setCategoriaNombre] = useState('')
  const [tipoAhorro, setTipoAhorro] = useState('')
  const [cotizacionDolar, setCotizacionDolar] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)

  // Construir descripcion final
  const construirDescripcion = () => {
    let desc = descripcion.trim()
    if (tipoAhorro === 'dolares' && cotizacionDolar) {
      const montoNum = parsearInputMonto(monto)
      const cotizNum = parseFloat(cotizacionDolar)
      const usd = montoNum / cotizNum
      desc = `USD ${usd.toFixed(2)} @ $${cotizacionDolar}${desc ? ' - ' + desc : ''}`
    } else if (tipoAhorro === 'pesos') {
      desc = `Pesos${desc ? ' - ' + desc : ''}`
    } else if (tipoAhorro === 'otros') {
      desc = `Otros${desc ? ' - ' + desc : ''}`
    }
    return desc || null
  }

  // Guardar gasto
  const guardarGasto = async () => {
    setGuardando(true)
    try {
      await agregar({
        monto: parsearInputMonto(monto),
        categoria_id: categoriaId,
        fecha: getHoy(),
        metodo_pago: 'efectivo',
        descripcion: construirDescripcion()
      })
      setExito(true)
      setTimeout(() => {
        onGastoRegistrado?.()
        onClose()
      }, 800)
    } catch (err) {
      console.error('Error guardando gasto:', err)
      setGuardando(false)
    }
  }

  // Seleccionar categoria
  const handleSeleccionarCategoria = async (catId, catNombre) => {
    const montoNumerico = parsearInputMonto(monto)
    if (!monto || montoNumerico <= 0) return

    setCategoriaId(catId)
    setCategoriaNombre(catNombre)

    // Si es Ahorro, mostrar paso 3 para detalles
    if (catNombre === 'Ahorro') {
      setPaso(3)
      return
    }

    // Sino, guardar directamente
    setGuardando(true)
    try {
      await agregar({
        monto: montoNumerico,
        categoria_id: catId,
        fecha: getHoy(),
        metodo_pago: 'efectivo',
        descripcion: descripcion.trim() || null
      })
      setExito(true)
      setTimeout(() => {
        onGastoRegistrado?.()
        onClose()
      }, 800)
    } catch (err) {
      console.error('Error guardando gasto:', err)
      setGuardando(false)
    }
  }

  // Continuar al paso 2
  const handleContinuar = () => {
    if (monto && parsearInputMonto(monto) > 0) {
      setPaso(2)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-violet-600 text-white px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <h2 className="font-heading font-semibold">Gasto rápido</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Exito */}
        {exito ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-lg font-medium text-gray-900">Gasto registrado!</div>
          </div>
        ) : paso === 3 ? (
          /* Paso 3: Detalle de Ahorro */
          <div className="p-6">
            <div className="text-center mb-4">
              <div className="text-sm text-gray-500">Ahorro</div>
              <div className="text-2xl font-bold text-gray-900">${monto}</div>
            </div>

            <label className="block text-sm font-medium text-gray-600 mb-3 text-center">
              ¿En qué tipo de ahorro?
            </label>

            <div className="space-y-3 mb-4">
              {TIPOS_AHORRO.map(tipo => (
                <button
                  key={tipo.value}
                  onClick={() => setTipoAhorro(tipo.value)}
                  className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    tipoAhorro === tipo.value
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                      : 'bg-white border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {tipo.value === '' && <HelpCircle className="w-5 h-5" />}
                  {tipo.value === 'pesos' && <Banknote className="w-5 h-5" />}
                  {tipo.value === 'dolares' && <DollarSign className="w-5 h-5" />}
                  {tipo.value === 'otros' && <PiggyBank className="w-5 h-5" />}
                  <span className="font-medium">{tipo.label}</span>
                </button>
              ))}
            </div>

            {/* Input cotización dólar */}
            {tipoAhorro === 'dolares' && (
              <div className="mb-4 p-4 bg-blue-50 rounded-xl">
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  ¿A cuánto compraste el dólar?
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={cotizacionDolar}
                    onChange={(e) => setCotizacionDolar(e.target.value)}
                    placeholder="1200"
                    className="w-full pl-8 pr-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {cotizacionDolar && parseFloat(cotizacionDolar) > 0 && (
                  <div className="mt-2 text-sm text-blue-600">
                    = USD {(parsearInputMonto(monto) / parseFloat(cotizacionDolar)).toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {/* Descripcion opcional */}
            <div className="mb-4">
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Nota adicional (opcional)"
                className="w-full px-4 py-3 text-center border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-700"
              />
            </div>

            <button
              onClick={guardarGasto}
              disabled={guardando || (tipoAhorro === 'dolares' && !cotizacionDolar)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {guardando ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <PiggyBank className="w-5 h-5" />
                  Registrar ahorro
                </>
              )}
            </button>

            {/* Boton volver */}
            <button
              onClick={() => setPaso(2)}
              disabled={guardando}
              className="w-full mt-3 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              ← Cambiar categoría
            </button>
          </div>
        ) : paso === 1 ? (
          /* Paso 1: Monto y descripcion */
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-600 mb-3 text-center">
              ¿Cuánto gastaste?
            </label>
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-2xl">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={monto}
                onChange={(e) => setMonto(formatearInputMonto(e.target.value))}
                placeholder="100.000"
                autoFocus
                className="w-full pl-12 pr-4 py-4 text-3xl font-bold text-center border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            {/* Descripcion opcional */}
            <div className="mb-6">
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="¿En qué? (opcional)"
                className="w-full px-4 py-3 text-center border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-700"
              />
            </div>

            <button
              onClick={handleContinuar}
              disabled={!monto || parsearInputMonto(monto) <= 0}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Continuar
            </button>
          </div>
        ) : (
          /* Paso 2: Categoria */
          <div className="p-4">
            <div className="text-center mb-4">
              <div className="text-sm text-gray-500">Monto</div>
              <div className="text-2xl font-bold text-gray-900">${monto}</div>
              {descripcion && (
                <div className="text-sm text-gray-500 mt-1">"{descripcion}"</div>
              )}
            </div>

            <label className="block text-sm font-medium text-gray-600 mb-3 text-center">
              ¿En qué categoría?
            </label>

            {loadingCategorias ? (
              <div className="grid grid-cols-4 gap-2">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="animate-pulse h-16 bg-gray-200 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
                {categorias.map(cat => {
                  const colors = getCategoriaColor(cat.color)
                  const IconComponent = getCategoriaIcono(cat.nombre)
                  const isSelected = categoriaId === cat.id
                  const isLoading = guardando && isSelected

                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSeleccionarCategoria(cat.id, cat.nombre)}
                      disabled={guardando}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center ${
                        isSelected
                          ? `${colors.bg} ${colors.border} ${colors.text}`
                          : 'bg-white border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                      } ${guardando && !isSelected ? 'opacity-50' : ''}`}
                    >
                      {isLoading ? (
                        <div className="w-6 h-6 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin mb-1" />
                      ) : (
                        <IconComponent className={`w-6 h-6 mb-1 ${isSelected ? '' : 'text-gray-500'}`} />
                      )}
                      <div className={`text-[10px] font-medium truncate w-full text-center ${isSelected ? '' : 'text-gray-600'}`}>
                        {cat.nombre}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Boton volver */}
            <button
              onClick={() => setPaso(1)}
              disabled={guardando}
              className="w-full mt-4 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              ← Cambiar monto
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
