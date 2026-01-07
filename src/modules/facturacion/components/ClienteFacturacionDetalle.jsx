import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, ChevronDown, ChevronUp, AlertTriangle, Info } from 'lucide-react'
import { Layout } from '../../../components/layout/Layout'
import { useAuth } from '../../../auth/hooks/useAuth'
import { useClienteFiscal } from '../hooks/useClienteFiscal'
import { BarraProgresoTope } from './BarraProgresoTope'
import { FormCargaComprobante } from './FormCargaComprobante'
import { ListaCargasMes } from './ListaCargasMes'
import { PanelNotasInternas } from './PanelNotasInternas'
import { formatearMoneda, formatearCUIT } from '../utils/formatters'
import { calcularEstadoAlerta, getNombreMes } from '../utils/calculosFacturacion'
import { getResumenesCliente, getAcumulado12Meses } from '../services/resumenService'
import {
  getCargasMes,
  createCargasMultiples,
  deleteCarga,
  marcarComprobanteOk,
  marcarComprobanteObservado,
  marcarTodosOkMes,
  cerrarMesFacturacion
} from '../services/cargasService'

export function ClienteFacturacionDetalle() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { cliente, tope, loading: loadingCliente } = useClienteFiscal(clientId)

  const [resumenes, setResumenes] = useState([])
  const [acumulado, setAcumulado] = useState({ neto: 0, facturas: 0, notasCredito: 0, notasDebito: 0 })
  const [loadingFacturacion, setLoadingFacturacion] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [mesEditar, setMesEditar] = useState(null)
  const [mesExpandido, setMesExpandido] = useState(null)
  const [cargasMes, setCargasMes] = useState([])
  const [loadingCargas, setLoadingCargas] = useState(false)
  const [loadingAccion, setLoadingAccion] = useState(false)
  const [showDatosFiscales, setShowDatosFiscales] = useState(false)

  // Cargar datos
  useEffect(() => {
    if (!clientId) return

    const cargarDatos = async () => {
      try {
        setLoadingFacturacion(true)
        const [resumenesData, acumuladoData] = await Promise.all([
          getResumenesCliente(clientId, 12),
          getAcumulado12Meses(clientId)
        ])
        setResumenes(resumenesData)
        setAcumulado(acumuladoData)
      } catch (err) {
        console.error('Error cargando facturacion:', err)
      } finally {
        setLoadingFacturacion(false)
      }
    }

    cargarDatos()
  }, [clientId])

  const loading = loadingCliente || loadingFacturacion

  const porcentaje = tope > 0 ? (acumulado.neto / tope) * 100 : 0
  const { estado: estadoAlerta } = calcularEstadoAlerta(porcentaje)

  const handleCargar = (anio, mes) => {
    setMesEditar({ anio, mes })
    setShowModal(true)
  }

  const handleGuardar = async (comprobantes) => {
    await createCargasMultiples(comprobantes, clientId, user.id)
    // Recargar datos
    const [resumenesData, acumuladoData] = await Promise.all([
      getResumenesCliente(clientId, 12),
      getAcumulado12Meses(clientId)
    ])
    setResumenes(resumenesData)
    setAcumulado(acumuladoData)
    // Si el mes expandido es el mismo que se cargó, recargar cargas
    if (mesExpandido && mesEditar.anio === mesExpandido.anio && mesEditar.mes === mesExpandido.mes) {
      const cargasData = await getCargasMes(clientId, mesExpandido.anio, mesExpandido.mes)
      setCargasMes(cargasData)
    }
    setShowModal(false)
    setMesEditar(null)
  }

  const handleExpandirMes = async (anio, mes) => {
    if (mesExpandido?.anio === anio && mesExpandido?.mes === mes) {
      setMesExpandido(null)
      setCargasMes([])
      return
    }

    setMesExpandido({ anio, mes })
    setLoadingCargas(true)
    try {
      const data = await getCargasMes(clientId, anio, mes)
      setCargasMes(data)
    } catch (err) {
      console.error('Error cargando cargas del mes:', err)
    } finally {
      setLoadingCargas(false)
    }
  }

  // Recargar datos del mes expandido
  const recargarMesExpandido = async () => {
    if (!mesExpandido) return
    const [resumenesData, acumuladoData, cargasData] = await Promise.all([
      getResumenesCliente(clientId, 12),
      getAcumulado12Meses(clientId),
      getCargasMes(clientId, mesExpandido.anio, mesExpandido.mes)
    ])
    setResumenes(resumenesData)
    setAcumulado(acumuladoData)
    setCargasMes(cargasData)
  }

  // Handlers para el nuevo sistema de revision
  const handleMarcarOk = async (cargaId) => {
    try {
      setLoadingAccion(true)
      await marcarComprobanteOk(cargaId, user.id)
      await recargarMesExpandido()
    } catch (err) {
      console.error('Error marcando OK:', err)
      alert('Error al marcar como OK')
    } finally {
      setLoadingAccion(false)
    }
  }

  const handleMarcarObservado = async (cargaId, nota) => {
    try {
      setLoadingAccion(true)
      await marcarComprobanteObservado(cargaId, user.id, nota)
      await recargarMesExpandido()
    } catch (err) {
      console.error('Error agregando observacion:', err)
      alert('Error al agregar observacion')
    } finally {
      setLoadingAccion(false)
    }
  }

  const handleMarcarTodosOk = async () => {
    if (!mesExpandido) return
    try {
      setLoadingAccion(true)
      await marcarTodosOkMes(clientId, mesExpandido.anio, mesExpandido.mes, user.id)
      await recargarMesExpandido()
    } catch (err) {
      console.error('Error marcando todos OK:', err)
      alert('Error al marcar todos como OK')
    } finally {
      setLoadingAccion(false)
    }
  }

  const handleCerrarMes = async () => {
    if (!mesExpandido) return
    try {
      setLoadingAccion(true)
      await cerrarMesFacturacion(clientId, mesExpandido.anio, mesExpandido.mes, user.id)
      await recargarMesExpandido()
    } catch (err) {
      console.error('Error cerrando mes:', err)
      alert(err.message || 'Error al cerrar el mes')
    } finally {
      setLoadingAccion(false)
    }
  }

  const handleEliminarCarga = async (cargaId) => {
    try {
      setLoadingAccion(true)
      await deleteCarga(cargaId)
      await recargarMesExpandido()
    } catch (err) {
      console.error('Error eliminando:', err)
      alert('Error al eliminar: ' + err.message)
    } finally {
      setLoadingAccion(false)
    }
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

  // Generar lista de últimos 12 meses con sus resúmenes
  const ultimosMeses = []
  const hoy = new Date()
  for (let i = 0; i < 12; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const anio = fecha.getFullYear()
    const mes = fecha.getMonth() + 1
    const resumen = resumenes.find(r => r.anio === anio && r.mes === mes)
    ultimosMeses.push({ anio, mes, resumen })
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

          {/* Datos fiscales expandibles */}
          <div className="mt-4">
            <button
              onClick={() => setShowDatosFiscales(!showDatosFiscales)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <Info className="w-4 h-4" />
              <span>Datos fiscales</span>
              {showDatosFiscales ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showDatosFiscales && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {/* Fechas importantes */}
                  <div>
                    <span className="text-gray-500">Alta Monotributo:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {cliente.fecha_alta_monotributo
                        ? new Date(cliente.fecha_alta_monotributo).toLocaleDateString('es-AR')
                        : <span className="text-gray-400">No registrada</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ultima recategorizacion:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {cliente.fecha_ultima_recategorizacion
                        ? new Date(cliente.fecha_ultima_recategorizacion).toLocaleDateString('es-AR')
                        : <span className="text-gray-400">No registrada</span>}
                    </span>
                  </div>

                  {/* Actividad AFIP */}
                  <div className="sm:col-span-2">
                    <span className="text-gray-500">Actividad AFIP:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {cliente.codigo_actividad_afip ? (
                        <>
                          <span className="font-mono bg-gray-200 px-1 rounded">{cliente.codigo_actividad_afip}</span>
                          {cliente.descripcion_actividad_afip && (
                            <span className="ml-1">- {cliente.descripcion_actividad_afip}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">No registrada</span>
                      )}
                    </span>
                  </div>

                  {/* Punto de venta */}
                  <div>
                    <span className="text-gray-500">Punto de venta:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {cliente.punto_venta_afip ? (
                        <span className="font-mono bg-violet-100 text-violet-700 px-2 py-0.5 rounded">
                          {String(cliente.punto_venta_afip).padStart(5, '0')}
                        </span>
                      ) : (
                        <span className="text-gray-400">No registrado</span>
                      )}
                    </span>
                  </div>

                  {/* Ingresos Brutos */}
                  <div>
                    <span className="text-gray-500">Ingresos Brutos:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {cliente.numero_iibb ? (
                        <>
                          <span className="font-mono">{cliente.numero_iibb}</span>
                          {cliente.regimen_iibb && (
                            <span className="ml-1 text-xs text-gray-500">
                              ({cliente.regimen_iibb === 'convenio_multilateral' ? 'Conv. Multilateral' :
                                cliente.regimen_iibb === 'simplificado' ? 'Simplificado' :
                                cliente.regimen_iibb === 'local' ? 'Local' :
                                cliente.regimen_iibb === 'exento' ? 'Exento' : cliente.regimen_iibb})
                            </span>
                          )}
                        </>
                      ) : cliente.regimen_iibb === 'exento' ? (
                        <span className="text-green-600">Exento</span>
                      ) : cliente.regimen_iibb === 'no_inscripto' ? (
                        <span className="text-orange-600">No inscripto</span>
                      ) : (
                        <span className="text-gray-400">No registrado</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Barra de progreso */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Acumulado ultimos 12 meses
            </h3>
            <BarraProgresoTope
              facturado={acumulado.neto}
              tope={tope}
              porcentaje={porcentaje}
              estadoAlerta={estadoAlerta}
            />
          </div>

          {/* Desglose FC/NC/ND + Total */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-green-600 font-medium">Facturas</div>
              <div className="text-green-700 font-semibold">{formatearMoneda(acumulado.facturas)}</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="text-red-600 font-medium">Notas Credito</div>
              <div className="text-red-700 font-semibold">-{formatearMoneda(acumulado.notasCredito)}</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-blue-600 font-medium">Notas Debito</div>
              <div className="text-blue-700 font-semibold">{formatearMoneda(acumulado.notasDebito)}</div>
            </div>
            <div className="p-3 bg-violet-50 rounded-lg">
              <div className="text-violet-600 font-medium">Total Neto</div>
              <div className="text-violet-700 font-bold">{formatearMoneda(acumulado.neto)}</div>
            </div>
          </div>
        </div>

        {/* Panel de notas internas - Solo visible para contadora */}
        <PanelNotasInternas
          clientId={clientId}
          mesActivo={mesExpandido ? { anio: mesExpandido.anio, mes: mesExpandido.mes } : null}
        />

        {/* Lista de meses */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Facturacion mensual</h2>
            <button
              onClick={() => handleCargar(hoy.getFullYear(), hoy.getMonth() + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" />
              Cargar
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {ultimosMeses.map(({ anio, mes, resumen }) => {
              const isExpanded = mesExpandido?.anio === anio && mesExpandido?.mes === mes
              const tieneCargas = resumen && resumen.cantidad_comprobantes > 0

              return (
                <div key={`${anio}-${mes}`}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {getNombreMes(mes)} {anio}
                          </span>
                          {resumen?.estado === 'cerrado' && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              Cerrado
                            </span>
                          )}
                        </div>

                        {resumen ? (
                          <div className="mt-1 flex items-center gap-3 text-sm">
                            <span className="text-gray-900 font-medium">
                              Neto: {formatearMoneda(resumen.total_neto)}
                            </span>
                            <span className="text-gray-500">
                              ({resumen.cantidad_comprobantes} comp.)
                            </span>
                            {parseFloat(resumen.total_notas_credito) > 0 && (
                              <span className="text-red-500 text-xs">
                                NC: -{formatearMoneda(resumen.total_notas_credito)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="mt-1 text-sm text-orange-500">Sin cargar</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {resumen ? (
                          <>
                            {/* Indicador de observaciones */}
                            {resumen.estado_revision === 'observado' && (
                              <span className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                                <AlertTriangle className="w-3 h-3" />
                                Observado
                              </span>
                            )}

                            {/* Expandir para ver cargas */}
                            {tieneCargas && (
                              <button
                                onClick={() => handleExpandirMes(anio, mes)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            )}

                            {/* Agregar más cargas */}
                            {resumen.estado !== 'cerrado' && (
                              <button
                                onClick={() => handleCargar(anio, mes)}
                                className="p-2 text-violet-500 hover:bg-violet-50 rounded"
                              >
                                <Plus className="w-4 h-4" />
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
                    {resumen?.nota_revision && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-700">
                        Nota: {resumen.nota_revision}
                      </div>
                    )}
                  </div>

                  {/* Detalle de cargas expandido */}
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      {loadingCargas ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-600"></div>
                        </div>
                      ) : (
                        <ListaCargasMes
                          cargas={cargasMes}
                          resumen={resumen}
                          onMarcarOk={handleMarcarOk}
                          onMarcarObservado={handleMarcarObservado}
                          onMarcarTodosOk={handleMarcarTodosOk}
                          onCerrarMes={handleCerrarMes}
                          onEliminar={handleEliminarCarga}
                          esContadora={true}
                          loading={loadingAccion}
                        />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal de carga */}
      {showModal && (
        <FormCargaComprobante
          clientId={clientId}
          userId={user.id}
          anio={mesEditar.anio}
          mes={mesEditar.mes}
          onClose={() => {
            setShowModal(false)
            setMesEditar(null)
          }}
          onSave={handleGuardar}
        />
      )}
    </Layout>
  )
}
