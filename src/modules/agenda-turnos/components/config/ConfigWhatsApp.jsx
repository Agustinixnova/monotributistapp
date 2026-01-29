/**
 * Configuración de plantillas de WhatsApp
 * Editor visual con drag & drop para usuarios no técnicos
 * Optimizado para mobile
 */

import { useState, useEffect, useRef } from 'react'
import {
  MessageCircle, Loader2, Check, Info, ChevronDown,
  Bold, Italic, Smile, Eye, EyeOff, RotateCcw
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

// Plantilla por defecto
const PLANTILLA_DEFAULT = `¡Hola {nombre}! 👋

Te recordamos tu turno:
📅 {fecha}
🕐 {hora} hs
💇 {servicios}

{instrucciones}

{direccion}

Si necesitás reprogramar, escribinos al {whatsapp}.
¡Te esperamos! 😊`

export default function ConfigWhatsApp() {
  const { negocio, loading, saving, guardar } = useNegocio()
  const [guardado, setGuardado] = useState(false)
  const [plantilla, setPlantilla] = useState('')
  const [mostrarEmojis, setMostrarEmojis] = useState(false)
  const [mostrarPreview, setMostrarPreview] = useState(false) // Oculto por defecto en mobile
  const [mostrarInfo, setMostrarInfo] = useState(false)
  const textareaRef = useRef(null)

  // Cargar plantilla del negocio
  useEffect(() => {
    if (negocio) {
      setPlantilla(negocio.plantilla_recordatorio || PLANTILLA_DEFAULT)
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
      plantilla_recordatorio: plantilla
    })
    if (success) {
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    }
  }

  // Restaurar default
  const restaurarDefault = () => {
    setPlantilla(PLANTILLA_DEFAULT)
    setGuardado(false)
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
            <p className="text-xs text-gray-500">Personalizá tus recordatorios</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
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
