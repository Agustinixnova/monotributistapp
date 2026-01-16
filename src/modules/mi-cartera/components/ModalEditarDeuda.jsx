import { useState, useEffect } from 'react'
import { X, AlertTriangle, DollarSign, Calendar, Loader2, CheckCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { registrarCambio } from '../../../services/historialCambiosService'
import { useAuth } from '../../../auth/hooks/useAuth'

/**
 * Modal para ver y editar la deuda de monotributo de un cliente
 */
export function ModalEditarDeuda({ isOpen, onClose, clientId, clienteNombre, onSave }) {
  const { user } = useAuth()
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [datos, setDatos] = useState({
    estadoPagoMonotributo: 'al_dia',
    montoDeudaMonotributo: '',
    cuotasAdeudadasMonotributo: ''
  })

  useEffect(() => {
    const fetchDatos = async () => {
      if (!clientId || !isOpen) return

      setCargando(true)
      try {
        const { data, error } = await supabase
          .from('client_fiscal_data')
          .select('estado_pago_monotributo, monto_deuda_monotributo, cuotas_adeudadas_monotributo')
          .eq('id', clientId)
          .single()

        if (error) throw error

        setDatos({
          estadoPagoMonotributo: data?.estado_pago_monotributo || 'al_dia',
          montoDeudaMonotributo: data?.monto_deuda_monotributo || '',
          cuotasAdeudadasMonotributo: data?.cuotas_adeudadas_monotributo || ''
        })
      } catch (err) {
        console.error('Error cargando datos de deuda:', err)
      } finally {
        setCargando(false)
      }
    }

    fetchDatos()
  }, [clientId, isOpen])

  const handleChange = (field, value) => {
    setDatos(prev => {
      const newDatos = { ...prev, [field]: value }

      // Si cambia a al_dia, limpiar campos de deuda
      if (field === 'estadoPagoMonotributo' && value === 'al_dia') {
        newDatos.montoDeudaMonotributo = ''
        newDatos.cuotasAdeudadasMonotributo = ''
      }

      return newDatos
    })
  }

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      // Obtener datos anteriores para el historial
      const { data: datosAnteriores } = await supabase
        .from('client_fiscal_data')
        .select('estado_pago_monotributo, monto_deuda_monotributo, cuotas_adeudadas_monotributo')
        .eq('id', clientId)
        .single()

      const updateData = {
        estado_pago_monotributo: datos.estadoPagoMonotributo,
        monto_deuda_monotributo: datos.estadoPagoMonotributo === 'con_deuda' && datos.montoDeudaMonotributo
          ? parseFloat(datos.montoDeudaMonotributo)
          : null,
        cuotas_adeudadas_monotributo: datos.estadoPagoMonotributo === 'con_deuda' && datos.cuotasAdeudadasMonotributo
          ? parseInt(datos.cuotasAdeudadasMonotributo)
          : null
      }

      const { error } = await supabase
        .from('client_fiscal_data')
        .update(updateData)
        .eq('id', clientId)

      if (error) throw error

      // Registrar en historial de cambios
      if (user?.id && (datosAnteriores?.estado_pago_monotributo !== datos.estadoPagoMonotributo ||
          datosAnteriores?.monto_deuda_monotributo != updateData.monto_deuda_monotributo ||
          datosAnteriores?.cuotas_adeudadas_monotributo != updateData.cuotas_adeudadas_monotributo)) {

        try {
          // Obtener el user_id del cliente
          const { data: clientData } = await supabase
            .from('client_fiscal_data')
            .select('user_id')
            .eq('id', clientId)
            .single()

          const valorAnteriorStr = `${datosAnteriores?.estado_pago_monotributo || 'al_dia'} - Monto: $${datosAnteriores?.monto_deuda_monotributo || 0} - Cuotas: ${datosAnteriores?.cuotas_adeudadas_monotributo || 0}`
          const valorNuevoStr = `${datos.estadoPagoMonotributo} - Monto: $${updateData.monto_deuda_monotributo || 0} - Cuotas: ${updateData.cuotas_adeudadas_monotributo || 0}`

          await registrarCambio({
            userId: clientData?.user_id,
            clientFiscalDataId: clientId,
            tipoCambio: 'pago',
            campo: 'Estado de pago monotributo',
            valorAnterior: valorAnteriorStr,
            valorNuevo: valorNuevoStr,
            metadata: {
              estadoAnterior: datosAnteriores?.estado_pago_monotributo,
              estadoNuevo: datos.estadoPagoMonotributo,
              montoAnterior: datosAnteriores?.monto_deuda_monotributo,
              montoNuevo: updateData.monto_deuda_monotributo,
              cuotasAnterior: datosAnteriores?.cuotas_adeudadas_monotributo,
              cuotasNuevo: updateData.cuotas_adeudadas_monotributo
            },
            realizadoPor: user.id
          })
        } catch (historialError) {
          // No fallar si el historial da error, solo logear
          console.error('Error registrando en historial (no crítico):', historialError)
        }
      }

      if (onSave) await onSave()
      onClose()
    } catch (err) {
      console.error('Error guardando deuda:', err)
      alert('Error al guardar los cambios')
    } finally {
      setGuardando(false)
    }
  }

  const formatearMoneda = (monto) => {
    if (!monto) return '-'
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Estado de Pago</h2>
              {clienteNombre && (
                <p className="text-sm text-gray-500">{clienteNombre}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {cargando ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Estado de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado de pago del monotributo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange('estadoPagoMonotributo', 'al_dia')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      datos.estadoPagoMonotributo === 'al_dia'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Al dia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('estadoPagoMonotributo', 'con_deuda')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      datos.estadoPagoMonotributo === 'con_deuda'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Con deuda</span>
                  </button>
                </div>
              </div>

              {/* Campos de deuda (solo si con_deuda) */}
              {datos.estadoPagoMonotributo === 'con_deuda' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                  <p className="text-sm font-medium text-red-700">Detalle de la deuda</p>

                  {/* Monto */}
                  <div>
                    <label className="flex items-center gap-1 text-sm text-red-600 mb-1">
                      <DollarSign className="w-4 h-4" />
                      Monto adeudado
                    </label>
                    <input
                      type="number"
                      value={datos.montoDeudaMonotributo}
                      onChange={(e) => handleChange('montoDeudaMonotributo', e.target.value)}
                      placeholder="Ej: 150000"
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  {/* Cuotas */}
                  <div>
                    <label className="flex items-center gap-1 text-sm text-red-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      Cuotas adeudadas
                    </label>
                    <input
                      type="number"
                      value={datos.cuotasAdeudadasMonotributo}
                      onChange={(e) => handleChange('cuotasAdeudadasMonotributo', e.target.value)}
                      placeholder="Ej: 5"
                      min="1"
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  {/* Preview */}
                  {datos.montoDeudaMonotributo && datos.cuotasAdeudadasMonotributo && (
                    <div className="p-3 bg-red-100 rounded-lg">
                      <p className="text-sm text-red-800">
                        El cliente vera: <strong>{formatearMoneda(datos.montoDeudaMonotributo)}</strong> de deuda por <strong>{datos.cuotasAdeudadasMonotributo} {parseInt(datos.cuotasAdeudadasMonotributo) === 1 ? 'cuota' : 'cuotas'}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando || cargando}
            className="flex-1 px-4 py-2 text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {guardando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
