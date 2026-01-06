import { useState } from 'react'
import { X, Upload, FileText, Trash2, Plus } from 'lucide-react'
import { uploadFactura } from '../services/storageFacturasService'
import { formatearMoneda } from '../utils/formatters'
import { getNombreMes } from '../utils/calculosFacturacion'

const TIPOS_COMPROBANTE = [
  { value: 'FC', label: 'Factura', color: 'green' },
  { value: 'NC', label: 'Nota Credito', color: 'red' },
  { value: 'ND', label: 'Nota Debito', color: 'blue' }
]

const LETRAS = ['A', 'B', 'C', 'M', 'E']

export function FormCargaComprobante({
  clientId,
  userId,
  anio,
  mes,
  onClose,
  onSave
}) {
  const [comprobantes, setComprobantes] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Estado del comprobante actual
  const [fechaEmision, setFechaEmision] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [tipoComprobante, setTipoComprobante] = useState('FC')
  const [letraComprobante, setLetraComprobante] = useState('C')
  const [monto, setMonto] = useState('')
  const [receptorTipo, setReceptorTipo] = useState('consumidor_final')
  const [receptorRazonSocial, setReceptorRazonSocial] = useState('')
  const [receptorCuit, setReceptorCuit] = useState('')
  const [nota, setNota] = useState('')
  const [archivo, setArchivo] = useState(null)

  const limpiarFormulario = () => {
    setFechaEmision(new Date().toISOString().split('T')[0])
    setTipoComprobante('FC')
    setLetraComprobante('C')
    setMonto('')
    setReceptorTipo('consumidor_final')
    setReceptorRazonSocial('')
    setReceptorCuit('')
    setNota('')
    setArchivo(null)
  }

  const agregarComprobante = async () => {
    if (!monto || parseFloat(monto) <= 0) {
      setError('Ingresa un monto valido')
      return
    }

    if (receptorTipo === 'con_datos' && !receptorRazonSocial.trim()) {
      setError('Ingresa la razon social del receptor')
      return
    }

    setError(null)

    // Subir archivo si existe
    let archivoSubido = null
    if (archivo) {
      try {
        archivoSubido = await uploadFactura(archivo, userId, anio, mes)
      } catch (err) {
        setError('Error subiendo archivo: ' + err.message)
        return
      }
    }

    const nuevoComprobante = {
      fechaEmision,
      tipoComprobante,
      letraComprobante,
      monto: parseFloat(monto),
      cantidadComprobantes: 1,
      receptorTipo,
      receptorRazonSocial: receptorTipo === 'con_datos' ? receptorRazonSocial : null,
      receptorCuit: receptorTipo === 'con_datos' ? receptorCuit : null,
      nota: nota || null,
      archivosAdjuntos: archivoSubido ? [archivoSubido] : [],
      anio,
      mes,
      // Para mostrar en la lista temporal
      _display: {
        tipo: `${tipoComprobante}-${letraComprobante}`,
        receptor: receptorTipo === 'consumidor_final' ? 'Consumidor Final' : receptorRazonSocial,
        archivo: archivo?.name
      }
    }

    setComprobantes([...comprobantes, nuevoComprobante])
    limpiarFormulario()
  }

  const eliminarComprobante = (index) => {
    setComprobantes(comprobantes.filter((_, i) => i !== index))
  }

  const handleGuardar = async () => {
    // Prevenir doble click
    if (saving) return
    setSaving(true)

    // Si hay datos pendientes en el formulario, agregarlos automaticamente
    let comprobantesAGuardar = [...comprobantes]

    if (monto && parseFloat(monto) > 0) {
      // Validar receptor si es necesario
      if (receptorTipo === 'con_datos' && !receptorRazonSocial.trim()) {
        setError('Ingresa la razon social del receptor o cambia a Consumidor Final')
        setSaving(false)
        return
      }

      // Subir archivo si existe
      let archivoSubido = null
      if (archivo) {
        try {
          archivoSubido = await uploadFactura(archivo, userId, anio, mes)
        } catch (err) {
          setError('Error subiendo archivo: ' + err.message)
          setSaving(false)
          return
        }
      }

      // Agregar el comprobante pendiente
      comprobantesAGuardar.push({
        fechaEmision,
        tipoComprobante,
        letraComprobante,
        monto: parseFloat(monto),
        cantidadComprobantes: 1,
        receptorTipo,
        receptorRazonSocial: receptorTipo === 'con_datos' ? receptorRazonSocial : null,
        receptorCuit: receptorTipo === 'con_datos' ? receptorCuit : null,
        nota: nota || null,
        archivosAdjuntos: archivoSubido ? [archivoSubido] : [],
        anio,
        mes
      })
    }

    if (comprobantesAGuardar.length === 0) {
      setError('Ingresa al menos un comprobante')
      setSaving(false)
      return
    }

    try {
      setError(null)
      await onSave(comprobantesAGuardar)
      onClose()
    } catch (err) {
      console.error('Error guardando:', err)
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const totalFC = comprobantes.filter(c => c.tipoComprobante === 'FC').reduce((s, c) => s + c.monto, 0)
  const totalND = comprobantes.filter(c => c.tipoComprobante === 'ND').reduce((s, c) => s + c.monto, 0)
  const totalNC = comprobantes.filter(c => c.tipoComprobante === 'NC').reduce((s, c) => s + c.monto, 0)
  const totalNeto = totalFC + totalND - totalNC

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            Cargar - {getNombreMes(mes)} {anio}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
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
                        : 'border-blue-500 bg-blue-50 text-blue-700'
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
                    // Solo permitir numeros y maximo 11 digitos
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
              Adjuntar PDF (opcional)
            </label>
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
                <span className="text-sm text-gray-600">Seleccionar archivo</span>
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
              Nota (opcional)
            </label>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Descripcion breve..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Boton agregar */}
          <button
            type="button"
            onClick={agregarComprobante}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-violet-300 text-violet-600 rounded-lg hover:bg-violet-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar comprobante
          </button>

          {/* Lista de comprobantes agregados */}
          {comprobantes.length > 0 && (
            <div className="border-t pt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Comprobantes a guardar ({comprobantes.length})
              </h4>

              {comprobantes.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                        c.tipoComprobante === 'FC' ? 'bg-green-100 text-green-700' :
                        c.tipoComprobante === 'NC' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {c._display.tipo}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatearMoneda(c.monto)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {c._display.receptor}
                      {c._display.archivo && ` - ${c._display.archivo}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarComprobante(i)}
                    className="p-1 hover:bg-red-100 rounded text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Resumen */}
              <div className="bg-violet-50 p-3 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Facturas</span>
                  <span className="text-green-600">+{formatearMoneda(totalFC)}</span>
                </div>
                {totalND > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Notas Debito</span>
                    <span className="text-blue-600">+{formatearMoneda(totalND)}</span>
                  </div>
                )}
                {totalNC > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Notas Credito</span>
                    <span className="text-red-600">-{formatearMoneda(totalNC)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t border-violet-200 pt-1">
                  <span className="text-gray-900">Total Neto</span>
                  <span className="text-gray-900">{formatearMoneda(totalNeto)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Botones footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={saving || (comprobantes.length === 0 && (!monto || parseFloat(monto) <= 0))}
              className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar todo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
