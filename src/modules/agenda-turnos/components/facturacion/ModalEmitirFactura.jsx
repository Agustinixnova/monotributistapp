/**
 * Modal para Emitir Factura/NC/ND
 *
 * Permite emitir comprobantes de forma simple
 */

import { useState, useEffect } from 'react'
import {
  X,
  FileText,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  User,
  DollarSign,
  Calendar,
  FileCheck,
  ExternalLink
} from 'lucide-react'
import {
  TIPOS_COMPROBANTE,
  TIPOS_DOCUMENTO,
  CONCEPTOS,
  emitirFacturaC,
  emitirNotaCreditoC,
  emitirNotaDebitoC,
  getConfiguracionAfip,
  getNombreTipoComprobante,
  formatearNumeroComprobante,
  getLinkFacturaAfip
} from '../../services/afipService'

export default function ModalEmitirFactura({
  isOpen,
  onClose,
  duenioId,
  turno = null, // Opcional: si viene de un turno
  onFacturaEmitida
}) {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [emitiendo, setEmitiendo] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)

  // Datos del formulario
  const [form, setForm] = useState({
    tipoComprobante: TIPOS_COMPROBANTE.FACTURA_C,
    importeTotal: '',
    concepto: CONCEPTOS.SERVICIOS,
    receptorTipoDoc: TIPOS_DOCUMENTO.CONSUMIDOR_FINAL,
    receptorNroDoc: '',
    receptorNombre: '',
    descripcion: '',
    // Para NC y ND
    comprobanteAsociado: null
  })

  useEffect(() => {
    if (isOpen) {
      cargarConfiguracion()
      // Si viene de un turno, prellenar datos
      if (turno) {
        setForm(prev => ({
          ...prev,
          importeTotal: turno.precio_total?.toString() || '',
          descripcion: turno.servicios?.map(s => s.nombre).join(', ') || '',
          receptorNombre: turno.cliente?.nombre || ''
        }))
      }
    }
  }, [isOpen, duenioId, turno])

  const cargarConfiguracion = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getConfiguracionAfip(duenioId)
      setConfig(data)
      if (!data || !data.certificado_crt) {
        setError('Configurá AFIP antes de emitir facturas')
      }
    } catch (err) {
      setError('Error al cargar configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
    setError(null)
  }

  const handleEmitir = async () => {
    // Validaciones
    if (!form.importeTotal || parseFloat(form.importeTotal) <= 0) {
      setError('Ingresá un importe válido')
      return
    }

    if (form.receptorTipoDoc !== TIPOS_DOCUMENTO.CONSUMIDOR_FINAL && !form.receptorNroDoc) {
      setError('Ingresá el número de documento del receptor')
      return
    }

    // Validar comprobante asociado para NC y ND
    if ((form.tipoComprobante === TIPOS_COMPROBANTE.NOTA_CREDITO_C ||
         form.tipoComprobante === TIPOS_COMPROBANTE.NOTA_DEBITO_C) &&
        !form.comprobanteAsociado) {
      setError('Seleccioná el comprobante asociado')
      return
    }

    try {
      setEmitiendo(true)
      setError(null)

      const datos = {
        importeTotal: parseFloat(form.importeTotal),
        concepto: form.concepto,
        receptorTipoDoc: form.receptorTipoDoc,
        receptorNroDoc: form.receptorNroDoc || '0',
        receptorNombre: form.receptorNombre || 'Consumidor Final',
        descripcion: form.descripcion,
        turnoId: turno?.id,
        comprobanteAsociado: form.comprobanteAsociado
      }

      let resultado
      switch (form.tipoComprobante) {
        case TIPOS_COMPROBANTE.FACTURA_C:
          resultado = await emitirFacturaC(duenioId, datos)
          break
        case TIPOS_COMPROBANTE.NOTA_CREDITO_C:
          resultado = await emitirNotaCreditoC(duenioId, datos)
          break
        case TIPOS_COMPROBANTE.NOTA_DEBITO_C:
          resultado = await emitirNotaDebitoC(duenioId, datos)
          break
      }

      setResultado(resultado)
      if (onFacturaEmitida) {
        onFacturaEmitida(resultado)
      }
    } catch (err) {
      console.error('Error emitiendo:', err)
      setError(err.message || 'Error al emitir el comprobante')
    } finally {
      setEmitiendo(false)
    }
  }

  const cerrar = () => {
    setForm({
      tipoComprobante: TIPOS_COMPROBANTE.FACTURA_C,
      importeTotal: '',
      concepto: CONCEPTOS.SERVICIOS,
      receptorTipoDoc: TIPOS_DOCUMENTO.CONSUMIDOR_FINAL,
      receptorNroDoc: '',
      receptorNombre: '',
      descripcion: '',
      comprobanteAsociado: null
    })
    setResultado(null)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="font-heading font-semibold text-gray-900">
              {resultado ? 'Comprobante Emitido' : 'Emitir Comprobante'}
            </h2>
          </div>
          <button
            onClick={cerrar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          ) : resultado ? (
            // Resultado exitoso
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-heading font-semibold text-xl text-gray-900 mb-2">
                {getNombreTipoComprobante(resultado.factura.tipo)} Emitida
              </h3>
              <p className="text-2xl font-bold text-primary-600 mb-4">
                {formatearNumeroComprobante(resultado.factura.puntoVenta, resultado.factura.numero)}
              </p>

              <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">CAE:</span>
                  <span className="font-mono font-medium">{resultado.factura.cae}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Vencimiento CAE:</span>
                  <span className="font-medium">{resultado.factura.caeVencimiento}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Importe:</span>
                  <span className="font-medium">${resultado.factura.importeTotal.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Fecha:</span>
                  <span className="font-medium">{resultado.factura.fecha}</span>
                </div>
              </div>

              <a
                href={getLinkFacturaAfip(
                  config.cuit,
                  resultado.factura.tipo,
                  resultado.factura.puntoVenta,
                  resultado.factura.numero,
                  resultado.factura.cae
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Ver en AFIP
              </a>

              <button
                onClick={cerrar}
                className="w-full mt-6 bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700"
              >
                Cerrar
              </button>
            </div>
          ) : (
            // Formulario
            <div className="space-y-4">
              {/* Error de configuración */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Ambiente warning */}
              {config?.ambiente === 'testing' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">
                    Estás en modo <strong>Testing</strong>. Las facturas no tienen validez fiscal.
                  </p>
                </div>
              )}

              {/* Tipo de comprobante */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Comprobante
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { tipo: TIPOS_COMPROBANTE.FACTURA_C, label: 'Factura C' },
                    { tipo: TIPOS_COMPROBANTE.NOTA_CREDITO_C, label: 'NC C' },
                    { tipo: TIPOS_COMPROBANTE.NOTA_DEBITO_C, label: 'ND C' }
                  ].map(({ tipo, label }) => (
                    <button
                      key={tipo}
                      onClick={() => handleChange('tipoComprobante', tipo)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        form.tipoComprobante === tipo
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Importe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importe Total <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={form.importeTotal}
                    onChange={(e) => handleChange('importeTotal', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Concepto
                </label>
                <select
                  value={form.concepto}
                  onChange={(e) => handleChange('concepto', parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value={CONCEPTOS.SERVICIOS}>Servicios</option>
                  <option value={CONCEPTOS.PRODUCTOS}>Productos</option>
                  <option value={CONCEPTOS.PRODUCTOS_Y_SERVICIOS}>Productos y Servicios</option>
                </select>
              </div>

              {/* Receptor */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Datos del Receptor
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Documento
                    </label>
                    <select
                      value={form.receptorTipoDoc}
                      onChange={(e) => handleChange('receptorTipoDoc', parseInt(e.target.value))}
                      className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value={TIPOS_DOCUMENTO.CONSUMIDOR_FINAL}>Consumidor Final</option>
                      <option value={TIPOS_DOCUMENTO.DNI}>DNI</option>
                      <option value={TIPOS_DOCUMENTO.CUIT}>CUIT</option>
                      <option value={TIPOS_DOCUMENTO.CUIL}>CUIL</option>
                    </select>
                  </div>

                  {form.receptorTipoDoc !== TIPOS_DOCUMENTO.CONSUMIDOR_FINAL && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Documento
                      </label>
                      <input
                        type="text"
                        value={form.receptorNroDoc}
                        onChange={(e) => handleChange('receptorNroDoc', e.target.value.replace(/\D/g, ''))}
                        placeholder="12345678"
                        className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre (opcional)
                    </label>
                    <input
                      type="text"
                      value={form.receptorNombre}
                      onChange={(e) => handleChange('receptorNombre', e.target.value)}
                      placeholder="Nombre del cliente"
                      className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                  placeholder="Detalle del servicio o producto..."
                  rows={2}
                  className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Botón emitir */}
              <button
                onClick={handleEmitir}
                disabled={emitiendo || !config?.certificado_crt}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {emitiendo ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Emitiendo...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-5 h-5" />
                    Emitir {getNombreTipoComprobante(form.tipoComprobante)}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
