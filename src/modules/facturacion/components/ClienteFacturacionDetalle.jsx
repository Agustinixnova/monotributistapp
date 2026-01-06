import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Check, FileText, Edit2 } from 'lucide-react'
import { Layout } from '../../../components/layout/Layout'
import { useAuth } from '../../../auth/hooks/useAuth'
import { useClienteFiscal } from '../hooks/useClienteFiscal'
import { useFacturacionMensual } from '../hooks/useFacturacionMensual'
import { BarraProgresoTope } from './BarraProgresoTope'
import { FormFacturacionMensual } from './FormFacturacionMensual'
import { formatearMoneda, formatearCUIT } from '../utils/formatters'
import { calcularEstadoAlerta, getNombreMes } from '../utils/calculosFacturacion'

export function ClienteFacturacionDetalle() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { cliente, tope, loading: loadingCliente } = useClienteFiscal(clientId)
  const {
    facturaciones,
    acumulado,
    loading: loadingFacturacion,
    marcarRevisado,
    crear,
    actualizar
  } = useFacturacionMensual(clientId)

  const [showModal, setShowModal] = useState(false)
  const [mesEditar, setMesEditar] = useState(null)

  const loading = loadingCliente || loadingFacturacion

  const porcentaje = tope > 0 ? (acumulado.total / tope) * 100 : 0
  const { estado: estadoAlerta } = calcularEstadoAlerta(porcentaje)

  const handleCargar = (anio, mes, facturacionExistente = null) => {
    setMesEditar({ anio, mes, existente: facturacionExistente })
    setShowModal(true)
  }

  const handleRevisar = async (facturacionId) => {
    await marcarRevisado(facturacionId, user.id)
  }

  const handleGuardar = async (data) => {
    if (mesEditar.existente) {
      await actualizar(mesEditar.existente.id, data)
    } else {
      await crear({
        ...data,
        cargadoPor: user.id
      })
    }
    setShowModal(false)
    setMesEditar(null)
  }

  if (loading) {
    return (
      <Layout title="Cargando...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
      </Layout>
    )
  }

  if (!cliente) {
    return (
      <Layout title="Error">
        <div className="text-center py-12 text-gray-500">
          Cliente no encontrado
        </div>
      </Layout>
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
    <Layout title="Detalle facturacion">
      <div className="space-y-6">
        {/* Header con botón volver */}
        <button
          onClick={() => navigate('/facturacion')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a lista
        </button>

        {/* Info del cliente */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {cliente.user ? `${cliente.user.nombre || ''} ${cliente.user.apellido || ''}`.trim() || cliente.razon_social : cliente.razon_social}
              </h1>
              <p className="text-gray-500">
                CUIT: {formatearCUIT(cliente.cuit)} | {cliente.tipo_actividad} |
                {cliente.gestion_facturacion === 'autonomo' ? ' Autonomo' : ' Dependiente'}
              </p>
            </div>
            <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-lg font-semibold">
              Cat. {cliente.categoria_monotributo}
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Acumulado ultimos 12 meses
            </h3>
            <BarraProgresoTope
              facturado={acumulado.total}
              tope={tope}
              porcentaje={porcentaje}
              estadoAlerta={estadoAlerta}
            />
          </div>
        </div>

        {/* Lista de meses */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Facturacion mensual</h2>
            <button
              onClick={() => handleCargar(hoy.getFullYear(), hoy.getMonth() + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" />
              Cargar mes
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {ultimosMeses.map(({ anio, mes, facturacion }) => (
              <div key={`${anio}-${mes}`} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {getNombreMes(mes)} {anio}
                      </span>
                      {facturacion?.estado === 'cerrado' && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          Cerrado
                        </span>
                      )}
                    </div>

                    {facturacion ? (
                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                        <span>{formatearMoneda(facturacion.monto_declarado)}</span>
                        {facturacion.monto_ajustado && facturacion.monto_ajustado !== facturacion.monto_declarado && (
                          <span className="text-violet-600">
                            Ajustado: {formatearMoneda(facturacion.monto_ajustado)}
                          </span>
                        )}
                        {facturacion.archivos_adjuntos?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {facturacion.archivos_adjuntos.length}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 text-sm text-orange-500">Sin cargar</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {facturacion ? (
                      <>
                        {/* Estado de revisión */}
                        {facturacion.estado_revision === 'pendiente' && (
                          <button
                            onClick={() => handleRevisar(facturacion.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <Check className="w-4 h-4" />
                            Marcar revisado
                          </button>
                        )}
                        {facturacion.estado_revision === 'revisado' && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                            Revisado
                          </span>
                        )}

                        {/* Editar (solo si no está cerrado) */}
                        {facturacion.estado !== 'cerrado' && (
                          <button
                            onClick={() => handleCargar(anio, mes, facturacion)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => handleCargar(anio, mes)}
                        className="px-3 py-1.5 text-sm text-violet-600 hover:bg-violet-50 rounded-lg"
                      >
                        Cargar
                      </button>
                    )}
                  </div>
                </div>

                {/* Nota de revisión */}
                {facturacion?.nota_revision && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-700">
                    Nota: {facturacion.nota_revision}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <FormFacturacionMensual
          anio={mesEditar.anio}
          mes={mesEditar.mes}
          existente={mesEditar.existente}
          onClose={() => {
            setShowModal(false)
            setMesEditar(null)
          }}
          onSave={handleGuardar}
          clientId={clientId}
          userId={user.id}
        />
      )}
    </Layout>
  )
}
