/**
 * Conversor de monedas extranjeras a ARS
 */

import { useState, useMemo } from 'react'
import { ArrowRightLeft, DollarSign, Landmark, Banknote, ShoppingCart, Wallet } from 'lucide-react'
import { useCotizaciones } from '../hooks/useCotizaciones'
import { formatearMoneda } from '../utils/formatters'
import { getCotizacionesDolar, getConfigCotizacion } from '../utils/coloresCotizaciones'

// Formatear numero con separadores de miles
const formatearConSeparadores = (valor) => {
  if (!valor) return ''
  const soloNumeros = valor.replace(/\D/g, '')
  if (!soloNumeros) return ''
  return Number(soloNumeros).toLocaleString('es-AR')
}

// Parsear numero formateado a numero
const parsearNumero = (valor) => {
  if (!valor) return 0
  const limpio = valor.replace(/\./g, '')
  return parseFloat(limpio) || 0
}

const MONEDAS = [
  { key: 'USD', label: 'Dolar', icon: DollarSign },
  { key: 'EUR', label: 'Euro', icon: Landmark },
  { key: 'BRL', label: 'Real', icon: Banknote },
]

const OPERACIONES = [
  { key: 'comprar', label: 'Comprar', icon: ShoppingCart, descripcion: 'Cuánto pago por' },
  { key: 'vender', label: 'Vender', icon: Wallet, descripcion: 'Cuánto recibo por' },
]

export default function ConversorMonedas() {
  const { cotizaciones, loading } = useCotizaciones()
  const [monto, setMonto] = useState('100')
  const [moneda, setMoneda] = useState('USD')
  const [operacion, setOperacion] = useState('comprar') // 'comprar' o 'vender'

  // Tipos de dolar disponibles
  const tiposDolar = getCotizacionesDolar()

  // Calcular conversiones
  // Comprar: usamos precio de venta (lo que nos cobran por comprar USD)
  // Vender: usamos precio de compra (lo que nos dan por vender USD)
  const conversiones = useMemo(() => {
    const montoNum = parsearNumero(monto)
    if (montoNum <= 0 || !cotizaciones) return []

    const precioKey = operacion === 'comprar' ? 'venta' : 'compra'

    if (moneda === 'USD') {
      // Convertir USD a ARS con cada tipo de dolar
      return tiposDolar.map(tipo => {
        const cotizacion = cotizaciones[tipo]
        const precio = cotizacion?.[precioKey]
        if (!precio) return { tipo, valor: null }

        return {
          tipo,
          valor: montoNum * precio,
          cotizacion: precio
        }
      }).filter(c => c.valor !== null)
    } else if (moneda === 'EUR') {
      // Convertir EUR a ARS
      const cotizacion = cotizaciones.euro
      const precio = cotizacion?.[precioKey]
      if (!precio) return []

      return [{
        tipo: 'euro',
        valor: montoNum * precio,
        cotizacion: precio
      }]
    } else if (moneda === 'BRL') {
      // Convertir BRL a ARS
      const cotizacion = cotizaciones.real
      const precio = cotizacion?.[precioKey]
      if (!precio) return []

      return [{
        tipo: 'real',
        valor: montoNum * precio,
        cotizacion: precio
      }]
    }

    return []
  }, [monto, moneda, cotizaciones, tiposDolar, operacion])

  // Obtener descripción de la operación actual
  const operacionActual = OPERACIONES.find(o => o.key === operacion)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-violet-600" />
          <h3 className="font-heading font-semibold text-gray-900">Conversor</h3>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Input de monto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={monto}
            onChange={(e) => setMonto(formatearConSeparadores(e.target.value))}
            placeholder="100"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
        </div>

        {/* Selector de operación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Operacion
          </label>
          <div className="flex gap-2">
            {OPERACIONES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setOperacion(key)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                  operacion === key
                    ? 'bg-violet-50 border-violet-400 text-violet-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-violet-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selector de moneda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Moneda
          </label>
          <div className="flex gap-2">
            {MONEDAS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMoneda(key)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                  moneda === key
                    ? 'bg-violet-50 border-violet-400 text-violet-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-violet-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{key}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Resultados */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : conversiones.length > 0 ? (
          <div className="space-y-2 pt-3 border-t border-gray-100">
            {/* Título del resultado */}
            <div className="text-sm font-medium text-center py-1 px-3 rounded-lg bg-violet-50 text-violet-700">
              {operacion === 'comprar'
                ? `Para comprar ${monto} ${moneda} necesitás:`
                : `Al vender ${monto} ${moneda} recibís:`
              }
            </div>

            {conversiones.map(({ tipo, valor, cotizacion }) => {
              const config = getConfigCotizacion(tipo)
              return (
                <div
                  key={tipo}
                  className={`flex items-center justify-between p-3 rounded-lg ${config.bgLight}`}
                >
                  <div className="flex items-center gap-2">
                    <config.icon className={`w-4 h-4 ${config.text}`} />
                    <span className={`text-sm font-medium ${config.text}`}>
                      {config.nombre}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({formatearMoneda(cotizacion, 2)})
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {formatearMoneda(valor, 0)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            No hay cotizaciones disponibles
          </div>
        )}
      </div>
    </div>
  )
}
