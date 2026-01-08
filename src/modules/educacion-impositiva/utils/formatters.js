/**
 * Formatear fecha en formato DD-MM-AAAA
 */
export function formatFecha(fecha) {
  if (!fecha) return '-'
  try {
    const date = new Date(fecha)
    const dia = date.getDate().toString().padStart(2, '0')
    const mes = (date.getMonth() + 1).toString().padStart(2, '0')
    const anio = date.getFullYear()
    return `${dia}-${mes}-${anio}`
  } catch {
    return '-'
  }
}

/**
 * Formatear fecha con hora
 */
export function formatFechaHora(fecha) {
  if (!fecha) return '-'
  try {
    const date = new Date(fecha)
    const dia = date.getDate().toString().padStart(2, '0')
    const mes = (date.getMonth() + 1).toString().padStart(2, '0')
    const anio = date.getFullYear()
    const hora = date.getHours().toString().padStart(2, '0')
    const min = date.getMinutes().toString().padStart(2, '0')
    return `${dia}-${mes}-${anio} ${hora}:${min}`
  } catch {
    return '-'
  }
}

/**
 * Formatear fecha relativa (hace X tiempo)
 */
export function formatFechaRelativa(fecha) {
  if (!fecha) return '-'
  try {
    const date = new Date(fecha)
    const ahora = new Date()
    const diffMs = ahora - date
    const diffSeg = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSeg / 60)
    const diffHora = Math.floor(diffMin / 60)
    const diffDia = Math.floor(diffHora / 24)
    const diffSemana = Math.floor(diffDia / 7)
    const diffMes = Math.floor(diffDia / 30)

    if (diffMin < 1) return 'Hace un momento'
    if (diffMin < 60) return `Hace ${diffMin} min`
    if (diffHora < 24) return `Hace ${diffHora}h`
    if (diffDia === 1) return 'Ayer'
    if (diffDia < 7) return `Hace ${diffDia} dias`
    if (diffSemana === 1) return 'Hace 1 semana'
    if (diffSemana < 4) return `Hace ${diffSemana} semanas`
    if (diffMes === 1) return 'Hace 1 mes'
    if (diffMes < 12) return `Hace ${diffMes} meses`

    return formatFecha(fecha)
  } catch {
    return '-'
  }
}

/**
 * Estimar tiempo de lectura
 */
export function estimarTiempoLectura(contenido) {
  if (!contenido) return '1 min'

  // Extraer texto del contenido TipTap
  let texto = ''
  try {
    if (typeof contenido === 'string') {
      contenido = JSON.parse(contenido)
    }

    const extraerTexto = (node) => {
      if (node.text) {
        texto += node.text + ' '
      }
      if (node.content) {
        node.content.forEach(extraerTexto)
      }
    }

    if (contenido.content) {
      contenido.content.forEach(extraerTexto)
    }
  } catch {
    return '1 min'
  }

  // Calcular palabras (promedio 200 palabras por minuto)
  const palabras = texto.trim().split(/\s+/).length
  const minutos = Math.ceil(palabras / 200)

  return `${minutos} min`
}

/**
 * Truncar texto
 */
export function truncarTexto(texto, maxLength = 150) {
  if (!texto) return ''
  if (texto.length <= maxLength) return texto
  return texto.substring(0, maxLength).trim() + '...'
}

/**
 * Formatear nombre de autor
 */
export function formatNombreAutor(autor) {
  if (!autor) return 'Desconocido'
  if (autor.nombre && autor.apellido) {
    return `${autor.nombre} ${autor.apellido}`
  }
  return autor.nombre || autor.apellido || autor.email || 'Desconocido'
}
