/**
 * Modal para cierre de caja
 */

import { useState, useEffect } from 'react'
import { X, Lock, CheckCircle, AlertCircle, FileDown, Printer } from 'lucide-react'
import InputMonto from './InputMonto'
import IconoDinamico from './IconoDinamico'
import { formatearMonto } from '../utils/formatters'
import { calcularEfectivoEsperado, calcularDiferenciaCierre } from '../utils/calculosCaja'
import { getColorDiferencia } from '../utils/coloresConfig'
import { descargarPDFCierreCaja, abrirPDFCierreCaja } from '../utils/pdfCierreCaja'

export default function ModalCierreCaja({
  isOpen,
  onClose,
  saldoInicial,
  resumen,
  totalesPorMetodo,
  onGuardar,
  cierreExistente = null, // Para modo edición
  fecha = null, // Fecha del cierre
  nombreNegocio = 'Mi Negocio' // Nombre del negocio para PDF
}) {
  const [efectivoReal, setEfectivoReal] = useState(0)
  const [motivoDiferencia, setMotivoDiferencia] = useState('')
  const [guardando, setGuardando] = useState(false)

  const modoEdicion = !!cierreExistente

  // Calcular efectivo esperado
  const efectivoEsperado = calcularEfectivoEsperado(
    saldoInicial,
    resumen?.efectivo_entradas || 0,
    resumen?.efectivo_salidas || 0
  )

  // Calcular diferencia
  const diferencia = calcularDiferenciaCierre(efectivoReal, efectivoEsperado)

  // Pre-llenar efectivo real con el esperado o con el cierre existente
  useEffect(() => {
    if (isOpen) {
      if (cierreExistente) {
        // Modo edición: cargar datos existentes
        setEfectivoReal(parseFloat(cierreExistente.efectivo_real || 0))
        setMotivoDiferencia(cierreExistente.motivo_diferencia || '')
      } else {
        // Modo creación: usar esperado
        setEfectivoReal(efectivoEsperado)
        setMotivoDiferencia('')
      }
    }
  }, [isOpen, efectivoEsperado, cierreExistente])

  const handleGuardar = async () => {
    setGuardando(true)

    try {
      await onGuardar({
        efectivo_esperado: efectivoEsperado,
        efectivo_real: efectivoReal,
        diferencia,
        motivo_diferencia: diferencia !== 0 ? motivoDiferencia.trim() : null,
        total_entradas: resumen?.total_entradas || 0,
        total_salidas: resumen?.total_salidas || 0
      })

      onClose()
    } catch (err) {
      console.error('Error cerrando caja:', err)
    } finally {
      setGuardando(false)
    }
  }

  // Preparar datos para el PDF
  const datosPDF = {
    fecha: fecha || new Date().toISOString().split('T')[0],
    saldoInicial,
    resumen,
    cierre: cierreExistente || {
      efectivo_real: efectivoReal,
      diferencia,
      motivo_diferencia: motivoDiferencia
    },
    totalesPorMetodo,
    nombreNegocio
  }

  const handleDescargarPDF = () => {
    descargarPDFCierreCaja(datosPDF)
  }

  const handleImprimirPDF = () => {
    abrirPDFCierreCaja(datosPDF)
  }

  if (!isOpen) return null

  // Obtener medios digitales
  const mediosDigitales = totalesPorMetodo?.filter(m => !m.es_efectivo) || []

  // Colores según diferencia
  const colorDif = getColorDiferencia(diferencia)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-500 to-violet-600 px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-lg">
                {modoEdicion ? 'Editar Cierre de Caja' : 'Cierre de Caja'}
              </h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Efectivo en caja */}
            <div className="bg-violet-50 rounded-lg p-4">
              <h4 className="font-heading font-semibold text-violet-900 mb-3">
                Efectivo en caja
              </h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Saldo inicial:</span>
                  <span className="font-medium">{formatearMonto(saldoInicial)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>+ Entradas efectivo:</span>
                  <span className="font-medium">
                    {formatearMonto(resumen?.efectivo_entradas || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-red-700">
                  <span>- Salidas efectivo:</span>
                  <span className="font-medium">
                    {formatearMonto(resumen?.efectivo_salidas || 0)}
                  </span>
                </div>

                <div className="border-t border-violet-200 pt-2 mt-2">
                  <div className="flex justify-between text-base">
                    <span className="font-semibold text-violet-900">Efectivo esperado:</span>
                    <span className="font-bold text-violet-700">
                      {formatearMonto(efectivoEsperado)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Input efectivo real */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Cuánto hay en caja?
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                <InputMonto
                  value={efectivoReal}
                  onChange={setEfectivoReal}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-lg font-medium"
                />
              </div>
            </div>

            {/* Diferencia */}
            <div className={`${colorDif.bg} rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                {diferencia === 0 ? (
                  <CheckCircle className={`w-5 h-5 ${colorDif.icon}`} />
                ) : (
                  <AlertCircle className={`w-5 h-5 ${colorDif.icon}`} />
                )}
                <span className={`font-medium ${colorDif.text}`}>Diferencia</span>
              </div>
              <div className={`text-2xl font-bold ${colorDif.text}`}>
                {diferencia >= 0 ? '+' : ''}{formatearMonto(diferencia)}
              </div>
            </div>

            {/* Motivo diferencia */}
            {diferencia !== 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la diferencia
                </label>
                <textarea
                  value={motivoDiferencia}
                  onChange={(e) => setMotivoDiferencia(e.target.value)}
                  placeholder="Explicar brevemente la diferencia..."
                  maxLength={200}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                />
              </div>
            )}

            {/* Medios digitales */}
            {mediosDigitales.length > 0 && (
              <div className="border-t border-gray-200 pt-5">
                <h4 className="font-heading font-semibold text-gray-900 mb-3">
                  Medios digitales (no en caja)
                </h4>
                <div className="space-y-2 text-sm">
                  {mediosDigitales.map(metodo => {
                    const tieneEntradas = parseFloat(metodo.total_entradas || 0) > 0
                    const tieneSalidas = parseFloat(metodo.total_salidas || 0) > 0

                    // Solo mostrar si tiene movimientos
                    if (!tieneEntradas && !tieneSalidas) return null

                    return (
                      <div key={metodo.metodo_id}>
                        <div className="flex items-center gap-2 mb-1">
                          <IconoDinamico nombre={metodo.metodo_icono} className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-700 font-medium">{metodo.metodo_nombre}:</span>
                        </div>
                        <div className="ml-6 space-y-1 text-xs">
                          {tieneEntradas && (
                            <div className="flex justify-between text-emerald-700">
                              <span>+ Entradas:</span>
                              <span className="font-medium">{formatearMonto(metodo.total_entradas)}</span>
                            </div>
                          )}
                          {tieneSalidas && (
                            <div className="flex justify-between text-red-700">
                              <span>- Salidas:</span>
                              <span className="font-medium">{formatearMonto(metodo.total_salidas)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total digital entradas:</span>
                      <span className="font-bold text-emerald-700">
                        {formatearMonto(
                          mediosDigitales.reduce((sum, m) => sum + parseFloat(m.total_entradas || 0), 0)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total digital salidas:</span>
                      <span className="font-bold text-red-700">
                        {formatearMonto(
                          mediosDigitales.reduce((sum, m) => sum + parseFloat(m.total_salidas || 0), 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resumen del día */}
            <div className="border-t border-gray-200 pt-5">
              <h4 className="font-heading font-semibold text-gray-900 mb-3">
                Resumen del día
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-emerald-700">
                  <span>Total entradas:</span>
                  <span className="font-medium">
                    {formatearMonto(resumen?.total_entradas || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-red-700">
                  <span>Total salidas:</span>
                  <span className="font-medium">
                    {formatearMonto(resumen?.total_salidas || 0)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-base">
                    <span className="font-semibold">RESULTADO:</span>
                    <span className="font-bold text-violet-700">
                      {formatearMonto(resumen?.saldo || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4 space-y-3">
            {/* Botones de PDF (solo en modo edición) */}
            {modoEdicion && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDescargarPDF}
                  className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  Descargar PDF
                </button>
                <button
                  onClick={handleImprimirPDF}
                  className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
              </div>
            )}

            {/* Botón principal */}
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors"
            >
              <Lock className="w-5 h-5" />
              {guardando
                ? (modoEdicion ? 'Actualizando...' : 'Cerrando...')
                : (modoEdicion ? 'Actualizar Cierre' : 'Cerrar Caja')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
