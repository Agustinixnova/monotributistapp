import { useState } from 'react'
import { Calendar, DollarSign, Info } from 'lucide-react'
import { formatearMoneda } from '../../facturacion/utils/formatters'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

/**
 * Formulario para cargar facturacion historica de clientes que vienen de otro contador
 */
export function HistoricalBillingForm({ data, onChange }) {
  const [modo, setModo] = useState(data.modoHistorico || 'total') // 'total' o 'mensual'

  // Generar ultimos 12 meses
  const hoy = new Date()
  const ultimos12Meses = []
  for (let i = 1; i <= 12; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    ultimos12Meses.push({
      anio: fecha.getFullYear(),
      mes: fecha.getMonth() + 1,
      label: `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`
    })
  }

  const handleModoChange = (nuevoModo) => {
    setModo(nuevoModo)
    onChange({
      ...data,
      modoHistorico: nuevoModo,
      // Limpiar datos del modo anterior
      totalAcumulado12Meses: nuevoModo === 'total' ? data.totalAcumulado12Meses : null,
      facturacionMensual: nuevoModo === 'mensual' ? data.facturacionMensual : null
    })
  }

  const handleTotalChange = (value) => {
    const numero = value.replace(/[^0-9.,]/g, '').replace(',', '.')
    onChange({
      ...data,
      totalAcumulado12Meses: numero ? parseFloat(numero) : null
    })
  }

  const handleMesChange = (anio, mes, value) => {
    const numero = value.replace(/[^0-9.,]/g, '').replace(',', '.')
    const facturacionMensual = { ...(data.facturacionMensual || {}) }
    const key = `${anio}-${mes}`

    if (numero) {
      facturacionMensual[key] = parseFloat(numero)
    } else {
      delete facturacionMensual[key]
    }

    onChange({
      ...data,
      facturacionMensual
    })
  }

  // Calcular total de meses cargados
  const totalMensual = data.facturacionMensual
    ? Object.values(data.facturacionMensual).reduce((sum, v) => sum + (v || 0), 0)
    : 0

  return (
    <div className="space-y-6">
      {/* Info box */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Facturacion previa del cliente</p>
          <p className="mt-1">
            Como este cliente viene de otro contador, necesitamos saber cuánto facturo
            en los ultimos 12 meses para calcular correctamente su situacion respecto
            al tope de su categoria.
          </p>
        </div>
      </div>

      {/* Selector de modo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          ¿Como queres cargar la facturacion anterior?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleModoChange('total')}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              modo === 'total'
                ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className={`w-5 h-5 ${modo === 'total' ? 'text-violet-600' : 'text-gray-400'}`} />
              <span className="font-medium text-gray-900">Total acumulado</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Cargo el monto total de los ultimos 12 meses
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleModoChange('mensual')}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              modo === 'mensual'
                ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className={`w-5 h-5 ${modo === 'mensual' ? 'text-violet-600' : 'text-gray-400'}`} />
              <span className="font-medium text-gray-900">Detalle mensual</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Cargo mes por mes para mayor precision
            </p>
          </button>
        </div>
      </div>

      {/* Formulario segun modo */}
      {modo === 'total' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total facturado en los ultimos 12 meses
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="text"
              value={data.totalAcumulado12Meses || ''}
              onChange={(e) => handleTotalChange(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 text-lg font-mono"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Este monto se distribuira proporcionalmente en los ultimos 12 meses
          </p>
        </div>
      )}

      {modo === 'mensual' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Facturacion por mes
            </label>
            {totalMensual > 0 && (
              <span className="text-sm text-violet-600 font-medium">
                Total: {formatearMoneda(totalMensual)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ultimos12Meses.map(({ anio, mes, label }) => {
              const key = `${anio}-${mes}`
              const value = data.facturacionMensual?.[key] || ''

              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-28 text-sm text-gray-600 truncate">{label}</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleMesChange(anio, mes, e.target.value)}
                      placeholder="0"
                      className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 text-sm font-mono"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Skip option */}
      <div className="pt-4 border-t border-gray-200">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.omitirHistorico || false}
            onChange={(e) => onChange({ ...data, omitirHistorico: e.target.checked })}
            className="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
          />
          <div>
            <span className="text-sm text-gray-700">Omitir por ahora</span>
            <p className="text-xs text-gray-500">
              Podés cargar esta informacion mas adelante desde la ficha del cliente
            </p>
          </div>
        </label>
      </div>
    </div>
  )
}

export default HistoricalBillingForm
