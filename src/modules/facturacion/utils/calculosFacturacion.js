/**
 * Calcula el estado de alerta según porcentaje
 */
export function calcularEstadoAlerta(porcentaje, umbralRecategorizacion = 80, umbralExclusion = 90) {
  if (porcentaje >= umbralExclusion) {
    return {
      estado: 'exclusion',
      color: 'red',
      mensaje: 'Riesgo de exclusión del régimen'
    }
  }
  if (porcentaje >= umbralRecategorizacion) {
    return {
      estado: 'recategorizacion',
      color: 'yellow',
      mensaje: 'Cerca del límite, considerar recategorización'
    }
  }
  return {
    estado: 'ok',
    color: 'green',
    mensaje: 'Dentro del límite'
  }
}

/**
 * Obtiene la siguiente categoría
 */
export function getSiguienteCategoria(categoriaActual) {
  const categorias = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
  const index = categorias.indexOf(categoriaActual)
  if (index === -1 || index === categorias.length - 1) return null
  return categorias[index + 1]
}

/**
 * Calcula el monto que computa (ajustado o declarado)
 */
export function getMontoComputable(facturacion) {
  return facturacion.monto_ajustado ?? facturacion.monto_declarado ?? 0
}

/**
 * Verifica si un mes ya fue cargado
 */
export function isMesCargado(facturaciones, anio, mes) {
  return facturaciones.some(f => f.anio === anio && f.mes === mes)
}

/**
 * Obtiene el mes actual y anterior (para saber qué cargar)
 */
export function getMesesPendientes(facturaciones, cantidadMeses = 3) {
  const mesesPendientes = []
  const hoy = new Date()

  for (let i = 0; i < cantidadMeses; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const anio = fecha.getFullYear()
    const mes = fecha.getMonth() + 1

    if (!isMesCargado(facturaciones, anio, mes)) {
      mesesPendientes.push({ anio, mes })
    }
  }

  return mesesPendientes
}

/**
 * Nombre del mes en español
 */
export function getNombreMes(mes) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return meses[mes - 1] || ''
}
