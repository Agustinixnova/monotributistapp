/**
 * Calculadora de ajuste por IPC
 * Feature clave para que clientes calculen actualizacion de precios
 *
 * Caso de uso: Si cobraba $100.000 en enero 2025, cuanto deberia cobrar hoy?
 */

import { useState, useMemo } from 'react'
import { Calculator, TrendingUp, DollarSign, Calendar, Info, AlertCircle, HelpCircle } from 'lucide-react'
import { useInflacion } from '../hooks/useInflacion'
import {
  calcularInflacionAcumulada,
  calcularMontoAjustado,
  calcularDiferencia,
  generarOpcionesMeses,
  getNombreMes,
  getFechaMasReciente,
  hayDatosHasta
} from '../utils/calculosIPC'
import { formatearMoneda, formatearPorcentaje } from '../utils/formatters'
import TooltipModal from './TooltipModal'
import { EXPLICACIONES } from '../utils/tooltipsExplicaciones'

// Calcular mes anterior (para default de fechaHasta)
const getMesAnterior = () => {
  const hoy = new Date()
  const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
  return mesAnterior.toISOString().substring(0, 7)
}

// Formatear numero con separadores de miles (1234567 -> "1.234.567")
const formatearConSeparadores = (valor) => {
  if (!valor) return ''
  // Remover todo excepto numeros
  const soloNumeros = valor.replace(/\D/g, '')
  if (!soloNumeros) return ''
  // Formatear con separadores de miles
  return Number(soloNumeros).toLocaleString('es-AR')
}

// Parsear numero formateado a numero (1.234.567 -> 1234567)
const parsearNumero = (valor) => {
  if (!valor) return 0
  // Remover puntos de miles
  const limpio = valor.replace(/\./g, '')
  return parseFloat(limpio) || 0
}

export default function CalculadoraIPC() {
  const { inflacionMensual, loading, error } = useInflacion()
  const [showTooltip, setShowTooltip] = useState(false)

  // Estado del formulario - fechaHasta por default es el mes anterior
  const [montoOriginal, setMontoOriginal] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState(getMesAnterior())

  // Generar opciones de meses (ultimos 36 meses)
  const opcionesMeses = useMemo(() => generarOpcionesMeses(36), [])

  // Fecha mas reciente con datos
  const fechaMasReciente = useMemo(() =>
    getFechaMasReciente(inflacionMensual),
    [inflacionMensual]
  )

  // Calculos
  const resultado = useMemo(() => {
    const monto = parsearNumero(montoOriginal)
    if (!monto || monto <= 0 || !fechaDesde || !fechaHasta) {
      return null
    }

    // Verificar que haya datos hasta la fecha seleccionada
    if (!hayDatosHasta(inflacionMensual, fechaHasta)) {
      return { error: 'No hay datos de inflacion hasta la fecha seleccionada' }
    }

    const inflacionAcumulada = calcularInflacionAcumulada(
      inflacionMensual,
      fechaDesde,
      fechaHasta
    )

    const montoAjustado = calcularMontoAjustado(monto, inflacionAcumulada)
    const diferencia = calcularDiferencia(monto, montoAjustado)

    return {
      inflacionAcumulada,
      montoAjustado,
      diferencia,
      montoOriginal: monto
    }
  }, [montoOriginal, fechaDesde, fechaHasta, inflacionMensual])

  // Setear fecha hasta al mes mas reciente con datos
  const handleSetFechaActual = () => {
    if (fechaMasReciente) {
      setFechaHasta(fechaMasReciente)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
            <Calculator className="w-5 h-5 text-violet-600" />
          </div>
          <h3 className="font-heading font-semibold text-gray-900">Calculadora de ajuste por IPC</h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded-lg" />
          <div className="h-10 bg-gray-200 rounded-lg" />
          <div className="h-10 bg-gray-200 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>Error cargando datos de inflacion</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-violet-600 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-white">Calculadora de ajuste por IPC</h3>
              <p className="text-violet-100 text-sm">Calcula cuanto deberia cobrar hoy</p>
            </div>
          </div>
          {/* Botón de ayuda */}
          <button
            onClick={() => setShowTooltip(true)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Más información"
          >
            <HelpCircle className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Formulario */}
      <div className="p-5 space-y-4">
        {/* Monto original */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto que cobrabas
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={montoOriginal}
              onChange={(e) => setMontoOriginal(formatearConSeparadores(e.target.value))}
              placeholder="100.000"
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-lg"
            />
          </div>
        </div>

        {/* Fecha desde */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Desde cuando cobrabas ese monto
          </label>
          <select
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          >
            <option value="">Seleccionar mes</option>
            {opcionesMeses.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Fecha hasta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Calcular hasta
          </label>
          <div className="flex gap-2">
            <select
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="">Seleccionar mes</option>
              {opcionesMeses.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              onClick={handleSetFechaActual}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 whitespace-nowrap"
              title="Usar el mes mas reciente con datos"
            >
              Ultimo
            </button>
          </div>
          {fechaMasReciente && (
            <p className="text-xs text-gray-500 mt-1">
              Ultimo dato disponible: {getNombreMes(fechaMasReciente)}
            </p>
          )}
        </div>

        {/* Resultado */}
        {resultado && !resultado.error && (
          <div className="mt-6 pt-4 border-t border-gray-200 space-y-4">
            {/* Inflacion acumulada */}
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-700 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Inflacion acumulada</span>
              </div>
              <div className="text-3xl font-bold text-amber-600">
                {formatearPorcentaje(resultado.inflacionAcumulada, 1, false)}
              </div>
              <p className="text-xs text-amber-600 mt-1">
                Entre {getNombreMes(fechaDesde)} y {getNombreMes(fechaHasta)}
              </p>
            </div>

            {/* Monto ajustado */}
            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-emerald-700 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Deberias cobrar</span>
              </div>
              <div className="text-3xl font-bold text-emerald-600">
                {formatearMoneda(resultado.montoAjustado, 0)}
              </div>
              <p className="text-xs text-emerald-600 mt-1">
                Diferencia: +{formatearMoneda(resultado.diferencia, 0)}
              </p>
            </div>

            {/* Explicacion */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Si cobrabas <strong>{formatearMoneda(resultado.montoOriginal)}</strong> en {getNombreMes(fechaDesde)},
                  hoy deberias cobrar <strong>{formatearMoneda(resultado.montoAjustado)}</strong> para
                  mantener el mismo poder adquisitivo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error de datos */}
        {resultado?.error && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{resultado.error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tooltip Modal */}
      <TooltipModal
        isOpen={showTooltip}
        onClose={() => setShowTooltip(false)}
        titulo={EXPLICACIONES.calculadoraIPC.titulo}
        texto={EXPLICACIONES.calculadoraIPC.texto}
      />
    </div>
  )
}
