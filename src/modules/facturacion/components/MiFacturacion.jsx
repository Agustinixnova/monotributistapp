import { useState, useEffect } from 'react'
import { Plus, FileText } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../auth/hooks/useAuth'
import { useFacturacionMensual } from '../hooks/useFacturacionMensual'
import { useClienteFiscal } from '../hooks/useClienteFiscal'
import { BarraProgresoTope } from './BarraProgresoTope'
import { FormFacturacionMensual } from './FormFacturacionMensual'
import { formatearMoneda } from '../utils/formatters'
import { calcularEstadoAlerta, getNombreMes } from '../utils/calculosFacturacion'

export function MiFacturacion() {
  const { user } = useAuth()
  const [clientId, setClientId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [mesSeleccionado, setMesSeleccionado] = useState(null)

  // Obtener el client_fiscal_data.id del usuario
  useEffect(() => {
    const fetchClientId = async () => {
      const { data } = await supabase
        .from('client_fiscal_data')
        .select('id, gestion_facturacion')
        .eq('user_id', user.id)
        .single()

      if (data) setClientId(data.id)
    }
    if (user?.id) fetchClientId()
  }, [user?.id])

  const { cliente, tope } = useClienteFiscal(clientId)
  const { facturaciones, acumulado, loading, crear } = useFacturacionMensual(clientId)

  const porcentaje = tope > 0 ? (acumulado.total / tope) * 100 : 0
  const { estado: estadoAlerta } = calcularEstadoAlerta(porcentaje)

  // Verificar si puede cargar (solo autónomo)
  const puedeCargar = cliente?.gestion_facturacion === 'autonomo'

  const handleCargar = (anio, mes) => {
    setMesSeleccionado({ anio, mes })
    setShowModal(true)
  }

  const handleGuardar = async (data) => {
    await crear({
      ...data,
      cargadoPor: user.id
    })
    setShowModal(false)
    setMesSeleccionado(null)
  }

  if (loading || !cliente) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  // Generar lista de últimos 12 meses
  const ultimosMeses = []
  const hoy = new Date()
  for (let i = 0; i < 12; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const anio = fecha.getFullYear()
    const mes = fecha.getMonth() + 1
    const facturacion = facturaciones.find(f => f.anio === anio && f.mes === mes)
    ultimosMeses.push({ anio, mes, facturacion })
  }

  return (
    <div className="space-y-6">
      {/* Situación actual */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tu situacion actual</h2>

        <div className="mb-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded font-medium">
              Categoria {cliente.categoria_monotributo}
            </span>
            <span>-</span>
            <span className="capitalize">{cliente.tipo_actividad}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-500">Facturado 12 meses</div>
              <div className="text-xl font-bold text-gray-900">{formatearMoneda(acumulado.total)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Tope categoria</div>
              <div className="text-xl font-bold text-gray-900">{formatearMoneda(tope)}</div>
            </div>
          </div>
        </div>

        <BarraProgresoTope
          facturado={acumulado.total}
          tope={tope}
          porcentaje={porcentaje}
          estadoAlerta={estadoAlerta}
        />
      </div>

      {/* Lista de meses */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Facturacion mensual</h2>
          {puedeCargar && (
            <button
              onClick={() => handleCargar(hoy.getFullYear(), hoy.getMonth() + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Cargar mes
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {ultimosMeses.map(({ anio, mes, facturacion }) => (
            <div key={`${anio}-${mes}`} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  {getNombreMes(mes)} {anio}
                </div>
                {facturacion ? (
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    {formatearMoneda(facturacion.monto_declarado)}
                    {facturacion.archivos_adjuntos?.length > 0 && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <FileText className="w-3 h-3" />
                        {facturacion.archivos_adjuntos.length}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-orange-500">Sin cargar</div>
                )}
              </div>

              {!facturacion && puedeCargar ? (
                <button
                  onClick={() => handleCargar(anio, mes)}
                  className="px-3 py-1.5 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                >
                  Cargar
                </button>
              ) : facturacion ? (
                <button className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
                  Ver
                </button>
              ) : (
                <span className="text-xs text-gray-400">La contadora lo carga</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {!puedeCargar && (
        <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
          Tu contadora se encarga de cargar tu facturacion. Si tenes dudas, contactala.
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <FormFacturacionMensual
          anio={mesSeleccionado?.anio}
          mes={mesSeleccionado?.mes}
          onClose={() => setShowModal(false)}
          onSave={handleGuardar}
          clientId={clientId}
          userId={user.id}
        />
      )}
    </div>
  )
}
