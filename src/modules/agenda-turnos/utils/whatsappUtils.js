/**
 * Utilidades para envío de mensajes por WhatsApp
 * Soporta plantillas personalizables con variables
 */

// Plantilla por defecto para recordatorios
const PLANTILLA_RECORDATORIO_DEFAULT = `¡Hola {nombre}!

Te recordamos tu turno:
📅 {fecha}
🕐 {hora} hs
💇 {servicios}

{instrucciones}

{direccion}

Si necesitás reprogramar, escribinos al {whatsapp}.
¡Te esperamos!`

// Plantilla por defecto para confirmaciones
const PLANTILLA_CONFIRMACION_DEFAULT = `¡Hola {nombre}!

Tu turno quedó confirmado ✅

📋 {servicios}
📅 {fecha}
🕐 {hora} hs

{instrucciones}

{sena}

{direccion}

¡Te esperamos!`

/**
 * Genera el link de WhatsApp con mensaje pre-armado para recordatorio
 * @param {Object} turno - Datos del turno
 * @param {Object} cliente - Datos del cliente
 * @param {Array} servicios - Lista de servicios con instrucciones_previas
 * @param {Object} negocio - Datos del negocio (plantilla, direccion, whatsapp)
 */
export function generarLinkRecordatorio(turno, cliente, servicios = [], negocio = null) {
  if (!cliente?.whatsapp && !cliente?.telefono) {
    return null
  }

  const telefono = limpiarTelefono(cliente.whatsapp || cliente.telefono)
  const mensaje = generarMensajeRecordatorio(turno, cliente, servicios, negocio)

  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
}

/**
 * Genera el link de WhatsApp para confirmación de turno nuevo
 */
export function generarLinkConfirmacion(turno, cliente, servicios = [], negocio = null) {
  if (!cliente?.whatsapp && !cliente?.telefono) {
    return null
  }

  const telefono = limpiarTelefono(cliente.whatsapp || cliente.telefono)
  const mensaje = generarMensajeConfirmacion(turno, cliente, servicios, negocio)

  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
}

/**
 * Genera el link de WhatsApp para cancelación
 */
export function generarLinkCancelacion(turno, cliente, motivo = '') {
  if (!cliente?.whatsapp && !cliente?.telefono) {
    return null
  }

  const telefono = limpiarTelefono(cliente.whatsapp || cliente.telefono)
  const mensaje = generarMensajeCancelacion(turno, cliente, motivo)

  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
}

/**
 * Limpia y formatea el número de teléfono para WhatsApp
 */
export function limpiarTelefono(telefono) {
  if (!telefono) return ''

  // Remover todo excepto números
  let limpio = telefono.replace(/\D/g, '')

  // Si empieza con 15, agregar código de área de Argentina
  if (limpio.startsWith('15') && limpio.length === 10) {
    limpio = '549' + limpio.substring(2) // Remover 15 y agregar 549
  }

  // Si no tiene código de país, agregar Argentina
  if (!limpio.startsWith('54') && limpio.length <= 10) {
    limpio = '54' + limpio
  }

  // Si tiene 54 pero no tiene 9 después del código de área
  if (limpio.startsWith('54') && !limpio.startsWith('549') && limpio.length === 12) {
    limpio = '549' + limpio.substring(2)
  }

  return limpio
}

/**
 * Genera mensaje de recordatorio usando plantilla
 */
function generarMensajeRecordatorio(turno, cliente, servicios, negocio) {
  // Usar plantilla del negocio o la por defecto
  const plantilla = negocio?.plantilla_recordatorio || PLANTILLA_RECORDATORIO_DEFAULT

  // Preparar variables
  const variables = prepararVariables(turno, cliente, servicios, negocio)

  // Reemplazar variables en plantilla
  return reemplazarVariables(plantilla, variables)
}

/**
 * Genera mensaje de confirmación usando plantilla
 */
function generarMensajeConfirmacion(turno, cliente, servicios, negocio) {
  // Usar plantilla del negocio o la por defecto
  const plantilla = negocio?.plantilla_confirmacion || PLANTILLA_CONFIRMACION_DEFAULT

  // Preparar variables
  const variables = prepararVariables(turno, cliente, servicios, negocio)

  // Agregar info de seña si aplica
  const senaTotal = servicios
    .filter(s => s.requiere_sena)
    .reduce((acc, s) => acc + (s.precio * (s.porcentaje_sena || 30) / 100), 0)

  if (senaTotal > 0) {
    variables.sena = `💰 Seña requerida: $${formatearMonto(senaTotal)}`
  } else {
    variables.sena = ''
  }

  // Reemplazar variables en plantilla
  return reemplazarVariables(plantilla, variables)
}

/**
 * Prepara las variables para reemplazar en la plantilla
 */
function prepararVariables(turno, cliente, servicios, negocio) {
  const fecha = formatearFechaMensaje(turno.fecha)
  const hora = turno.hora_inicio?.substring(0, 5) || ''
  const listaServicios = servicios.map(s => s.nombre).filter(Boolean).join(', ') || 'tu turno'

  // Combinar instrucciones de todos los servicios
  const instruccionesArray = servicios
    .map(s => s.instrucciones_previas)
    .filter(Boolean)

  let instrucciones = ''
  if (instruccionesArray.length > 0) {
    instrucciones = '⚠️ Importante:\n' + instruccionesArray.map(i => `• ${i}`).join('\n')
  }

  // Dirección (solo si no es a domicilio)
  let direccion = ''
  if (!turno.es_domicilio && negocio?.direccion) {
    direccion = `📍 Te esperamos en ${negocio.direccion}`
    if (negocio.localidad) {
      direccion += `, ${negocio.localidad}`
    }
  }

  // WhatsApp del negocio
  const whatsappNegocio = negocio?.whatsapp || ''

  return {
    nombre: cliente?.nombre || 'Cliente',
    fecha,
    hora,
    servicios: listaServicios,
    instrucciones,
    direccion,
    whatsapp: whatsappNegocio,
    sena: '' // Se agrega en confirmación si aplica
  }
}

/**
 * Reemplaza las variables en la plantilla
 */
function reemplazarVariables(plantilla, variables) {
  let mensaje = plantilla

  // Reemplazar cada variable
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    mensaje = mensaje.replace(regex, value || '')
  })

  // Limpiar líneas vacías múltiples (cuando una variable está vacía)
  mensaje = mensaje.replace(/\n{3,}/g, '\n\n')

  // Limpiar espacios al inicio y final
  mensaje = mensaje.trim()

  return mensaje
}

/**
 * Genera mensaje de cancelación (sin plantilla por ahora)
 */
function generarMensajeCancelacion(turno, cliente, motivo) {
  const fecha = formatearFechaMensaje(turno.fecha)
  const hora = turno.hora_inicio?.substring(0, 5) || ''

  let mensaje = `Hola ${cliente.nombre},

Lamentablemente debo cancelar el turno del ${fecha} a las ${hora} hs.`

  if (motivo) {
    mensaje += `

Motivo: ${motivo}`
  }

  mensaje += `

Te pido disculpas por las molestias. ¿Querés que reprogramemos para otro día?`

  return mensaje
}

/**
 * Formatea fecha para mensaje
 */
function formatearFechaMensaje(fecha) {
  if (!fecha) return ''

  const date = new Date(fecha + 'T12:00:00')
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

  const diaSemana = dias[date.getDay()]
  const dia = date.getDate()
  const mes = meses[date.getMonth()]

  return `${diaSemana} ${dia} de ${mes}`
}

/**
 * Formatea monto para mensaje
 */
function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR').format(Math.round(monto))
}

/**
 * Abre WhatsApp con el link generado
 */
export function abrirWhatsApp(link) {
  if (!link) return false
  window.open(link, '_blank')
  return true
}
