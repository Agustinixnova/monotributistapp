/**
 * Utilidades de fecha/hora para Agenda & Turnos
 * Todas las funciones usan timezone UTC-3 (Argentina)
 */

const TIMEZONE = 'America/Argentina/Buenos_Aires'

/**
 * Obtiene la fecha actual en Argentina en formato YYYY-MM-DD
 */
export function getFechaHoyArgentina() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  return formatter.format(new Date())
}

/**
 * Obtiene la hora actual en Argentina en formato HH:MM
 */
export function getHoraActualArgentina() {
  return new Date().toLocaleTimeString('es-AR', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Parsea una fecha string YYYY-MM-DD considerando timezone Argentina
 */
export function parseFechaArgentina(fechaStr) {
  return new Date(fechaStr + 'T12:00:00-03:00')
}

/**
 * Obtiene el día de la semana (0=domingo, 1=lunes, etc)
 */
export function getDiaSemana(fechaStr) {
  const date = parseFechaArgentina(fechaStr)
  return date.getDay()
}

/**
 * Obtiene el nombre del día de la semana
 */
export function getNombreDia(fechaStr) {
  const date = parseFechaArgentina(fechaStr)
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIMEZONE,
    weekday: 'long'
  }).format(date)
}

/**
 * Obtiene el nombre corto del día (Lun, Mar, etc)
 */
export function getNombreDiaCorto(fechaStr) {
  const date = parseFechaArgentina(fechaStr)
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIMEZONE,
    weekday: 'short'
  }).format(date)
}

/**
 * Formatea fecha para mostrar (DD/MM/YYYY)
 */
export function formatFechaDisplay(fechaStr) {
  if (!fechaStr) return ''
  const date = parseFechaArgentina(fechaStr)
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

/**
 * Formatea fecha larga (Viernes 24 de Enero)
 */
export function formatFechaLarga(fechaStr) {
  if (!fechaStr) return ''
  const date = parseFechaArgentina(fechaStr)
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(date)
}

/**
 * Formatea fecha corta para calendario (24 Ene)
 */
export function formatFechaCorta(fechaStr) {
  if (!fechaStr) return ''
  const date = parseFechaArgentina(fechaStr)
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'short'
  }).format(date)
}

/**
 * Suma días a una fecha
 */
export function sumarDias(fechaStr, dias) {
  const date = parseFechaArgentina(fechaStr)
  date.setDate(date.getDate() + dias)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  return formatter.format(date)
}

/**
 * Resta días a una fecha
 */
export function restarDias(fechaStr, dias) {
  return sumarDias(fechaStr, -dias)
}

/**
 * Obtiene el primer día de la semana (lunes)
 */
export function getPrimerDiaSemana(fechaStr) {
  const date = parseFechaArgentina(fechaStr)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day // Si es domingo, retroceder 6 días
  date.setDate(date.getDate() + diff)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  return formatter.format(date)
}

/**
 * Obtiene los días de una semana (lunes a domingo)
 */
export function getDiasSemana(fechaStr) {
  const primerDia = getPrimerDiaSemana(fechaStr)
  const dias = []
  for (let i = 0; i < 7; i++) {
    dias.push(sumarDias(primerDia, i))
  }
  return dias
}

/**
 * Verifica si una fecha es hoy
 */
export function esHoy(fechaStr) {
  return fechaStr === getFechaHoyArgentina()
}

/**
 * Verifica si una fecha es pasada
 */
export function esFechaPasada(fechaStr) {
  return fechaStr < getFechaHoyArgentina()
}

/**
 * Genera slots de tiempo entre dos horas
 * @param {string} horaInicio - HH:MM
 * @param {string} horaFin - HH:MM
 * @param {number} intervalo - minutos entre slots
 */
export function generarSlotsTiempo(horaInicio, horaFin, intervalo = 30) {
  const slots = []
  let [h, m] = horaInicio.split(':').map(Number)
  const [hFin, mFin] = horaFin.split(':').map(Number)

  while (h < hFin || (h === hFin && m < mFin)) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    m += intervalo
    if (m >= 60) {
      h += Math.floor(m / 60)
      m = m % 60
    }
  }

  return slots
}

/**
 * Suma minutos a una hora
 * @param {string} hora - HH:MM
 * @param {number} minutos
 * @returns {string} HH:MM
 */
export function sumarMinutosAHora(hora, minutos) {
  let [h, m] = hora.split(':').map(Number)
  m += minutos
  while (m >= 60) {
    h++
    m -= 60
  }
  while (m < 0) {
    h--
    m += 60
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Calcula diferencia en minutos entre dos horas
 */
export function diferenciaMinutos(horaInicio, horaFin) {
  const [h1, m1] = horaInicio.split(':').map(Number)
  const [h2, m2] = horaFin.split(':').map(Number)
  return (h2 * 60 + m2) - (h1 * 60 + m1)
}

/**
 * Formatea minutos como duración legible
 * 60 → "1h", 90 → "1h 30min", 30 → "30min"
 */
export function formatDuracion(minutos) {
  if (!minutos) return ''
  const horas = Math.floor(minutos / 60)
  const mins = minutos % 60
  if (horas === 0) return `${mins}min`
  if (mins === 0) return `${horas}h`
  return `${horas}h ${mins}min`
}

/**
 * Formatea día de la semana abreviado (Lun, Mar, etc)
 */
export function formatDiaSemana(fechaStr) {
  if (!fechaStr) return ''
  const date = parseFechaArgentina(fechaStr)
  const dia = new Intl.DateTimeFormat('es-AR', {
    timeZone: TIMEZONE,
    weekday: 'short'
  }).format(date)
  // Capitalizar primera letra
  return dia.charAt(0).toUpperCase() + dia.slice(1, 3)
}

/**
 * Formatea mes y año (Enero 2025)
 */
export function formatMesAnio(fechaStr) {
  if (!fechaStr) return ''
  const date = parseFechaArgentina(fechaStr)
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIMEZONE,
    month: 'long',
    year: 'numeric'
  }).format(date)
}

/**
 * Obtiene el primer día de un mes (YYYY-MM-01)
 */
export function getPrimerDiaMes(fechaStr) {
  const [anio, mes] = fechaStr.split('-')
  return `${anio}-${mes}-01`
}

/**
 * Obtiene el último día de un mes
 */
export function getUltimoDiaMes(fechaStr) {
  const [anio, mes] = fechaStr.split('-').map(Number)
  const ultimoDia = new Date(anio, mes, 0).getDate()
  return `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
}
