import { useState, useEffect, useRef } from 'react'
import { X, CreditCard, Receipt, Send, Building, Banknote, CircleDollarSign, Info, Upload, FileText, Trash2, Loader2 } from 'lucide-react'
import { Modal, AlertModal, ConfirmModal } from '../../../components/ui/Modal'
import { getClienteDetalle, actualizarCamposCliente } from '../services/carteraService'
import {
  getInstruccionesMesActual,
  guardarInstrucciones,
  generarTextoInstrucciones,
  METODOS_PAGO
} from '../../facturacion/services/instruccionesPagoService'
import { crearConversacionConDestinatarios } from '../../buzon/services/buzonService'
import { calcularMontoCuota } from '../../facturacion/services/cuotaService'
import { calcularIibbEstimado, getFacturacionMesAnterior } from '../../facturacion/services/iibbService'
import { createNotification } from '../../notificaciones/services/clientNotificationsService'
import { useAuth } from '../../../auth/hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { formatearMoneda } from '../../facturacion/utils/formatters'

const METODOS = [
  { value: 'debito_automatico', label: 'Debito automatico', icon: Building },
  { value: 'vep', label: 'VEP', icon: CreditCard },
  { value: 'mercado_pago', label: 'Mercado Pago', icon: CircleDollarSign },
  { value: 'efectivo', label: 'Efectivo', icon: Banknote }
]

// Subir archivo de boleta a Supabase Storage
async function subirBoleta(file, clientId, tipo) {
  const fileExt = file.name.split('.').pop().toLowerCase()
  const timestamp = Date.now()
  const fileName = `${clientId}/${tipo}_${timestamp}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('buzon-adjuntos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type
    })

  if (uploadError) throw uploadError

  // Obtener URL pública
  const { data } = supabase.storage
    .from('buzon-adjuntos')
    .getPublicUrl(fileName)

  return data.publicUrl
}

function SeccionInstrucciones({ tipo, titulo, icono: Icono, datos, onChange, onCambioMetodo, regimen, clientId, montoCalculado }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  // No mostrar IIBB si el cliente no está inscrito en Local o CM
  if (tipo === 'iibb' && regimen !== 'local' && regimen !== 'convenio_multilateral') {
    return null
  }

  const colorClase = tipo === 'monotributo'
    ? 'border-violet-200 bg-violet-50'
    : 'border-blue-200 bg-blue-50'

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      alert('Solo se permiten archivos PDF o imagenes (JPG, PNG)')
      return
    }

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no puede superar los 5MB')
      return
    }

    try {
      setUploading(true)
      const url = await subirBoleta(file, clientId, tipo)
      onChange({ ...datos, efectivo_boleta_url: url, efectivo_boleta_nombre: file.name })
    } catch (err) {
      console.error('Error subiendo boleta:', err)
      alert('Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveBoleta = () => {
    onChange({ ...datos, efectivo_boleta_url: null, efectivo_boleta_nombre: null })
  }

  return (
    <div className={`rounded-lg border-2 ${colorClase} p-4`}>
      <div className="flex items-center gap-2 mb-4">
        <Icono className="w-5 h-5" />
        <h4 className="font-semibold text-gray-900">{titulo}</h4>
      </div>

      {/* Selector de método */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Metodo de pago
        </label>
        <div className="grid grid-cols-2 gap-2">
          {METODOS.map(m => (
            <button
              key={m.value}
              type="button"
              onClick={() => onCambioMetodo ? onCambioMetodo(m.value) : onChange({ ...datos, metodo_pago: m.value })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                datos.metodo_pago === m.value
                  ? 'bg-white border-gray-400 shadow-sm'
                  : 'bg-white/50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <m.icon className="w-4 h-4" />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campos según método */}
      <div className="space-y-3">
        {datos.metodo_pago === 'debito_automatico' && (
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              Asegurate de tener saldo en tu cuenta para que se debite correctamente. En caso de no contar con saldo, se generara una deuda y se sumaran intereses.
            </p>
          </div>
        )}

        {datos.metodo_pago === 'vep' && (
          <>
            {/* Monto de la cuota (read-only) */}
            {montoCalculado > 0 && (
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Monto a pagar:</p>
                <p className="text-2xl font-bold text-gray-900">{formatearMoneda(montoCalculado)}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Numero de VEP (11 digitos) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={11}
                value={datos.vep_numero || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 11)
                  onChange({ ...datos, vep_numero: value })
                }}
                placeholder="00000000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono tracking-wider"
              />
              {datos.vep_numero && datos.vep_numero.length < 11 && (
                <p className="text-xs text-amber-600 mt-1">
                  Faltan {11 - datos.vep_numero.length} digitos
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fecha vencimiento *
              </label>
              <input
                type="date"
                value={datos.vep_vencimiento || ''}
                onChange={(e) => onChange({ ...datos, vep_vencimiento: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
          </>
        )}

        {datos.metodo_pago === 'mercado_pago' && (
          <>
            {/* Monto de la cuota (read-only) */}
            {montoCalculado > 0 && (
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Monto a pagar:</p>
                <p className="text-2xl font-bold text-gray-900">{formatearMoneda(montoCalculado)}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Numero de Mercado Pago (11 digitos) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={11}
                value={datos.mercadopago_numero || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 11)
                  onChange({ ...datos, mercadopago_numero: value })
                }}
                placeholder="00000000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono tracking-wider"
              />
              {datos.mercadopago_numero && datos.mercadopago_numero.length < 11 && (
                <p className="text-xs text-amber-600 mt-1">
                  Faltan {11 - datos.mercadopago_numero.length} digitos
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fecha vencimiento *
              </label>
              <input
                type="date"
                value={datos.mercadopago_vencimiento || ''}
                onChange={(e) => onChange({ ...datos, mercadopago_vencimiento: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
          </>
        )}

        {datos.metodo_pago === 'efectivo' && (
          <>
            {/* Monto de la cuota (read-only) */}
            {montoCalculado > 0 && (
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Monto a pagar:</p>
                <p className="text-2xl font-bold text-gray-900">{formatearMoneda(montoCalculado)}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Codigo de pago electronico (CPE) *
              </label>
              <input
                type="text"
                value={datos.cpe_codigo || ''}
                onChange={(e) => onChange({ ...datos, cpe_codigo: e.target.value })}
                placeholder="Codigo de pago..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              />
            </div>

            {/* Subir boleta de pago */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Boleta de pago (opcional)
              </label>
              {datos.efectivo_boleta_url ? (
                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="flex-1 text-sm text-gray-700 truncate">
                    {datos.efectivo_boleta_nombre || 'Boleta adjunta'}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveBoleta}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Adjuntar boleta (PDF o imagen)
                    </>
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </>
        )}

        {/* Notas (siempre disponible) */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Notas adicionales (opcional)
          </label>
          <textarea
            value={datos.notas || ''}
            onChange={(e) => onChange({ ...datos, notas: e.target.value })}
            placeholder="Informacion adicional para el cliente..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
          />
        </div>
      </div>
    </div>
  )
}

export function ModalGenerarInstruccionesPago({ isOpen, onClose, clientId, onSave }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cliente, setCliente] = useState(null)
  const [enviarBuzon, setEnviarBuzon] = useState(true)
  const [modalError, setModalError] = useState({ isOpen: false, message: '' })
  const [modalConfirmMetodo, setModalConfirmMetodo] = useState({ isOpen: false, nuevoMetodo: null, tipo: null })
  const [metodoOriginalMonotributo, setMetodoOriginalMonotributo] = useState(null)
  const [montoMonotributo, setMontoMonotributo] = useState(0)
  const [montoIibb, setMontoIibb] = useState(0)

  // Datos de cada sección
  const [datosMonotributo, setDatosMonotributo] = useState({
    metodo_pago: 'vep',
    vep_numero: '',
    vep_monto: null,
    vep_vencimiento: null,
    mercadopago_numero: '',
    mercadopago_vencimiento: null,
    cpe_codigo: '',
    efectivo_boleta_url: null,
    efectivo_boleta_nombre: null,
    notas: ''
  })

  const [datosIibb, setDatosIibb] = useState({
    metodo_pago: 'vep',
    vep_numero: '',
    vep_monto: null,
    vep_vencimiento: null,
    mercadopago_numero: '',
    mercadopago_vencimiento: null,
    cpe_codigo: '',
    efectivo_boleta_url: null,
    efectivo_boleta_nombre: null,
    notas: ''
  })

  const mesActual = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  // Cargar datos del cliente e instrucciones existentes
  useEffect(() => {
    if (isOpen && clientId) {
      loadData()
    }
  }, [isOpen, clientId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Cargar cliente
      const clienteData = await getClienteDetalle(clientId)
      setCliente(clienteData)

      console.log('ModalInstrucciones - Cliente:', {
        metodo_pago_monotributo: clienteData.metodo_pago_monotributo,
        clienteData
      })

      // Calcular montos
      // 1. Monto Monotributo
      if (clienteData.categoria_monotributo) {
        const { data: categoriaData } = await supabase
          .from('monotributo_categorias')
          .select('*')
          .eq('categoria', clienteData.categoria_monotributo)
          .is('vigente_hasta', null)
          .single()

        if (categoriaData) {
          const montoCalc = calcularMontoCuota(
            categoriaData,
            clienteData.tipo_actividad,
            clienteData.trabaja_relacion_dependencia
          )
          setMontoMonotributo(montoCalc)
        }
      }

      // 2. Monto IIBB estimado (si aplica)
      const tieneIibbActivo = clienteData.regimen_iibb === 'local' || clienteData.regimen_iibb === 'convenio_multilateral'
      if (tieneIibbActivo) {
        const facMesAnterior = await getFacturacionMesAnterior(clientId)
        if (facMesAnterior && facMesAnterior.monto > 0) {
          const { total } = await calcularIibbEstimado(clientId, facMesAnterior.monto)
          setMontoIibb(total)
        }
      }

      // Cargar instrucciones existentes
      const instrucciones = await getInstruccionesMesActual(clientId)

      console.log('ModalInstrucciones - Instrucciones:', instrucciones)

      // SIEMPRE usar el método preferido del cliente de su ficha (prioridad)
      const metodoDefaultMonotributo = clienteData.metodo_pago_monotributo || 'vep'

      // Guardar el método original para detectar cambios
      setMetodoOriginalMonotributo(metodoDefaultMonotributo)

      console.log('ModalInstrucciones - Método default:', metodoDefaultMonotributo)

      // Cargar datos guardados pero SIEMPRE usar el método de la ficha del cliente
      const nuevosMonotributo = instrucciones.monotributo
        ? {
            metodo_pago: metodoDefaultMonotributo, // SIEMPRE el de la ficha
            vep_numero: instrucciones.monotributo.vep_numero || '',
            vep_monto: instrucciones.monotributo.vep_monto || null,
            vep_vencimiento: instrucciones.monotributo.vep_vencimiento || null,
            mercadopago_numero: instrucciones.monotributo.mercadopago_numero || '',
            cpe_codigo: instrucciones.monotributo.cpe_codigo || '',
            efectivo_boleta_url: instrucciones.monotributo.efectivo_boleta_url || null,
            efectivo_boleta_nombre: null,
            notas: instrucciones.monotributo.notas || ''
          }
        : {
            metodo_pago: metodoDefaultMonotributo,
            vep_numero: '',
            vep_monto: montoMonotributo > 0 ? montoMonotributo : null, // Pre-llenar con monto calculado
            vep_vencimiento: null,
            mercadopago_numero: '',
            cpe_codigo: '',
            efectivo_boleta_url: null,
            efectivo_boleta_nombre: null,
            notas: ''
          }

      console.log('ModalInstrucciones - Seteando datosMonotributo:', nuevosMonotributo)
      setDatosMonotributo(nuevosMonotributo)

      // Datos IIBB
      // SIEMPRE usar el método preferido del cliente de su ficha (si existe)
      const metodoDefaultIibb = clienteData.metodo_pago_iibb || 'vep'

      if (instrucciones.iibb) {
        setDatosIibb({
          metodo_pago: metodoDefaultIibb, // SIEMPRE el de la ficha
          vep_numero: instrucciones.iibb.vep_numero || '',
          vep_monto: instrucciones.iibb.vep_monto || null,
          vep_vencimiento: instrucciones.iibb.vep_vencimiento || null,
          mercadopago_numero: instrucciones.iibb.mercadopago_numero || '',
          mercadopago_vencimiento: instrucciones.iibb.mercadopago_vencimiento || null,
          cpe_codigo: instrucciones.iibb.cpe_codigo || '',
          efectivo_boleta_url: instrucciones.iibb.efectivo_boleta_url || null,
          efectivo_boleta_nombre: null,
          notas: instrucciones.iibb.notas || ''
        })
      } else if (tieneIibbActivo) {
        // Si no hay instrucciones previas pero sí tiene IIBB, pre-llenar con método preferido y monto calculado
        setDatosIibb({
          metodo_pago: metodoDefaultIibb,
          vep_numero: '',
          vep_monto: montoIibb > 0 ? montoIibb : null,
          vep_vencimiento: null,
          mercadopago_numero: '',
          mercadopago_vencimiento: null,
          cpe_codigo: '',
          efectivo_boleta_url: null,
          efectivo_boleta_nombre: null,
          notas: ''
        })
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
      setModalError({
        isOpen: true,
        message: 'Error al cargar los datos del cliente'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCambioMetodoMonotributo = (nuevoMetodo) => {
    // Si cambió el método de pago del original, preguntar
    if (nuevoMetodo !== metodoOriginalMonotributo && metodoOriginalMonotributo) {
      setModalConfirmMetodo({
        isOpen: true,
        nuevoMetodo,
        tipo: 'monotributo'
      })
    }
    setDatosMonotributo({ ...datosMonotributo, metodo_pago: nuevoMetodo })
  }

  const confirmarCambioMetodo = async () => {
    // Actualizar el método por defecto en la ficha del cliente
    try {
      await actualizarCamposCliente(
        clientId,
        { metodo_pago_monotributo: modalConfirmMetodo.nuevoMetodo },
        { metodo_pago_monotributo: metodoOriginalMonotributo },
        user?.id,
        'Cambio de método de pago por defecto'
      )
      setMetodoOriginalMonotributo(modalConfirmMetodo.nuevoMetodo)
    } catch (error) {
      console.error('Error actualizando método por defecto:', error)
    }
    setModalConfirmMetodo({ isOpen: false, nuevoMetodo: null, tipo: null })
  }

  const rechazarCambioMetodo = () => {
    // No actualizar, solo cerrar
    setModalConfirmMetodo({ isOpen: false, nuevoMetodo: null, tipo: null })
  }

  const validarDatos = (datos, tipo) => {
    // Débito automático no necesita validación extra
    if (datos.metodo_pago === 'debito_automatico') return true

    // VEP necesita número de 11 dígitos y fecha de vencimiento
    if (datos.metodo_pago === 'vep') {
      if (!datos.vep_numero || datos.vep_numero.length !== 11) return false
      if (!datos.vep_vencimiento) return false
    }

    // Mercado Pago necesita número de 11 dígitos y fecha de vencimiento
    if (datos.metodo_pago === 'mercado_pago') {
      if (!datos.mercadopago_numero || datos.mercadopago_numero.length !== 11) return false
      if (!datos.mercadopago_vencimiento) return false
    }

    // Efectivo necesita código
    if (datos.metodo_pago === 'efectivo' && !datos.cpe_codigo) {
      return false
    }

    return true
  }

  const handleGuardar = async () => {
    try {
      // Validar datos de monotributo
      if (!validarDatos(datosMonotributo, 'monotributo')) {
        let mensaje = 'Completa los campos requeridos de Monotributo'
        if (datosMonotributo.metodo_pago === 'vep') {
          if (!datosMonotributo.vep_numero || datosMonotributo.vep_numero.length !== 11) {
            mensaje = 'El numero de VEP debe tener 11 digitos'
          } else if (!datosMonotributo.vep_vencimiento) {
            mensaje = 'La fecha de vencimiento del VEP es requerida'
          }
        } else if (datosMonotributo.metodo_pago === 'mercado_pago') {
          if (!datosMonotributo.mercadopago_numero || datosMonotributo.mercadopago_numero.length !== 11) {
            mensaje = 'El numero de Mercado Pago debe tener 11 digitos'
          } else if (!datosMonotributo.mercadopago_vencimiento) {
            mensaje = 'La fecha de vencimiento de Mercado Pago es requerida'
          }
        }
        setModalError({
          isOpen: true,
          message: mensaje
        })
        return
      }

      // Validar datos de IIBB solo si el cliente tiene IIBB
      const tieneIibb = cliente?.regimen_iibb === 'local' || cliente?.regimen_iibb === 'convenio_multilateral'
      if (tieneIibb && !validarDatos(datosIibb, 'iibb')) {
        let mensaje = 'Completa los campos requeridos de IIBB'
        if (datosIibb.metodo_pago === 'vep') {
          if (!datosIibb.vep_numero || datosIibb.vep_numero.length !== 11) {
            mensaje = 'El numero de VEP de IIBB debe tener 11 digitos'
          } else if (!datosIibb.vep_vencimiento) {
            mensaje = 'La fecha de vencimiento del VEP de IIBB es requerida'
          }
        } else if (datosIibb.metodo_pago === 'mercado_pago') {
          if (!datosIibb.mercadopago_numero || datosIibb.mercadopago_numero.length !== 11) {
            mensaje = 'El numero de Mercado Pago de IIBB debe tener 11 digitos'
          } else if (!datosIibb.mercadopago_vencimiento) {
            mensaje = 'La fecha de vencimiento de Mercado Pago de IIBB es requerida'
          }
        }
        setModalError({
          isOpen: true,
          message: mensaje
        })
        return
      }

      setSaving(true)

      // Auto-llenar vep_monto con el monto calculado antes de guardar
      const datosMonotributoConMonto = {
        ...datosMonotributo,
        vep_monto: datosMonotributo.metodo_pago === 'vep' && montoMonotributo > 0 ? montoMonotributo : datosMonotributo.vep_monto
      }

      const datosIibbConMonto = {
        ...datosIibb,
        vep_monto: datosIibb.metodo_pago === 'vep' && montoIibb > 0 ? montoIibb : datosIibb.vep_monto
      }

      // Guardar instrucciones de monotributo
      await guardarInstrucciones(clientId, 'monotributo', datosMonotributoConMonto)

      // Guardar instrucciones de IIBB (solo si aplica)
      if (tieneIibb) {
        await guardarInstrucciones(clientId, 'iibb', datosIibbConMonto)
      }

      // Enviar notificación por Buzón si está activado
      if (enviarBuzon && cliente?.user_id) {
        const mes = new Date().toLocaleDateString('es-AR', { month: 'long' })
        const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1)

        const texto = generarTextoInstrucciones(
          datosMonotributoConMonto,
          tieneIibb ? datosIibbConMonto : null,
          mesCapitalizado
        )

        await crearConversacionConDestinatarios(
          user.id,
          `Instrucciones de pago - ${mesCapitalizado}`,
          texto,
          [cliente.user_id],
          'instrucciones_pago',
          clientId
        )
      }

      // Crear notificación en la campanita
      const mes = new Date().toLocaleDateString('es-AR', { month: 'long' })
      const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1)

      await createNotification({
        clientId,
        tipo: 'instrucciones_pago',
        titulo: `Instrucciones de pago - ${mesCapitalizado}`,
        mensaje: `Se generaron las instrucciones de pago para ${mesCapitalizado}. Revisa los detalles en tu dashboard.`,
        prioridad: 'alta',
        createdBy: user?.id
      })

      if (onSave) await onSave()
      onClose()
    } catch (error) {
      console.error('Error guardando instrucciones:', error)
      setModalError({
        isOpen: true,
        message: error.message || 'Error al guardar las instrucciones'
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const tieneIibb = cliente?.regimen_iibb === 'local' || cliente?.regimen_iibb === 'convenio_multilateral'

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Instrucciones de pago"
        size="3xl"
        variant="info"
      >
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-gray-500 mt-2">Cargando...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info del cliente */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">
                {cliente?.full_name || cliente?.razon_social || 'Cliente'}
              </p>
              <p className="text-sm text-gray-500">
                Periodo: {mesActual.charAt(0).toUpperCase() + mesActual.slice(1)}
              </p>
            </div>

            {/* Grid de secciones - dos columnas */}
            <div className={`grid ${tieneIibb ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
              {/* Sección Monotributo */}
              <SeccionInstrucciones
                tipo="monotributo"
                titulo="Monotributo"
                icono={CreditCard}
                datos={datosMonotributo}
                onChange={setDatosMonotributo}
                onCambioMetodo={handleCambioMetodoMonotributo}
                regimen={cliente?.regimen_iibb}
                clientId={clientId}
                montoCalculado={montoMonotributo}
              />

              {/* Sección IIBB */}
              {tieneIibb && (
                <SeccionInstrucciones
                tipo="iibb"
                titulo="Ingresos Brutos"
                icono={Receipt}
                datos={datosIibb}
                onChange={setDatosIibb}
                regimen={cliente?.regimen_iibb}
                clientId={clientId}
                montoCalculado={montoIibb}
              />
              )}
            </div>

            {/* Checkbox notificación */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id="enviar-buzon"
                checked={enviarBuzon}
                onChange={(e) => setEnviarBuzon(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="enviar-buzon" className="text-sm text-blue-900 flex items-center gap-2">
                <Send className="w-4 h-4" />
                Enviar notificacion al cliente por Buzon
              </label>
            </div>

            {/* Nota informativa */}
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                Las instrucciones se mostraran en el dashboard del cliente y {enviarBuzon ? 'tambien se enviara una notificacion al Buzon.' : 'no se enviara notificacion al Buzon.'}
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar instrucciones'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de errores */}
      <AlertModal
        isOpen={modalError.isOpen}
        onClose={() => setModalError({ isOpen: false, message: '' })}
        title="Error"
        message={modalError.message}
        variant="error"
        buttonText="Entendido"
      />

      {/* Modal de confirmación cambio de método */}
      <ConfirmModal
        isOpen={modalConfirmMetodo.isOpen}
        onClose={rechazarCambioMetodo}
        onConfirm={confirmarCambioMetodo}
        title="Cambio de método de pago"
        message={`¿Queres guardar ${METODOS_PAGO[modalConfirmMetodo.nuevoMetodo]?.label || modalConfirmMetodo.nuevoMetodo} como el método de pago por defecto de este cliente, o es solo para esta vez?`}
        variant="info"
        confirmText="Guardar como predeterminado"
        cancelText="Solo esta vez"
      />
    </>
  )
}
