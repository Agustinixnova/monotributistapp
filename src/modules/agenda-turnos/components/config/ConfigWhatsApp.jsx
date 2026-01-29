/**
 * Configuración de plantillas de WhatsApp
 * Editor visual con drag & drop para usuarios no técnicos
 * Optimizado para mobile
 */

import { useState, useEffect, useRef } from 'react'
import {
  MessageCircle, Loader2, Check, Info, ChevronDown,
  Bold, Italic, Smile, Eye, EyeOff, RotateCcw, Car, Bell, Wallet, CreditCard
} from 'lucide-react'
import { useNegocio } from '../../hooks/useNegocio'

// Variables disponibles - labels cortos para mobile
const VARIABLES_BASE = [
  { id: 'nombre', codigo: '{nombre}', label: 'Nombre', labelLargo: 'Nombre del cliente', ejemplo: 'María' },
  { id: 'fecha', codigo: '{fecha}', label: 'Fecha', labelLargo: 'Fecha del turno', ejemplo: 'miércoles 29 de enero' },
  { id: 'hora', codigo: '{hora}', label: 'Hora', labelLargo: 'Hora del turno', ejemplo: '15:00' },
  { id: 'servicios', codigo: '{servicios}', label: 'Servicios', labelLargo: 'Lista de servicios', ejemplo: 'Lifting de pestañas, Diseño de cejas' },
  { id: 'instrucciones', codigo: '{instrucciones}', label: 'Instrucciones', labelLargo: 'Instrucciones especiales', ejemplo: '⚠️ Importante:\n• Venir sin maquillaje' },
  { id: 'direccion', codigo: '{direccion}', label: 'Dirección', labelLargo: 'Dirección del local', ejemplo: '' },
  { id: 'whatsapp', codigo: '{whatsapp}', label: 'WhatsApp', labelLargo: 'Tu número de WhatsApp', ejemplo: '' },
]

// Emojis comunes
const EMOJIS = [
  '👋', '😊', '💇', '💅', '✨', '💖', '🌟', '✅',
  '📅', '🕐', '📍', '📞', '💬', '⚠️', '❤️', '🙏',
  '👍', '🎉', '💪', '🌸', '✂️', '💄', '👁️', '🦋'
]

// Plantilla por defecto - Recordatorio
const PLANTILLA_DEFAULT = `¡Hola {nombre}! 👋

Te recordamos tu turno:
📅 {fecha}
🕐 {hora} hs
💇 {servicios}

{instrucciones}

{direccion}

Si necesitás reprogramar, escribinos al {whatsapp}.
¡Te esperamos! 😊`

// Plantilla por defecto - En camino (para domicilio)
const PLANTILLA_EN_CAMINO_DEFAULT = `¡Hola {nombre}! 🚗

Estoy saliendo para tu turno de las {hora} hs.
¡Ya voy en camino!

Cualquier cosa me avisás 😊`

// Variables para plantilla "En camino" (más reducidas)
const VARIABLES_EN_CAMINO = [
  { id: 'nombre', codigo: '{nombre}', label: 'Nombre', labelLargo: 'Nombre del cliente', ejemplo: 'María' },
  { id: 'hora', codigo: '{hora}', label: 'Hora', labelLargo: 'Hora del turno', ejemplo: '15:00' },
]

// Plantilla por defecto - Seña
const PLANTILLA_SENA_DEFAULT = `¡Hola {nombre}! 👋

Para completar la seña de *{monto}*, podés transferir a:

💳 *Alias:* {alias}

Una vez que hagas la transferencia, enviame el comprobante por acá 📲

¡Gracias! ✨
{negocio}`

// Plantilla por defecto - Pago final
const PLANTILLA_PAGO_DEFAULT = `¡Hola {nombre}! 👋

Para completar el pago de *{monto}*, podés transferir a:

💳 *Alias:* {alias}

Una vez que hagas la transferencia, enviame el comprobante por acá 📲

¡Gracias! ✨
{negocio}`

// Variables para plantillas de pago
const VARIABLES_PAGO = [
  { id: 'nombre', codigo: '{nombre}', label: 'Nombre', labelLargo: 'Nombre del cliente', ejemplo: 'María' },
  { id: 'monto', codigo: '{monto}', label: 'Monto', labelLargo: 'Monto a pagar', ejemplo: '$5.000' },
  { id: 'alias', codigo: '{alias}', label: 'Alias', labelLargo: 'Alias de pago', ejemplo: 'mi.alias.mp' },
  { id: 'negocio', codigo: '{negocio}', label: 'Negocio', labelLargo: 'Nombre del negocio', ejemplo: 'Mi Negocio' },
]

export default function ConfigWhatsApp({ onGuardar }) {
  const { negocio, loading, saving, guardar, tieneDomicilio } = useNegocio()
  const [guardado, setGuardado] = useState(false)
  const [plantilla, setPlantilla] = useState('')
  const [plantillaEnCamino, setPlantillaEnCamino] = useState('')
  const [plantillaSena, setPlantillaSena] = useState('')
  const [plantillaPago, setPlantillaPago] = useState('')
  const [mostrarEmojis, setMostrarEmojis] = useState(false)
  const [mostrarPreview, setMostrarPreview] = useState(false) // Oculto por defecto en mobile
  const [mostrarInfo, setMostrarInfo] = useState(false)
  const [tabActiva, setTabActiva] = useState('turnos') // 'turnos' o 'pagos'
  const [seccionActiva, setSeccionActiva] = useState('recordatorio') // 'recordatorio', 'en_camino', 'sena', 'pago'
  const textareaRef = useRef(null)
  const textareaEnCaminoRef = useRef(null)
  const textareaSenaRef = useRef(null)
  const textareaPagoRef = useRef(null)

  // Cargar plantillas del negocio
  useEffect(() => {
    if (negocio) {
      setPlantilla(negocio.plantilla_recordatorio || PLANTILLA_DEFAULT)
      setPlantillaEnCamino(negocio.plantilla_en_camino || PLANTILLA_EN_CAMINO_DEFAULT)
      setPlantillaSena(negocio.plantilla_sena || PLANTILLA_SENA_DEFAULT)
      setPlantillaPago(negocio.plantilla_pago || PLANTILLA_PAGO_DEFAULT)
    }
  }, [negocio])

  // Generar variables con datos reales del negocio
  const VARIABLES = VARIABLES_BASE.map(v => {
    if (v.id === 'direccion' && negocio?.direccion) {
      const dir = negocio.localidad
        ? `📍 Te esperamos en ${negocio.direccion}, ${negocio.localidad}`
        : `📍 Te esperamos en ${negocio.direccion}`
      return { ...v, ejemplo: dir }
    }
    if (v.id === 'whatsapp' && negocio?.whatsapp) {
      return { ...v, ejemplo: negocio.whatsapp }
    }
    // Defaults para variables sin datos del negocio
    if (v.id === 'direccion' && !negocio?.direccion) {
      return { ...v, ejemplo: '📍 Te esperamos en [tu dirección]' }
    }
    if (v.id === 'whatsapp' && !negocio?.whatsapp) {
      return { ...v, ejemplo: '[tu whatsapp]' }
    }
    return v
  })

  const handleTextareaChange = (e) => {
    setPlantilla(e.target.value)
    setGuardado(false)
  }

  // Insertar texto en la posición del cursor
  const insertarEnCursor = (texto) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const inicio = textarea.selectionStart
    const fin = textarea.selectionEnd
    const textoAntes = plantilla.substring(0, inicio)
    const textoDespues = plantilla.substring(fin)

    const nuevaPlantilla = textoAntes + texto + textoDespues
    setPlantilla(nuevaPlantilla)
    setGuardado(false)

    setTimeout(() => {
      textarea.focus()
      const nuevaPosicion = inicio + texto.length
      textarea.setSelectionRange(nuevaPosicion, nuevaPosicion)
    }, 0)
  }

  // Drag & Drop handlers
  const handleDragStart = (e, variable) => {
    e.dataTransfer.setData('text/plain', variable.codigo)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const codigo = e.dataTransfer.getData('text/plain')
    insertarEnCursor(codigo)
  }

  // Aplicar formato
  const aplicarFormato = (tipo) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const inicio = textarea.selectionStart
    const fin = textarea.selectionEnd
    const textoSeleccionado = plantilla.substring(inicio, fin)

    if (textoSeleccionado) {
      const simbolo = tipo === 'bold' ? '*' : '_'
      const textoFormateado = `${simbolo}${textoSeleccionado}${simbolo}`
      const textoAntes = plantilla.substring(0, inicio)
      const textoDespues = plantilla.substring(fin)

      setPlantilla(textoAntes + textoFormateado + textoDespues)
      setGuardado(false)

      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(inicio, fin + 2)
      }, 0)
    }
  }

  // Insertar emoji
  const insertarEmoji = (emoji) => {
    insertarEnCursor(emoji)
    setMostrarEmojis(false)
  }

  // Generar preview con formato
  const generarPreview = () => {
    let preview = plantilla

    // Reemplazar variables
    VARIABLES.forEach(v => {
      const regex = new RegExp(v.codigo.replace(/[{}]/g, '\\$&'), 'g')
      preview = preview.replace(regex, v.ejemplo)
    })

    // Limpiar líneas vacías múltiples
    preview = preview.replace(/\n{3,}/g, '\n\n').trim()

    return preview
  }

  // Renderizar preview con formato (negrita, cursiva)
  const renderPreviewConFormato = (texto) => {
    // Escapar HTML primero
    let html = texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // Convertir *texto* a negrita
    html = html.replace(/\*([^*]+)\*/g, '<strong>$1</strong>')

    // Convertir _texto_ a cursiva
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>')

    // Convertir saltos de línea
    html = html.replace(/\n/g, '<br/>')

    return html
  }

  // Guardar
  const handleGuardar = async () => {
    const { success } = await guardar({
      ...negocio,
      plantilla_recordatorio: plantilla,
      plantilla_en_camino: plantillaEnCamino,
      plantilla_sena: plantillaSena,
      plantilla_pago: plantillaPago
    })
    if (success) {
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
      // Notificar al padre que se guardó para recargar datos
      onGuardar?.()
    }
  }

  // Restaurar default
  const restaurarDefault = () => {
    if (seccionActiva === 'recordatorio') {
      setPlantilla(PLANTILLA_DEFAULT)
    } else if (seccionActiva === 'en_camino') {
      setPlantillaEnCamino(PLANTILLA_EN_CAMINO_DEFAULT)
    } else if (seccionActiva === 'sena') {
      setPlantillaSena(PLANTILLA_SENA_DEFAULT)
    } else if (seccionActiva === 'pago') {
      setPlantillaPago(PLANTILLA_PAGO_DEFAULT)
    }
    setGuardado(false)
  }

  // Obtener textarea, plantilla y setter según sección activa
  const getConfigSeccion = () => {
    switch (seccionActiva) {
      case 'recordatorio':
        return { textarea: textareaRef.current, plantilla: plantilla, setPlantilla: setPlantilla }
      case 'en_camino':
        return { textarea: textareaEnCaminoRef.current, plantilla: plantillaEnCamino, setPlantilla: setPlantillaEnCamino }
      case 'sena':
        return { textarea: textareaSenaRef.current, plantilla: plantillaSena, setPlantilla: setPlantillaSena }
      case 'pago':
        return { textarea: textareaPagoRef.current, plantilla: plantillaPago, setPlantilla: setPlantillaPago }
      default:
        return { textarea: textareaRef.current, plantilla: plantilla, setPlantilla: setPlantilla }
    }
  }

  // Insertar en el textarea activo
  const insertarEnCursorActivo = (texto) => {
    const { textarea, plantilla: plantillaActual, setPlantilla: setPlantillaActual } = getConfigSeccion()

    if (!textarea) return

    const inicio = textarea.selectionStart
    const fin = textarea.selectionEnd
    const textoAntes = plantillaActual.substring(0, inicio)
    const textoDespues = plantillaActual.substring(fin)

    const nuevaPlantilla = textoAntes + texto + textoDespues
    setPlantillaActual(nuevaPlantilla)
    setGuardado(false)

    setTimeout(() => {
      textarea.focus()
      const nuevaPosicion = inicio + texto.length
      textarea.setSelectionRange(nuevaPosicion, nuevaPosicion)
    }, 0)
  }

  // Generar preview para en camino
  const generarPreviewEnCamino = () => {
    let preview = plantillaEnCamino
    VARIABLES_EN_CAMINO.forEach(v => {
      const regex = new RegExp(v.codigo.replace(/[{}]/g, '\\$&'), 'g')
      preview = preview.replace(regex, v.ejemplo)
    })
    return preview.replace(/\n{3,}/g, '\n\n').trim()
  }

  // Generar preview para pagos (seña o pago)
  const generarPreviewPago = (tipo) => {
    let preview = tipo === 'sena' ? plantillaSena : plantillaPago
    const variablesPago = VARIABLES_PAGO.map(v => {
      if (v.id === 'alias' && negocio?.alias_pago) {
        return { ...v, ejemplo: negocio.alias_pago }
      }
      if (v.id === 'negocio' && negocio?.nombre_negocio) {
        return { ...v, ejemplo: negocio.nombre_negocio }
      }
      return v
    })
    variablesPago.forEach(v => {
      const regex = new RegExp(v.codigo.replace(/[{}]/g, '\\$&'), 'g')
      preview = preview.replace(regex, v.ejemplo)
    })
    return preview.replace(/\n{3,}/g, '\n\n').trim()
  }

  // Aplicar formato (negrita/cursiva) al textarea activo
  const aplicarFormatoActivo = (tipo) => {
    const { textarea, plantilla: plantillaActual, setPlantilla: setPlantillaActual } = getConfigSeccion()

    if (!textarea) return

    const inicio = textarea.selectionStart
    const fin = textarea.selectionEnd
    const textoSeleccionado = plantillaActual.substring(inicio, fin)

    if (textoSeleccionado) {
      const simbolo = tipo === 'bold' ? '*' : '_'
      const textoFormateado = `${simbolo}${textoSeleccionado}${simbolo}`
      const textoAntes = plantillaActual.substring(0, inicio)
      const textoDespues = plantillaActual.substring(fin)

      setPlantillaActual(textoAntes + textoFormateado + textoDespues)
      setGuardado(false)

      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(inicio, fin + 2)
      }, 0)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-green-500 mx-auto" />
        <p className="mt-2 text-gray-500 text-sm">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Header compacto */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-gray-900 text-sm">Mensajes de WhatsApp</h3>
            <p className="text-xs text-gray-500">Personalizá tus mensajes</p>
          </div>
        </div>
      </div>

      {/* Tabs principales: Turnos y Pagos */}
      <div className="flex border-b bg-gray-50">
        <button
          onClick={() => {
            setTabActiva('turnos')
            setSeccionActiva('recordatorio')
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            tabActiva === 'turnos'
              ? 'text-green-700 border-b-2 border-green-500 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Bell className="w-4 h-4" />
          Turnos
        </button>
        <button
          onClick={() => {
            setTabActiva('pagos')
            setSeccionActiva('sena')
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            tabActiva === 'pagos'
              ? 'text-amber-700 border-b-2 border-amber-500 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Pagos
        </button>
      </div>

      {/* Sub-tabs para Turnos (solo si trabaja a domicilio) */}
      {tabActiva === 'turnos' && tieneDomicilio && (
        <div className="flex border-b">
          <button
            onClick={() => setSeccionActiva('recordatorio')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors ${
              seccionActiva === 'recordatorio'
                ? 'text-green-700 border-b-2 border-green-500 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Recordatorio
          </button>
          <button
            onClick={() => setSeccionActiva('en_camino')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors ${
              seccionActiva === 'en_camino'
                ? 'text-orange-700 border-b-2 border-orange-500 bg-orange-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            En camino
          </button>
        </div>
      )}

      {/* Sub-tabs para Pagos */}
      {tabActiva === 'pagos' && (
        <div className="flex border-b">
          <button
            onClick={() => setSeccionActiva('sena')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors ${
              seccionActiva === 'sena'
                ? 'text-amber-700 border-b-2 border-amber-500 bg-amber-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Seña
          </button>
          <button
            onClick={() => setSeccionActiva('pago')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors ${
              seccionActiva === 'pago'
                ? 'text-green-700 border-b-2 border-green-500 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Pago final
          </button>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* ========== EDITOR RECORDATORIO ========== */}
        {seccionActiva === 'recordatorio' && (
          <>
            {/* Etiquetas - compactas */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">
                Tocá para insertar en el mensaje:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map(variable => (
                  <button
                    key={variable.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, variable)}
                    onClick={() => insertarEnCursor(variable.codigo)}
                    className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-full
                               text-xs font-medium text-blue-700 active:bg-blue-100
                               hover:bg-blue-100 transition-colors"
                    title={variable.labelLargo}
                  >
                    {variable.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Barra de herramientas compacta */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => aplicarFormato('bold')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Negrita"
              >
                <Bold className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={() => aplicarFormato('italic')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Cursiva"
              >
                <Italic className="w-4 h-4 text-gray-700" />
              </button>

              {/* Emojis */}
              <div className="relative">
                <button
                  onClick={() => setMostrarEmojis(!mostrarEmojis)}
                  className={`p-2 rounded-lg transition-colors ${
                    mostrarEmojis ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Smile className="w-4 h-4" />
                </button>

                {mostrarEmojis && (
                  <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-xl shadow-lg border z-20 w-56">
                    <div className="grid grid-cols-8 gap-0.5">
                      {EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => insertarEmoji(emoji)}
                          className="w-7 h-7 flex items-center justify-center text-lg hover:bg-gray-100 rounded"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1" />

              {/* Preview toggle */}
              <button
                onClick={() => setMostrarPreview(!mostrarPreview)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mostrarPreview
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {mostrarPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Preview</span>
              </button>

              {/* Restaurar */}
              <button
                onClick={restaurarDefault}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                title="Restaurar original"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Editor */}
            <div>
              <textarea
                ref={textareaRef}
                value={plantilla}
                onChange={handleTextareaChange}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                rows={10}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500
                           focus:border-green-500 resize-none text-sm leading-relaxed"
                placeholder="Escribí tu mensaje aquí..."
              />
            </div>

            {/* Preview - colapsable */}
            {mostrarPreview && (
              <div className="bg-[#E5DDD5] rounded-xl p-3">
                <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none p-2.5 max-w-[90%] ml-auto shadow-sm">
                  <div
                    className="text-xs text-gray-800 font-sans leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderPreviewConFormato(generarPreview()) }}
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-[9px] text-gray-500">12:00 ✓✓</span>
                  </div>
                </div>
              </div>
            )}

            {/* Info colapsable */}
            <button
              onClick={() => setMostrarInfo(!mostrarInfo)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg text-left"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-600">Cómo funciona</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${mostrarInfo ? 'rotate-180' : ''}`} />
            </button>

            {mostrarInfo && (
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 space-y-1">
                <p>• Las etiquetas se reemplazan con los datos reales del turno</p>
                <p>• Si un servicio no tiene instrucciones especiales, esa parte no aparece en el mensaje</p>
              </div>
            )}
          </>
        )}

        {/* ========== EDITOR EN CAMINO ========== */}
        {seccionActiva === 'en_camino' && (
          <>
            {/* Descripción */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                <Car className="w-4 h-4 inline mr-1" />
                Este mensaje se envía cuando tocás <strong>"Ir y avisar"</strong> en un turno a domicilio.
              </p>
            </div>

            {/* Etiquetas - solo nombre y hora */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">
                Tocá para insertar en el mensaje:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES_EN_CAMINO.map(variable => (
                  <button
                    key={variable.id}
                    onClick={() => insertarEnCursorActivo(variable.codigo)}
                    className="px-2.5 py-1.5 bg-orange-50 border border-orange-200 rounded-full
                               text-xs font-medium text-orange-700 active:bg-orange-100
                               hover:bg-orange-100 transition-colors"
                    title={variable.labelLargo}
                  >
                    {variable.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Barra de herramientas */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => aplicarFormatoActivo('bold')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Negrita"
              >
                <Bold className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={() => aplicarFormatoActivo('italic')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Cursiva"
              >
                <Italic className="w-4 h-4 text-gray-700" />
              </button>

              {/* Emojis */}
              <div className="relative">
                <button
                  onClick={() => setMostrarEmojis(!mostrarEmojis)}
                  className={`p-2 rounded-lg transition-colors ${
                    mostrarEmojis ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Smile className="w-4 h-4" />
                </button>

                {mostrarEmojis && (
                  <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-xl shadow-lg border z-20 w-56">
                    <div className="grid grid-cols-8 gap-0.5">
                      {EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            insertarEnCursorActivo(emoji)
                            setMostrarEmojis(false)
                          }}
                          className="w-7 h-7 flex items-center justify-center text-lg hover:bg-gray-100 rounded"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1" />

              {/* Preview toggle */}
              <button
                onClick={() => setMostrarPreview(!mostrarPreview)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mostrarPreview
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {mostrarPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Preview</span>
              </button>

              {/* Restaurar */}
              <button
                onClick={restaurarDefault}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                title="Restaurar original"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Editor */}
            <div>
              <textarea
                ref={textareaEnCaminoRef}
                value={plantillaEnCamino}
                onChange={(e) => {
                  setPlantillaEnCamino(e.target.value)
                  setGuardado(false)
                }}
                rows={6}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500
                           focus:border-orange-500 resize-none text-sm leading-relaxed"
                placeholder="Escribí tu mensaje de 'en camino' aquí..."
              />
            </div>

            {/* Preview - colapsable */}
            {mostrarPreview && (
              <div className="bg-[#E5DDD5] rounded-xl p-3">
                <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none p-2.5 max-w-[90%] ml-auto shadow-sm">
                  <div
                    className="text-xs text-gray-800 font-sans leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderPreviewConFormato(generarPreviewEnCamino()) }}
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-[9px] text-gray-500">12:00 ✓✓</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========== EDITOR SEÑA ========== */}
        {seccionActiva === 'sena' && (
          <>
            {/* Etiquetas para pagos */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">
                Tocá para insertar en el mensaje:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES_PAGO.map(variable => (
                  <button
                    key={variable.id}
                    onClick={() => insertarEnCursorActivo(variable.codigo)}
                    className="px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-full
                               text-xs font-medium text-amber-700 active:bg-amber-100
                               hover:bg-amber-100 transition-colors"
                    title={variable.labelLargo}
                  >
                    {variable.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Barra de herramientas */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => aplicarFormatoActivo('bold')}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                title="Negrita"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => aplicarFormatoActivo('italic')}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                title="Cursiva"
              >
                <Italic className="w-4 h-4" />
              </button>

              <div className="h-5 w-px bg-gray-200 mx-1" />

              {/* Emojis */}
              <div className="relative">
                <button
                  onClick={() => setMostrarEmojis(!mostrarEmojis)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                  title="Emojis"
                >
                  <Smile className="w-4 h-4" />
                </button>
                {mostrarEmojis && (
                  <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border z-10 flex flex-wrap gap-1 w-48">
                    {EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          insertarEnCursorActivo(emoji)
                          setMostrarEmojis(false)
                        }}
                        className="w-7 h-7 text-lg hover:bg-gray-100 rounded"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1" />

              {/* Preview toggle */}
              <button
                onClick={() => setMostrarPreview(!mostrarPreview)}
                className={`flex items-center gap-1.5 p-2 rounded-lg transition-colors ${
                  mostrarPreview ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Ver preview"
              >
                {mostrarPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="hidden sm:inline text-xs">Preview</span>
              </button>

              {/* Restaurar */}
              <button
                onClick={restaurarDefault}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                title="Restaurar original"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Textarea */}
            <div>
              <textarea
                ref={textareaSenaRef}
                value={plantillaSena}
                onChange={(e) => {
                  setPlantillaSena(e.target.value)
                  setGuardado(false)
                }}
                rows={8}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500
                           focus:border-amber-500 resize-none text-sm leading-relaxed"
                placeholder="Escribí tu mensaje para solicitar seña..."
              />
            </div>

            {/* Preview */}
            {mostrarPreview && (
              <div className="bg-[#E5DDD5] rounded-xl p-3">
                <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none p-2.5 max-w-[90%] ml-auto shadow-sm">
                  <div
                    className="text-xs text-gray-800 font-sans leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderPreviewConFormato(generarPreviewPago('sena')) }}
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-[9px] text-gray-500">12:00 ✓✓</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========== EDITOR PAGO FINAL ========== */}
        {seccionActiva === 'pago' && (
          <>
            {/* Etiquetas para pagos */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">
                Tocá para insertar en el mensaje:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES_PAGO.map(variable => (
                  <button
                    key={variable.id}
                    onClick={() => insertarEnCursorActivo(variable.codigo)}
                    className="px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-full
                               text-xs font-medium text-green-700 active:bg-green-100
                               hover:bg-green-100 transition-colors"
                    title={variable.labelLargo}
                  >
                    {variable.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Barra de herramientas */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => aplicarFormatoActivo('bold')}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                title="Negrita"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => aplicarFormatoActivo('italic')}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                title="Cursiva"
              >
                <Italic className="w-4 h-4" />
              </button>

              <div className="h-5 w-px bg-gray-200 mx-1" />

              {/* Emojis */}
              <div className="relative">
                <button
                  onClick={() => setMostrarEmojis(!mostrarEmojis)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                  title="Emojis"
                >
                  <Smile className="w-4 h-4" />
                </button>
                {mostrarEmojis && (
                  <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border z-10 flex flex-wrap gap-1 w-48">
                    {EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          insertarEnCursorActivo(emoji)
                          setMostrarEmojis(false)
                        }}
                        className="w-7 h-7 text-lg hover:bg-gray-100 rounded"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1" />

              {/* Preview toggle */}
              <button
                onClick={() => setMostrarPreview(!mostrarPreview)}
                className={`flex items-center gap-1.5 p-2 rounded-lg transition-colors ${
                  mostrarPreview ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Ver preview"
              >
                {mostrarPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="hidden sm:inline text-xs">Preview</span>
              </button>

              {/* Restaurar */}
              <button
                onClick={restaurarDefault}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                title="Restaurar original"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Textarea */}
            <div>
              <textarea
                ref={textareaPagoRef}
                value={plantillaPago}
                onChange={(e) => {
                  setPlantillaPago(e.target.value)
                  setGuardado(false)
                }}
                rows={8}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500
                           focus:border-green-500 resize-none text-sm leading-relaxed"
                placeholder="Escribí tu mensaje para solicitar pago final..."
              />
            </div>

            {/* Preview */}
            {mostrarPreview && (
              <div className="bg-[#E5DDD5] rounded-xl p-3">
                <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none p-2.5 max-w-[90%] ml-auto shadow-sm">
                  <div
                    className="text-xs text-gray-800 font-sans leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderPreviewConFormato(generarPreviewPago('pago')) }}
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-[9px] text-gray-500">12:00 ✓✓</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500 hidden sm:block">
          Se aplica a nuevos recordatorios
        </p>
        <button
          onClick={handleGuardar}
          disabled={saving}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
            guardado
              ? 'bg-green-500 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-50`}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : guardado ? (
            <>
              <Check className="w-4 h-4" />
              Guardado
            </>
          ) : (
            'Guardar'
          )}
        </button>
      </div>
    </div>
  )
}
