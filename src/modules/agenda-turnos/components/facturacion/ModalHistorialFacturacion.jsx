/**
 * Modal de Historial de Facturación
 * Muestra todos los comprobantes emitidos para un turno (facturas y N/C)
 */

import { useState, useEffect } from 'react'
import { X, FileText, FileX2, Download, Eye, Loader2, Receipt, Clock, MessageCircle, AlertCircle } from 'lucide-react'
import { formatearMonto } from '../../utils/formatters'
import { formatearNumeroComprobante, getConfiguracionAfip, getNombreTipoComprobante } from '../../services/afipService'
import { generarFacturaPDF, descargarFacturaPDF } from '../../services/facturasPdfService'
import { getEffectiveUserId } from '../../../caja-diaria/services/empleadosService'
import { getNegocio } from '../../services/negocioService'
import { supabase } from '../../../../lib/supabase'
import { limpiarTelefono } from '../../utils/whatsappUtils'

// Tipos de comprobante
const TIPOS = {
  FACTURA_C: 11,
  NOTA_CREDITO_C: 13
}

export default function ModalHistorialFacturacion({
  isOpen,
  onClose,
  turno
}) {
  const [loading, setLoading] = useState(true)
  const [comprobantes, setComprobantes] = useState([])
  const [descargando, setDescargando] = useState(null)
  const [previsualizando, setPrevisualizando] = useState(null)
  const [compartiendo, setCompartiendo] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)

  // Verificar si el cliente tiene WhatsApp
  const clienteWhatsapp = turno?.cliente?.whatsapp || turno?.cliente?.telefono
  const tieneWhatsapp = !!clienteWhatsapp

  // Cargar historial de comprobantes para este turno
  useEffect(() => {
    if (isOpen && turno?.id) {
      cargarHistorial()
    }
  }, [isOpen, turno?.id])

  const cargarHistorial = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('agenda_facturas')
        .select('*')
        .eq('turno_id', turno.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComprobantes(data || [])
    } catch (err) {
      console.error('Error cargando historial:', err)
      setComprobantes([])
    } finally {
      setLoading(false)
    }
  }

  // Formatear fecha y hora en UTC-3
  const formatearFechaHora = (fechaISO) => {
    if (!fechaISO) return '-'

    const fecha = new Date(fechaISO)
    // Ajustar a UTC-3
    const fechaUTC3 = new Date(fecha.getTime() - (3 * 60 * 60 * 1000))

    const dia = fechaUTC3.getUTCDate().toString().padStart(2, '0')
    const mes = (fechaUTC3.getUTCMonth() + 1).toString().padStart(2, '0')
    const anio = fechaUTC3.getUTCFullYear()
    const hora = fechaUTC3.getUTCHours().toString().padStart(2, '0')
    const minutos = fechaUTC3.getUTCMinutes().toString().padStart(2, '0')

    return `${dia}/${mes}/${anio} ${hora}:${minutos}`
  }

  // Descargar PDF
  const handleDescargarPDF = async (comprobante) => {
    try {
      setDescargando(comprobante.id)

      const { userId } = await getEffectiveUserId()
      if (!userId) throw new Error('No hay usuario autenticado')

      const config = await getConfiguracionAfip(userId)
      if (!config) throw new Error('No hay configuración AFIP')

      const { data: negocio } = await getNegocio()

      // Formatear fecha de vencimiento CAE
      let caeVencimiento = comprobante.cae_vencimiento
      if (caeVencimiento && caeVencimiento.length === 8 && !caeVencimiento.includes('-')) {
        caeVencimiento = `${caeVencimiento.slice(0, 4)}-${caeVencimiento.slice(4, 6)}-${caeVencimiento.slice(6, 8)}`
      }

      const facturaParaPDF = {
        tipo_comprobante: comprobante.tipo_comprobante,
        punto_venta: comprobante.punto_venta,
        numero_comprobante: comprobante.numero_comprobante,
        fecha_comprobante: comprobante.fecha_comprobante,
        cae: comprobante.cae,
        cae_vencimiento: caeVencimiento,
        receptor_tipo_doc: comprobante.receptor_tipo_doc || 99,
        receptor_nro_doc: comprobante.receptor_nro_doc || '0',
        receptor_nombre: comprobante.receptor_nombre || turno?.nombreCliente || 'Consumidor Final',
        importe_total: comprobante.importe_total,
        descripcion: comprobante.descripcion,
        fecha_servicio_desde: comprobante.fecha_servicio_desde,
        fecha_servicio_hasta: comprobante.fecha_servicio_hasta
      }

      await descargarFacturaPDF(facturaParaPDF, config, negocio)
    } catch (error) {
      console.error('Error descargando PDF:', error)
      alert('Error al descargar el PDF: ' + error.message)
    } finally {
      setDescargando(null)
    }
  }

  // Previsualizar PDF directamente
  const handlePrevisualizar = async (comprobante) => {
    try {
      setPrevisualizando(comprobante.id)

      const { userId } = await getEffectiveUserId()
      if (!userId) throw new Error('No hay usuario autenticado')

      const config = await getConfiguracionAfip(userId)
      if (!config) throw new Error('No hay configuración AFIP')

      const { data: negocio } = await getNegocio()

      // Formatear fecha de vencimiento CAE
      let caeVencimiento = comprobante.cae_vencimiento
      if (caeVencimiento && caeVencimiento.length === 8 && !caeVencimiento.includes('-')) {
        caeVencimiento = `${caeVencimiento.slice(0, 4)}-${caeVencimiento.slice(4, 6)}-${caeVencimiento.slice(6, 8)}`
      }

      const facturaParaPDF = {
        tipo_comprobante: comprobante.tipo_comprobante,
        punto_venta: comprobante.punto_venta,
        numero_comprobante: comprobante.numero_comprobante,
        fecha_comprobante: comprobante.fecha_comprobante,
        cae: comprobante.cae,
        cae_vencimiento: caeVencimiento,
        receptor_tipo_doc: comprobante.receptor_tipo_doc || 99,
        receptor_nro_doc: comprobante.receptor_nro_doc || '0',
        receptor_nombre: comprobante.receptor_nombre || turno?.nombreCliente || 'Consumidor Final',
        importe_total: comprobante.importe_total,
        descripcion: comprobante.descripcion,
        fecha_servicio_desde: comprobante.fecha_servicio_desde,
        fecha_servicio_hasta: comprobante.fecha_servicio_hasta
      }

      const doc = await generarFacturaPDF(facturaParaPDF, config, negocio)
      const pdfBlob = doc.output('blob')
      const url = URL.createObjectURL(pdfBlob)
      setPdfUrl(url)
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el PDF: ' + error.message)
    } finally {
      setPrevisualizando(null)
    }
  }

  // Cerrar previsualización PDF
  const handleCerrarPDF = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }
  }

  // Cerrar modal completo
  const handleCerrar = () => {
    handleCerrarPDF()
    onClose()
  }

  // Compartir comprobante por WhatsApp
  const handleCompartirWhatsApp = async (comprobante) => {
    if (!tieneWhatsapp) {
      alert('El cliente no tiene WhatsApp configurado')
      return
    }

    try {
      setCompartiendo(comprobante.id)

      const { userId } = await getEffectiveUserId()
      if (!userId) throw new Error('No hay usuario autenticado')

      const config = await getConfiguracionAfip(userId)
      if (!config) throw new Error('No hay configuración AFIP')

      const { data: negocio } = await getNegocio()

      // Formatear fecha de vencimiento CAE
      let caeVencimiento = comprobante.cae_vencimiento
      if (caeVencimiento && caeVencimiento.length === 8 && !caeVencimiento.includes('-')) {
        caeVencimiento = `${caeVencimiento.slice(0, 4)}-${caeVencimiento.slice(4, 6)}-${caeVencimiento.slice(6, 8)}`
      }

      const facturaParaPDF = {
        tipo_comprobante: comprobante.tipo_comprobante,
        punto_venta: comprobante.punto_venta,
        numero_comprobante: comprobante.numero_comprobante,
        fecha_comprobante: comprobante.fecha_comprobante,
        cae: comprobante.cae,
        cae_vencimiento: caeVencimiento,
        receptor_tipo_doc: comprobante.receptor_tipo_doc || 99,
        receptor_nro_doc: comprobante.receptor_nro_doc || '0',
        receptor_nombre: comprobante.receptor_nombre || turno?.nombreCliente || 'Consumidor Final',
        importe_total: comprobante.importe_total,
        descripcion: comprobante.descripcion,
        fecha_servicio_desde: comprobante.fecha_servicio_desde,
        fecha_servicio_hasta: comprobante.fecha_servicio_hasta
      }

      // Generar PDF
      const doc = await generarFacturaPDF(facturaParaPDF, config, negocio)
      const pdfBlob = doc.output('blob')

      // Nombre del tipo de comprobante
      const tipoNombre = getNombreTipoComprobante(comprobante.tipo_comprobante)
      const numeroComp = formatearNumeroComprobante(comprobante.punto_venta, comprobante.numero_comprobante)
      const cuitEmisor = config?.cuit || ''
      const fileName = `${tipoNombre.replace(/ /g, '_')}_${numeroComp}_${cuitEmisor}.pdf`

      // Preparar mensaje de WhatsApp
      const telefono = limpiarTelefono(clienteWhatsapp)
      const montoFormateado = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
      }).format(comprobante.importe_total)

      console.log('Teléfono limpio:', telefono)

      // Descargar PDF y abrir WhatsApp Web directamente
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // Esperar un poco antes de abrir WhatsApp
      setTimeout(() => {
        URL.revokeObjectURL(url)
        const mensaje = `¡Hola! Te comparto tu ${tipoNombre} N° ${numeroComp} por ${montoFormateado}. El archivo PDF se descargó en tu dispositivo.`
        const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
        console.log('Abriendo WhatsApp:', whatsappUrl)
        window.open(whatsappUrl, '_blank')
      }, 500)

    } catch (error) {
      console.error('Error compartiendo por WhatsApp:', error)
      alert('Error al compartir: ' + error.message)
    } finally {
      setTimeout(() => {
        setCompartiendo(null)
      }, 1000)
    }
  }

  if (!isOpen || !turno) return null

  const esNotaCredito = (tipo) => tipo === TIPOS.NOTA_CREDITO_C

  // Si hay PDF para mostrar, renderizar visor
  if (pdfUrl) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCerrarPDF} />

        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" />
                <h3 className="font-heading font-semibold text-lg">
                  Previsualización
                </h3>
              </div>
              <button
                onClick={handleCerrarPDF}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PDF embebido */}
            <div className="flex-1 bg-gray-100">
              <iframe
                src={pdfUrl}
                className="w-full h-[70vh] border-0"
                title="Comprobante PDF"
              />
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-5 py-4 flex-shrink-0">
              <button
                onClick={handleCerrarPDF}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Volver al historial
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCerrar} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg">
                  Historial de Facturación
                </h3>
                <p className="text-white/80 text-sm">
                  {turno.nombreCliente}
                </p>
              </div>
            </div>
            <button
              onClick={handleCerrar}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-500">Cargando historial...</p>
              </div>
            ) : comprobantes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay comprobantes emitidos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comprobantes.map((comp) => {
                  const esNC = esNotaCredito(comp.tipo_comprobante)

                  return (
                    <div
                      key={comp.id}
                      className={`border rounded-xl p-4 ${
                        esNC
                          ? 'border-red-200 bg-red-50/50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {/* Tipo y número */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {esNC ? (
                            <FileX2 className="w-5 h-5 text-red-500" />
                          ) : (
                            <FileText className="w-5 h-5 text-blue-500" />
                          )}
                          <div>
                            <p className={`font-medium ${esNC ? 'text-red-700' : 'text-gray-900'}`}>
                              {getNombreTipoComprobante(comp.tipo_comprobante)}
                            </p>
                            <p className="text-sm font-mono text-gray-600">
                              {formatearNumeroComprobante(comp.punto_venta, comp.numero_comprobante)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${esNC ? 'text-red-600' : 'text-gray-900'}`}>
                            {esNC ? '- ' : ''}{formatearMonto(comp.importe_total)}
                          </p>
                        </div>
                      </div>

                      {/* Fecha y hora */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <Clock className="w-4 h-4" />
                        <span>{formatearFechaHora(comp.created_at)}</span>
                      </div>

                      {/* Si es N/C, mostrar qué factura anula */}
                      {esNC && comp.comprobante_asociado_nro && (
                        <p className="text-xs text-red-600 mb-3">
                          Anula Factura C {comp.comprobante_asociado_pto_vta?.toString().padStart(4, '0')}-{comp.comprobante_asociado_nro?.toString().padStart(8, '0')}
                        </p>
                      )}

                      {/* CAE */}
                      <div className="text-xs text-gray-500 mb-3">
                        CAE: {comp.cae}
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => handlePrevisualizar(comp)}
                          disabled={previsualizando === comp.id}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          {previsualizando === comp.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                          Ver PDF
                        </button>
                        <button
                          onClick={() => handleDescargarPDF(comp)}
                          disabled={descargando === comp.id}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 ${
                            esNC
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {descargando === comp.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          Descargar
                        </button>
                        {tieneWhatsapp && (
                          <button
                            onClick={() => handleCompartirWhatsApp(comp)}
                            disabled={compartiendo === comp.id}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                            title="Compartir por WhatsApp"
                          >
                            {compartiendo === comp.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MessageCircle className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4 flex-shrink-0 space-y-3">
            {/* Mensaje si no tiene WhatsApp */}
            {!tieneWhatsapp && comprobantes.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Completá el número de WhatsApp en la ficha del cliente para poder compartir comprobantes de forma rápida.
                </p>
              </div>
            )}
            <button
              onClick={handleCerrar}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
