/**
 * Funciones de calculo para finanzas personales
 */

/**
 * Calcula el total de gastos de un array
 * @param {Array} gastos - Array de gastos
 * @returns {number} Total
 */
export function calcularTotalGastos(gastos) {
  if (!gastos || gastos.length === 0) return 0

  return gastos.reduce((total, gasto) => {
    // Si es compartido, usar monto_real, sino monto
    const monto = gasto.es_compartido && gasto.monto_real
      ? Number(gasto.monto_real)
      : Number(gasto.monto)
    return total + monto
  }, 0)
}

/**
 * Agrupa gastos por categoria
 * @param {Array} gastos - Array de gastos con categoria
 * @returns {Array} Array ordenado por total desc
 */
export function agruparPorCategoria(gastos) {
  if (!gastos || gastos.length === 0) return []

  const agrupado = {}

  gastos.forEach(gasto => {
    const catId = gasto.categoria_id
    const categoria = gasto.fp_categorias || gasto.categoria || {}
    const monto = gasto.es_compartido && gasto.monto_real
      ? Number(gasto.monto_real)
      : Number(gasto.monto)

    if (!agrupado[catId]) {
      agrupado[catId] = {
        categoria_id: catId,
        // Datos de la categoria para mostrar
        nombre: categoria.nombre || 'Sin categoria',
        icono: categoria.emoji || categoria.icono || '💰',
        color: categoria.color || 'gray',
        total: 0,
        cantidad: 0
      }
    }

    agrupado[catId].total += monto
    agrupado[catId].cantidad += 1
  })

  return Object.values(agrupado).sort((a, b) => b.total - a.total)
}

/**
 * Agrupa gastos por metodo de pago
 * @param {Array} gastos - Array de gastos
 * @returns {Object} Objeto con totales por metodo
 */
export function agruparPorMetodoPago(gastos) {
  if (!gastos || gastos.length === 0) return []

  const agrupado = {}

  gastos.forEach(gasto => {
    const metodo = gasto.metodo_pago || 'efectivo'
    const monto = gasto.es_compartido && gasto.monto_real
      ? Number(gasto.monto_real)
      : Number(gasto.monto)

    if (!agrupado[metodo]) {
      agrupado[metodo] = { metodo, total: 0, cantidad: 0 }
    }
    agrupado[metodo].total += monto
    agrupado[metodo].cantidad += 1
  })

  return Object.values(agrupado).sort((a, b) => b.total - a.total)
}

/**
 * Calcula el porcentaje de cada categoria sobre el total
 * @param {Array} categorias - Array de categorias agrupadas
 * @param {number} total - Total de gastos
 * @returns {Array} Array con porcentaje agregado
 */
export function calcularPorcentajes(categorias, total) {
  if (!categorias || total === 0) return []

  return categorias.map(cat => ({
    ...cat,
    porcentaje: Math.round((cat.total / total) * 100)
  }))
}

/**
 * Calcula el ahorro real vs objetivo
 * @param {Object} ingresos - Objeto de ingresos del mes
 * @param {number} totalGastos - Total de gastos del mes
 * @param {number} totalInvertidoAhorro - Total invertido en categoria Ahorro
 * @returns {Object} Resultado del calculo
 */
export function calcularAhorro(ingresos, totalGastos, totalInvertidoAhorro = 0) {
  if (!ingresos) return null

  const totalIngresos = (Number(ingresos.ingreso_principal) || 0) +
                        (Number(ingresos.otros_ingresos) || 0) +
                        (Number(ingresos.ingresos_extra) || 0)

  // Si no hay ingresos cargados, retornar null
  if (totalIngresos === 0) return null

  const objetivoPorcentaje = Number(ingresos.objetivo_ahorro_porcentaje) || 0
  const ahorroObjetivo = totalIngresos * (objetivoPorcentaje / 100)
  const monto = totalIngresos - totalGastos // Saldo disponible
  const diferencia = monto - ahorroObjetivo

  // Progreso del objetivo de ahorro
  const faltaParaObjetivo = Math.max(0, ahorroObjetivo - totalInvertidoAhorro)
  const porcentajeObjetivoCumplido = ahorroObjetivo > 0
    ? Math.min(100, Math.round((totalInvertidoAhorro / ahorroObjetivo) * 100))
    : 0

  return {
    totalIngresos,
    totalGastos,
    ahorroObjetivo,
    monto, // Saldo disponible (ingresos - gastos)
    diferencia,
    objetivoPorcentaje,
    cumpleObjetivo: monto >= ahorroObjetivo,
    // Nuevos campos para tracking de ahorro
    totalInvertidoAhorro, // Lo que efectivamente se invirtio en categoria Ahorro
    faltaParaObjetivo, // Cuanto falta para cumplir objetivo
    porcentajeObjetivoCumplido, // % del objetivo cumplido
    objetivoCumplido: totalInvertidoAhorro >= ahorroObjetivo
  }
}

/**
 * Calcula el total invertido en categoria Ahorro
 * @param {Array} gastos - Array de gastos del mes
 * @returns {number} Total invertido en ahorro
 */
export function calcularTotalAhorro(gastos) {
  if (!gastos || gastos.length === 0) return 0

  return gastos.reduce((total, gasto) => {
    const categoria = gasto.fp_categorias || gasto.categoria || {}
    if (categoria.nombre === 'Ahorro') {
      const monto = gasto.es_compartido && gasto.monto_real
        ? Number(gasto.monto_real)
        : Number(gasto.monto)
      return total + monto
    }
    return total
  }, 0)
}

/**
 * Calcula la variacion porcentual entre dos valores
 * @param {number} actual - Valor actual
 * @param {number} anterior - Valor anterior
 * @returns {Object} Variacion y direccion
 */
export function calcularVariacion(actual, anterior) {
  if (!anterior || anterior === 0) {
    return { porcentaje: 0, direccion: 'igual', texto: 'Sin datos previos' }
  }

  const diferencia = actual - anterior
  const porcentaje = Math.round((diferencia / anterior) * 100)

  let direccion = 'igual'
  let texto = 'Igual que el mes pasado'

  if (porcentaje > 0) {
    direccion = 'mas'
    texto = `${porcentaje}% mas que el mes pasado`
  } else if (porcentaje < 0) {
    direccion = 'menos'
    texto = `${Math.abs(porcentaje)}% menos que el mes pasado`
  }

  return { porcentaje, direccion, texto, diferencia }
}

/**
 * Obtiene el top N de categorias por gasto
 * @param {Array} categorias - Array de categorias agrupadas
 * @param {number} n - Cantidad a obtener
 * @returns {Array} Top N categorias
 */
export function getTopCategorias(categorias, n = 3) {
  return categorias.slice(0, n)
}

/**
 * Compara categorias entre dos meses y encuentra la de mayor variacion
 * @param {Array} categoriasActual - Categorias del mes actual
 * @param {Array} categoriasAnterior - Categorias del mes anterior
 * @returns {Object} Categoria con mayor variacion y mensaje
 */
export function calcularVariacionCategorias(categoriasActual, categoriasAnterior) {
  if (!categoriasActual?.length || !categoriasAnterior?.length) {
    return null
  }

  // Crear mapa del mes anterior para buscar rapido
  const mapaAnterior = {}
  categoriasAnterior.forEach(cat => {
    mapaAnterior[cat.categoria_id] = cat.total
  })

  // Calcular variacion para cada categoria
  const variaciones = categoriasActual.map(cat => {
    const totalAnterior = mapaAnterior[cat.categoria_id] || 0
    const diferencia = cat.total - totalAnterior
    const porcentaje = totalAnterior > 0
      ? Math.round((diferencia / totalAnterior) * 100)
      : (cat.total > 0 ? 100 : 0)

    return {
      ...cat,
      totalAnterior,
      diferencia,
      porcentajeCambio: porcentaje
    }
  })

  // Encontrar la de mayor aumento (positivo)
  const mayorAumento = variaciones
    .filter(v => v.diferencia > 0)
    .sort((a, b) => b.diferencia - a.diferencia)[0]

  // Encontrar la de mayor reduccion (negativo)
  const mayorReduccion = variaciones
    .filter(v => v.diferencia < 0)
    .sort((a, b) => a.diferencia - b.diferencia)[0]

  return {
    variaciones,
    mayorAumento,
    mayorReduccion
  }
}

/**
 * Calcula dias desde el ultimo gasto
 * @param {Array} gastos - Array de gastos ordenados por fecha desc
 * @returns {number} Dias desde el ultimo gasto
 */
export function diasDesdeUltimoGasto(gastos) {
  if (!gastos || gastos.length === 0) return Infinity

  const ultimoGasto = gastos[0]
  const fechaUltimo = new Date(ultimoGasto.fecha + 'T00:00:00')
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const diffTime = hoy - fechaUltimo
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Calcula el porcentaje usado de un presupuesto
 * @param {number} gastado - Monto gastado
 * @param {number} presupuesto - Monto presupuestado
 * @returns {Object} Porcentaje y estado
 */
export function calcularUsoPresupuesto(gastado, presupuesto) {
  if (!presupuesto || presupuesto === 0) {
    return { porcentaje: 0, estado: 'sin_presupuesto' }
  }

  const porcentaje = Math.round((gastado / presupuesto) * 100)

  let estado = 'ok'
  if (porcentaje >= 100) estado = 'excedido'
  else if (porcentaje >= 80) estado = 'alerta'

  return { porcentaje, estado, restante: presupuesto - gastado }
}
