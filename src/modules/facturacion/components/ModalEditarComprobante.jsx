import { useState, useEffect } from 'react'
import { X, Edit, FileText, Trash2, Upload } from 'lucide-react'
import { updateCarga } from '../services/cargasService'
import { uploadFactura } from '../services/storageFacturasService'
import { formatearMoneda } from '../utils/formatters'
import { getNombreMes } from '../utils/calculosFacturacion'

const TIPOS_COMPROBANTE = [
  { value: 'FC', label: 'Factura', color: 'green' },
  { value: 'NC', label: 'Nota Credito', color: 'red' },
  { value: 'ND', label: 'Nota Debito', color: 'violet' }
]

const LETRAS = ['A', 'B', 'C', 'M', 'E']

export function ModalEditarComprobante({
  carga,
  userId,
  onClose,
  onSuccess
}) {
  const [fechaEmision, setFechaEmision] = useState('')
  const [tipoComprobante, setTipoComprobante] = useState('FC')
  const [letraComprobante, setLetraComprobante] = useState('C')
  const [monto, setMonto] = useState('')
  const [receptorTipo, setReceptorTipo] = useState('consumidor_final')
  const [receptorRazonSocial, setReceptorRazonSocial] = useState('')
  const [receptorCuit, setReceptorCuit] = useState('')
  const [nota, setNota] = useState('')
  const [notaContadora, setNotaContadora] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [archivoExistente, setArchivoExistente] = useState(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Pre-rellenar form con datos de la carga
  useEffect(() => {
    if (carga) {
      setFechaEmision(carga.fecha_emision || new Date().toISOString().split('T')[0])
      setTipoComprobante(carga.tipo_comprobante || 'FC')
      setLetraComprobante(carga.letra_comprobante || 'C')
      setMonto(carga.monto?.toString() || '')
      setReceptorTipo(carga.receptor_tipo || 'consumidor_final')
      setReceptorRazonSocial(carga.receptor_razon_social || '')
      setReceptorCuit(carga.receptor_cuit || '')
      setNota(carga.nota || '')
      setNotaContadora(carga.nota_contadora || '')

      // Archivo existente
      if (carga.archivos_adjuntos?.length > 0) {
        setArchivoExistente(carga.archivos_adjuntos[0])
      }
    }
  }, [carga])

  const handleGuardar = async () => {
    if (saving) return

    // Validaciones
    if (!monto || parseFloat(monto) <= 0) {
      setError('Ingresa un monto valido')
      return
    }

    if (receptorTipo === 'con_datos' && !receptorRazonSocial.trim()) {
      setError('Ingresa la razon social del receptor')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Subir nuevo archivo si existe
      let archivosAdjuntos = carga.archivos_adjuntos || []

      if (archivo) {
        const archivoSubido = await uploadFactura(archivo, userId, carga.anio, carga.mes)
        archivosAdjuntos = [archivoSubido]
      }

      // Actualizar carga
      const updateData = {
        fechaEmision,
        tipoComprobante,
        letraComprobante,
        monto: parseFloat(monto),
        receptorTipo,
        receptorRazonSocial: receptorTipo === 'con_datos' ? receptorRazonSocial : null,
        receptorCuit: receptorTipo === 'con_datos' ? receptorCuit : null,
        nota: nota || null,
        notaContadora: notaContadora || null,
        archivosAdjuntos: archivo ? archivosAdjuntos : undefined
      }

      await updateCarga(carga.id, updateData)

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Error actualizando:', err)
      setError(err.message || 'Error al actualizar el comprobante')
    } finally {
      setSaving(false)
    }
  }

  if (!carga) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
              <Edit className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Editar - {getNombreMes(carga.mes)} {carga.anio}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 space-y-4">
          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de emision
            </label>
            <input
              type="date"
              value={fechaEmision}
              onChange={(e) => setFechaEmision(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Tipo y Letra */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <div className="flex gap-1">
                {TIPOS_COMPROBANTE.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTipoComprobante(t.value)}
                    className={`flex-1 py-2 px-2 text-sm font-medium rounded-lg border-2 transition-colors ${
                      tipoComprobante === t.value
                        ? t.value === 'FC' ? 'border-green-500 bg-green-50 text-green-700'
                        : t.value === 'NC' ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {t.value}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Letra
              </label>
              <select
                value={letraComprobante}
                onChange={(e) => setLetraComprobante(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              >
                {LETRAS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Importe
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Receptor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receptor
            </label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setReceptorTipo('consumidor_final')}
                className={`flex-1 py-2 px-3 text-sm rounded-lg border-2 transition-colors ${
                  receptorTipo === 'consumidor_final'
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Consumidor Final
              </button>
              <button
                type="button"
                onClick={() => setReceptorTipo('con_datos')}
                className={`flex-1 py-2 px-3 text-sm rounded-lg border-2 transition-colors ${
                  receptorTipo === 'con_datos'
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Con datos fiscales
              </button>
            </div>

            {receptorTipo === 'con_datos' && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={receptorRazonSocial}
                  onChange={(e) => setReceptorRazonSocial(e.target.value)}
                  placeholder="Razon Social *"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                />
                <input
                  type="text"
                  value={receptorCuit}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, '').slice(0, 11)
                    setReceptorCuit(valor)
                  }}
                  placeholder="CUIT (opcional) - 11 digitos"
                  maxLength={11}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                />
              </div>
            )}
          </div>

          {/* Archivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adjuntar PDF
            </label>

            {/* Archivo existente */}
            {archivoExistente && !archivo && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">
                    Archivo actual: {archivoExistente.name || 'comprobante.pdf'}
                  </span>
                </div>
              </div>
            )}

            {/* Nuevo archivo */}
            {archivo ? (
              <div className="flex items-center justify-between p-3 bg-violet-50 rounded-lg">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-violet-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{archivo.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setArchivo(null)}
                  className="p-1 hover:bg-red-100 rounded text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-violet-400 transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {archivoExistente ? 'Cambiar archivo' : 'Seleccionar archivo'}
                </span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setArchivo(e.target.files[0])}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Nota */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nota
            </label>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Descripcion breve..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Nota Contadora (solo lectura visual, pero editable) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nota interna (contadora)
            </label>
            <input
              type="text"
              value={notaContadora}
              onChange={(e) => setNotaContadora(e.target.value)}
              placeholder="Observaciones internas..."
              className="w-full px-3 py-2 border border-amber-300 bg-amber-50 rounded-lg focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Botones footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
