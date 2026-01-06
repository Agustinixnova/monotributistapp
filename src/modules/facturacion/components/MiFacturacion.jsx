import { useState } from 'react'
import { ChevronDown, ChevronUp, Eye, ExternalLink, FileText, Plus } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { useFacturacionCliente } from '../hooks/useFacturacionCliente'
import { BarraProgresoTope } from './BarraProgresoTope'
import { ModalVisualizadorPDF } from './ModalVisualizadorPDF'
import { GraficoEvolucion } from './GraficoEvolucion'
import { FormCargaComprobante } from './FormCargaComprobante'
import { formatearMoneda } from '../utils/formatters'
import { calcularEstadoAlerta, getNombreMes } from '../utils/calculosFacturacion'
import { createCargasMultiples } from '../services/cargasService'
import { getSignedUrl } from '../services/storageFacturasService'

export function MiFacturacion() {
  const { user } = useAuth()
  const {
    clientId,
    cliente,
    tope,
    acumulado,
    resumenes,
    cargasPorMes,
    loading,
    error,
    refetch
  } = useFacturacionCliente(user?.id)

  const [mesExpandido, setMesExpandido] = useState(null)
  const [pdfSeleccionado, setPdfSeleccionado] = useState(null)
  const [showFormCarga, setShowFormCarga] = useState(false)
  const [mesSeleccionado, setMesSeleccionado] = useState(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Error: {error}
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="text-center py-12 text-gray-500">
        No se encontraron datos fiscales
      </div>
    )
  }

  const porcentaje = tope > 0 ? (acumulado?.neto || 0) / tope * 100 : 0
  const { estado: estadoAlerta } = calcularEstadoAlerta(porcentaje)

  // Verificar si puede cargar (solo autonomo)
  const puedeCargar = cliente?.gestion_facturacion === 'autonomo'

  // Generar lista de ultimos 12 meses
  const ultimosMeses = []
  const hoy = new Date()
  for (let i = 0; i < 12; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const anio = fecha.getFullYear()
    const mes = fecha.getMonth() + 1
    const key = `${anio}-${mes}`
    const resumen = resumenes.find(r => r.anio === anio && r.mes === mes)
    const cargasDelMes = cargasPorMes[key] || []
    ultimosMeses.push({ anio, mes, key, resumen, cargas: cargasDelMes })
  }

  const toggleMes = (key) => {
    setMesExpandido(mesExpandido === key ? null : key)
  }

  const handleCargar = (anio, mes) => {
    setMesSeleccionado({ anio, mes })
    setShowFormCarga(true)
  }

  const handleGuardarCargas = async (comprobantes) => {
    try {
      console.log('Guardando comprobantes:', comprobantes)
      console.log('clientId:', clientId, 'userId:', user.id)
      const result = await createCargasMultiples(comprobantes, clientId, user.id)
      console.log('Resultado:', result)
      await refetch()
      setShowFormCarga(false)
      setMesSeleccionado(null)
    } catch (err) {
      console.error('Error guardando cargas:', err)
      throw err // Re-lanzar para que FormCargaComprobante lo capture
    }
  }

  const getReceptorLabel = (carga) => {
    if (carga.receptor_tipo === 'consumidor_final') return 'Consumidor Final'
    if (carga.receptor_razon_social) {
      const cuit = carga.receptor_cuit ? ` (${carga.receptor_cuit})` : ''
      return `${carga.receptor_razon_social}${cuit}`
    }
    return '-'
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR')
  }

  const handleAbrirArchivo = async (archivo) => {
    try {
      const path = typeof archivo === 'string' ? archivo : archivo.path
      if (!path) return
      const url = await getSignedUrl(path, 3600)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Error abriendo archivo:', err)
      alert('Error al abrir el archivo')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Situacion actual */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Tu situacion actual</h2>

        <div className="flex flex-wrap items-center gap-2 text-gray-600 mb-4">
          <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded font-medium text-sm">
            Categoria {cliente.categoria_monotributo}
          </span>
          <span className="hidden sm:inline">-</span>
          <span className="capitalize text-sm">{cliente.tipo_actividad}</span>
        </div>

        {/* Cards de desglose */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-xs sm:text-sm text-green-600">Facturas</div>
            <div className="text-base sm:text-lg font-bold text-green-700">
              {formatearMoneda(acumulado?.facturas || 0)}
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-xs sm:text-sm text-red-600">Notas Credito</div>
            <div className="text-base sm:text-lg font-bold text-red-700">
              -{formatearMoneda(acumulado?.notasCredito || 0)}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs sm:text-sm text-blue-600">Notas Debito</div>
            <div className="text-base sm:text-lg font-bold text-blue-700">
              {formatearMoneda(acumulado?.notasDebito || 0)}
            </div>
          </div>
          <div className="bg-violet-50 rounded-lg p-3">
            <div className="text-xs sm:text-sm text-violet-600">Total Neto</div>
            <div className="text-base sm:text-lg font-bold text-violet-700">
              {formatearMoneda(acumulado?.neto || 0)}
            </div>
          </div>
        </div>

        {/* Disponible */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Te queda disponible</span>
            <span className="text-lg font-bold text-gray-900">
              {formatearMoneda(Math.max(0, tope - (acumulado?.neto || 0)))}
            </span>
          </div>
        </div>

        <BarraProgresoTope
          facturado={acumulado?.neto || 0}
          tope={tope}
          porcentaje={porcentaje}
          estadoAlerta={estadoAlerta}
        />
      </div>


      {/* Grafico de evolucion */}
      {resumenes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Evolucion mensual
          </h2>
          <GraficoEvolucion resumenes={resumenes} />
        </div>
      )}

      {/* Historial por mes */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Historial de facturacion</h2>
            {cliente.gestion_facturacion === 'contadora' && (
              <p className="text-xs text-gray-500 mt-1">Cargado por tu contadora</p>
            )}
          </div>
          {puedeCargar && (
            <button
              onClick={() => handleCargar(hoy.getFullYear(), hoy.getMonth() + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva carga
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {ultimosMeses.map(({ anio, mes, key, resumen, cargas }) => (
            <div key={key}>
              {/* Header del mes */}
              <button
                onClick={() => cargas.length > 0 && toggleMes(key)}
                className={`w-full p-4 flex items-center justify-between text-left transition-colors ${
                  cargas.length > 0 ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {getNombreMes(mes)} {anio}
                  </div>
                  {resumen ? (
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="text-green-600">FC: {formatearMoneda(resumen.total_facturas)}</span>
                      {resumen.total_notas_credito > 0 && (
                        <span className="text-red-600 ml-2">NC: -{formatearMoneda(resumen.total_notas_credito)}</span>
                      )}
                      {resumen.total_notas_debito > 0 && (
                        <span className="text-blue-600 ml-2">ND: +{formatearMoneda(resumen.total_notas_debito)}</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 mt-1">Sin facturacion</div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {resumen && (
                    <span className="font-semibold text-gray-900">
                      {formatearMoneda(resumen.total_neto)}
                    </span>
                  )}
                  {puedeCargar && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCargar(anio, mes)
                      }}
                      className="px-3 py-1.5 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                    >
                      {cargas.length > 0 ? 'Agregar' : 'Cargar'}
                    </button>
                  )}
                  {cargas.length > 0 && (
                    mesExpandido === key
                      ? <ChevronUp className="w-5 h-5 text-gray-400" />
                      : <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Detalle expandido */}
              {mesExpandido === key && cargas.length > 0 && (
                <div className="bg-gray-50 border-t border-gray-100">
                  <div className="divide-y divide-gray-100">
                    {cargas.map((carga) => (
                      <div key={carga.id} className="p-3 sm:p-4 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-500">
                              {formatearFecha(carga.fecha_emision)}
                            </span>
                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                              carga.tipo_comprobante === 'FC' ? 'bg-green-100 text-green-700' :
                              carga.tipo_comprobante === 'NC' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {carga.tipo_comprobante}-{carga.letra_comprobante}
                            </span>
                            <span className={`font-medium ${
                              carga.tipo_comprobante === 'NC' ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {carga.tipo_comprobante === 'NC' ? '-' : ''}{formatearMoneda(carga.monto)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 truncate mt-1">
                            {getReceptorLabel(carga)}
                          </div>
                        </div>

                        {/* Botones de accion */}
                        {carga.archivos_adjuntos?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setPdfSeleccionado(carga.archivos_adjuntos[0])
                              }}
                              className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                              title="Ver"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAbrirArchivo(carga.archivos_adjuntos[0])
                              }}
                              className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                              title="Abrir en nueva pestana"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mensaje para cliente dependiente */}
      {cliente.gestion_facturacion === 'contadora' && (
        <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
          <FileText className="w-4 h-4 inline mr-2" />
          Tu contadora se encarga de cargar tu facturacion. Si tenes dudas o queres agregar comprobantes, contactala.
        </div>
      )}

      {/* Modal visualizador PDF */}
      {pdfSeleccionado && (
        <ModalVisualizadorPDF
          archivo={pdfSeleccionado}
          onClose={() => setPdfSeleccionado(null)}
        />
      )}

      {/* Modal formulario carga */}
      {showFormCarga && mesSeleccionado && (
        <FormCargaComprobante
          clientId={clientId}
          userId={user.id}
          anio={mesSeleccionado.anio}
          mes={mesSeleccionado.mes}
          onClose={() => {
            setShowFormCarga(false)
            setMesSeleccionado(null)
          }}
          onSave={handleGuardarCargas}
        />
      )}
    </div>
  )
}
