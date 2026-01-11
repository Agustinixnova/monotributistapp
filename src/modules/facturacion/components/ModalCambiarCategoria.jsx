import { useState, useEffect } from 'react'
import { X, ArrowRight, AlertTriangle, CheckCircle, TrendingUp, Loader2, Scale } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../auth/hooks/useAuth'
import { calcularMontoCuota } from '../services/cuotaService'
import { getAcumulado12Meses } from '../services/resumenService'
import { formatearMoneda } from '../utils/formatters'
import { registrarCambio, TIPO_CAMBIO } from '../../../services/historialCambiosService'
import { escalasService } from '../../configuracion/escalas/services/escalasService'
import { getCategoriaColor } from '../../../utils/categoriaColors'

/**
 * Modal para cambiar la categoria de monotributo de un cliente
 * Muestra comparativo de cuota y tope, con validaciones
 */
export function ModalCambiarCategoria({ cliente, onClose, onSuccess }) {
  const { user } = useAuth()
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCategoria, setSelectedCategoria] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [acumulado, setAcumulado] = useState(0)
  const [categoriaActualData, setCategoriaActualData] = useState(null)

  // Cargar categorias y datos del cliente
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Obtener todas las categorias vigentes usando el mismo servicio que Escalas
        const cats = await escalasService.getCategoriasVigentes()
        console.log('Categorias cargadas:', cats?.length, cats)

        setCategorias(cats || [])

        // Obtener categoria actual
        const catActual = cats?.find(c => c.categoria === cliente.categoria_monotributo)
        setCategoriaActualData(catActual)

        // Obtener acumulado de facturacion
        if (cliente.id || cliente.client_id) {
          const acumData = await getAcumulado12Meses(cliente.id || cliente.client_id)
          setAcumulado(acumData?.neto || 0)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [cliente])

  // Calcular tope segun tipo de actividad
  const getTope = (cat) => {
    if (!cat) return 0
    const esServicios = cliente.tipo_actividad === 'servicios'
    if (esServicios && cat.tope_facturacion_servicios) {
      return parseFloat(cat.tope_facturacion_servicios)
    }
    return parseFloat(cat.tope_facturacion_anual)
  }

  // Calcular cuota segun la categoria
  const getCuota = (cat) => {
    if (!cat) return 0
    return calcularMontoCuota(cat, cliente.tipo_actividad, cliente.trabaja_relacion_dependencia)
  }

  // Verificar si el cliente ya supera el tope de una categoria
  const superaTope = (cat) => {
    return acumulado > getTope(cat)
  }

  // Calcular categoria minima viable (con margen de seguridad del 85%)
  const getCategoriaMinima = () => {
    for (const cat of categorias) {
      const tope = getTope(cat)
      // Si el acumulado es menor al 85% del tope, esta categoria es segura
      if (tope > 0 && (acumulado / tope) <= 0.85) {
        return cat.categoria
      }
    }
    return 'K' // Ultima categoria
  }

  // Verificar si está en zona de riesgo (entre 85% y 100% del tope)
  const estaEnZonaRiesgo = () => {
    const porcentaje = topeActual > 0 ? (acumulado / topeActual) * 100 : 0
    return porcentaje >= 85 && porcentaje < 100
  }

  // Manejar seleccion de categoria
  const handleSelect = (cat) => {
    setSelectedCategoria(cat)
    setShowConfirm(true)
  }

  // Guardar cambio con historial
  const handleConfirm = async () => {
    if (!selectedCategoria || !user?.id) return

    try {
      setSaving(true)

      const clientId = cliente.id || cliente.client_id
      const categoriaAnterior = cliente.categoria_monotributo
      const topeAnterior = getTope(categoriaActualData)
      const topeNuevo = getTope(selectedCategoria)

      // 1. Actualizar categoria en client_fiscal_data
      const { error: updateError } = await supabase
        .from('client_fiscal_data')
        .update({ categoria_monotributo: selectedCategoria.categoria })
        .eq('id', clientId)

      if (updateError) throw updateError

      // 2. Registrar en historial unificado
      await registrarCambio({
        clientFiscalDataId: clientId,
        tipoCambio: TIPO_CAMBIO.CATEGORIA,
        campo: 'Categoria monotributo',
        valorAnterior: categoriaAnterior,
        valorNuevo: selectedCategoria.categoria,
        metadata: {
          facturacion_al_momento: acumulado,
          porcentaje_tope_anterior: topeAnterior > 0 ? Math.round((acumulado / topeAnterior) * 100) : null,
          porcentaje_tope_nuevo: topeNuevo > 0 ? Math.round((acumulado / topeNuevo) * 100) : null
        },
        realizadoPor: user.id
      })

      onSuccess?.(selectedCategoria.categoria)
      onClose()
    } catch (err) {
      console.error('Error saving:', err)
      alert('Error al guardar el cambio')
    } finally {
      setSaving(false)
    }
  }

  // Color del badge segun uso del tope
  const getBadgeColor = (cat) => {
    const tope = getTope(cat)
    const porcentaje = tope > 0 ? (acumulado / tope) * 100 : 0

    if (porcentaje >= 90) return 'bg-red-100 text-red-700 border-red-200'
    if (porcentaje >= 70) return 'bg-amber-100 text-amber-700 border-amber-200'
    return 'bg-green-100 text-green-700 border-green-200'
  }

  const categoriaMinima = getCategoriaMinima()
  const cuotaActual = getCuota(categoriaActualData)
  const topeActual = getTope(categoriaActualData)
  const porcentajeActual = topeActual > 0 ? Math.round((acumulado / topeActual) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
              <Scale className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Cambiar Categoria</h2>
              <p className="text-sm text-gray-500">
                {cliente.full_name || cliente.razon_social || 'Cliente'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : showConfirm && selectedCategoria ? (
          /* Vista de confirmacion */
          <div className="p-6 overflow-y-auto overflow-x-hidden flex-1">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Confirmar cambio</h3>
              <p className="text-sm text-gray-500 mt-1">
                Vas a cambiar de categoria {cliente.categoria_monotributo} a {selectedCategoria.categoria}
              </p>
            </div>

            {/* Comparativo */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {/* Actual */}
              <div className="flex-1 bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">ACTUAL</p>
                <div className="text-2xl sm:text-3xl font-bold text-gray-400 mb-1">
                  {cliente.categoria_monotributo}
                </div>
                <div className="space-y-0.5 text-xs sm:text-sm">
                  <p className="text-gray-600">{formatearMoneda(cuotaActual)}/mes</p>
                  <p className="text-gray-500 hidden sm:block">Tope: {formatearMoneda(topeActual)}</p>
                </div>
              </div>

              {/* Flecha */}
              <div className="flex-shrink-0">
                <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 text-violet-400" />
              </div>

              {/* Nueva */}
              <div className="flex-1 bg-violet-50 rounded-xl p-3 sm:p-4 text-center border-2 border-violet-200">
                <p className="text-xs text-violet-600 mb-1">NUEVA</p>
                <div className="text-2xl sm:text-3xl font-bold text-violet-600 mb-1">
                  {selectedCategoria.categoria}
                </div>
                <div className="space-y-0.5 text-xs sm:text-sm">
                  <p className="text-violet-700">{formatearMoneda(getCuota(selectedCategoria))}/mes</p>
                  <p className="text-violet-500 hidden sm:block">Tope: {formatearMoneda(getTope(selectedCategoria))}</p>
                </div>
              </div>
            </div>

            {/* Diferencias */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Resumen del cambio</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Diferencia en cuota:</span>
                  <span className={`font-medium ${
                    getCuota(selectedCategoria) > cuotaActual ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {getCuota(selectedCategoria) > cuotaActual ? '+' : ''}
                    {formatearMoneda(getCuota(selectedCategoria) - cuotaActual)}/mes
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nuevo tope anual:</span>
                  <span className="font-medium text-gray-900">
                    {formatearMoneda(getTope(selectedCategoria))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Facturado actual:</span>
                  <span className="font-medium text-gray-900">
                    {formatearMoneda(acumulado)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Uso del nuevo tope:</span>
                  <span className={`font-medium ${
                    superaTope(selectedCategoria) ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {Math.round((acumulado / getTope(selectedCategoria)) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Advertencia si supera tope */}
            {superaTope(selectedCategoria) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Atencion: El cliente ya supera este tope</p>
                  <p className="text-sm text-red-700 mt-1">
                    El cliente facturo {formatearMoneda(acumulado)} y el tope de categoria {selectedCategoria.categoria} es {formatearMoneda(getTope(selectedCategoria))}.
                    La categoria minima viable es <strong>{categoriaMinima}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Volver
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirmar cambio
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Lista de categorias */
          <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden flex-1">
            {/* Info actual */}
            <div className="bg-violet-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs sm:text-sm text-violet-600">Categoria actual</p>
                  <p className="text-xl sm:text-2xl font-bold text-violet-700">{cliente.categoria_monotributo}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-violet-600">Facturado (12m)</p>
                  <p className="text-base sm:text-lg font-semibold text-violet-700">{formatearMoneda(acumulado)}</p>
                  <p className="text-[10px] sm:text-xs text-violet-500">{porcentajeActual}% del tope</p>
                </div>
              </div>
            </div>

            {/* Sugerencia o Alerta de riesgo */}
            {categoriaMinima !== cliente.categoria_monotributo ? (
              <div className={`rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-2 sm:gap-3 ${
                estaEnZonaRiesgo() || superaTope(categoriaActualData)
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                {estaEnZonaRiesgo() || superaTope(categoriaActualData) ? (
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium text-sm sm:text-base ${
                    estaEnZonaRiesgo() || superaTope(categoriaActualData) ? 'text-red-800' : 'text-amber-800'
                  }`}>
                    {superaTope(categoriaActualData)
                      ? '¡Riesgo de exclusion!'
                      : estaEnZonaRiesgo()
                      ? '¡Cerca del limite!'
                      : 'Sugerencia'}
                  </p>
                  <p className={`text-xs sm:text-sm ${
                    estaEnZonaRiesgo() || superaTope(categoriaActualData) ? 'text-red-700' : 'text-amber-700'
                  }`}>
                    {superaTope(categoriaActualData)
                      ? `Ya superaste el tope. Deberias subir a categoria ${categoriaMinima}`
                      : estaEnZonaRiesgo()
                      ? `Estas al ${porcentajeActual}% del tope. Te sugerimos subir a categoria ${categoriaMinima}`
                      : `Categoria recomendada: ${categoriaMinima}`}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Lista de categorias */}
            <div className="flex flex-col gap-2">
              {categorias.map(cat => {
                const tope = getTope(cat)
                const cuota = getCuota(cat)
                const supera = superaTope(cat)
                const esActual = cat.categoria === cliente.categoria_monotributo
                const esSugerida = cat.categoria === categoriaMinima && categoriaMinima !== cliente.categoria_monotributo

                return (
                  <button
                    key={cat.categoria}
                    onClick={() => !esActual && handleSelect(cat)}
                    disabled={esActual}
                    className={`w-full p-3 sm:p-4 rounded-xl border-2 transition-all text-left ${
                      esActual
                        ? 'bg-violet-50 border-violet-300 cursor-default'
                        : esSugerida
                        ? 'bg-amber-50 border-amber-300 hover:border-amber-400'
                        : supera
                        ? 'bg-red-50 border-red-200 hover:border-red-300'
                        : 'bg-white border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0 ${
                          getCategoriaColor(cat.categoria)
                        } ${esActual ? 'ring-2 ring-violet-500' : ''}`}>
                          {cat.categoria}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm sm:text-base">
                              Cat. {cat.categoria}
                            </span>
                            {esActual && (
                              <span className="px-1.5 sm:px-2 py-0.5 bg-violet-200 text-violet-700 text-[10px] sm:text-xs rounded-full">
                                Actual
                              </span>
                            )}
                            {esSugerida && (
                              <span className="px-1.5 sm:px-2 py-0.5 bg-amber-200 text-amber-700 text-[10px] sm:text-xs rounded-full">
                                Sugerida
                              </span>
                            )}
                            {supera && !esActual && (
                              <span className="px-1.5 sm:px-2 py-0.5 bg-red-200 text-red-700 text-[10px] sm:text-xs rounded-full">
                                Supera
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            Tope: {formatearMoneda(tope)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatearMoneda(cuota)}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">/mes</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModalCambiarCategoria
