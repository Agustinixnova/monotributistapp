/**
 * Utilidades para envío de mensajes por WhatsApp
 */

/**
 * Genera el link de WhatsApp con mensaje pre-armado para recordatorio
 */
export function generarLinkRecordatorio(turno, cliente, servicios = []) {
  if (!cliente?.whatsapp && !cliente?.telefono) {
    return null
  }

  const telefono = limpiarTelefono(cliente.whatsapp || cliente.telefono)
  const mensaje = generarMensajeRecordatorio(turno, cliente, servicios)

  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
}

/**
 * Genera el link de WhatsApp para confirmación de turno nuevo
 */
export function generarLinkConfirmacion(turno, cliente, servicios = []) {
  if (!cliente?.whatsapp && !cliente?.telefono) {
    return null
  }

  const telefono = limpiarTelefono(cliente.whatsapp || cliente.telefono)
  const mensaje = generarMensajeConfirmacion(turno, cliente, servicios)

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
 * Genera mensaje de recordatorio
 */
function generarMensajeRecordatorio(turno, cliente, servicios) {
  const fecha = formatearFechaMensaje(turno.fecha)
  const hora = turno.hora_inicio?.substring(0, 5) || ''
  const listaServicios = servicios.map(s => s.nombre).join(', ') || 'tu turno'

  return `¡Hola ${cliente.nombre}! 👋

Te recuerdo tu turno para *${listaServicios}*:
📅 ${fecha}
🕐 ${hora} hs

¡Te espero! 😊

_Si no podés asistir, avisame con tiempo para reprogramar._`
}

/**
 * Genera mensaje de confirmación de turno nuevo
 */
function generarMensajeConfirmacion(turno, cliente, servicios) {
  const fecha = formatearFechaMensaje(turno.fecha)
  const hora = turno.hora_inicio?.substring(0, 5) || ''
  const listaServicios = servicios.map(s => s.nombre).join(', ') || 'tu servicio'

  let mensaje = `¡Hola ${cliente.nombre}!

Tu turno quedó confirmado ✅

📋 *${listaServicios}*
📅 ${fecha}
🕐 ${hora} hs`

  // Si hay seña requerida
  const senaTotal = servicios
    .filter(s => s.requiere_sena)
    .reduce((acc, s) => acc + (s.precio * (s.porcentaje_sena || 30) / 100), 0)

  if (senaTotal > 0) {
    mensaje += `

💰 Seña requerida: $${formatearMonto(senaTotal)}`
  }

  mensaje += `

¡Te espero! 😊`

  return mensaje
}

/**
 * Genera mensaje de cancelación
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
