/**
 * Logica para generar consejos automaticos
 */

import { calcularVariacion, diasDesdeUltimoGasto, calcularUsoPresupuesto } from './calculosFinanzas'

/**
 * Tipos de consejos
 */
export const TIPO_CONSEJO = {
  INFO: 'info',
  ALERTA: 'alerta',
  PELIGRO: 'peligro',
  EXITO: 'exito',
  MOTIVACION: 'motivacion'
}

/**
 * Colores por tipo de consejo
 */
export const CONSEJO_COLORS = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-500'
  },
  alerta: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: 'text-amber-500'
  },
  peligro: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-500'
  },
  exito: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'text-green-500'
  },
  motivacion: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
    icon: 'text-violet-500'
  }
}

/**
 * Genera consejos basados en los datos del usuario
 * @param {Object} datos - Datos para analizar
 * @returns {Array} Array de consejos
 */
export function generarConsejos(datos) {
  const consejos = []

  const {
    gastosMesActual = [],
    gastosMesAnterior = [],
    categoriasMesActual = [],
    categoriasMesAnterior = [],
    totalMesActual = 0,
    totalMesAnterior = 0,
    ingresos = null,
    presupuestos = [],
    diasEnElMes = 30,
    diasRestantesMes = 15,
    esPrimerMes = false
  } = datos

  // 1. Categoria >30% del total
  categoriasMesActual.forEach(cat => {
    if (cat.porcentaje > 30) {
      consejos.push({
        tipo: TIPO_CONSEJO.INFO,
        mensaje: `${cat.categoria?.emoji || '📊'} ${cat.categoria?.nombre || 'Esta categoria'} se llevo el ${cat.porcentaje}% de tus gastos`,
        prioridad: 2
      })
    }
  })

  // 2. Sin registrar en 3+ dias
  const diasSinRegistrar = diasDesdeUltimoGasto(gastosMesActual)
  if (diasSinRegistrar >= 3 && diasSinRegistrar < Infinity) {
    consejos.push({
      tipo: TIPO_CONSEJO.MOTIVACION,
      mensaje: `¿Todo bien? Llevas ${diasSinRegistrar} dias sin registrar. Solo te lleva 15 segundos`,
      prioridad: 3
    })
  }

  // 3. Presupuesto al 80%
  presupuestos.forEach(pres => {
    const categoria = categoriasMesActual.find(c => c.categoria_id === pres.categoria_id)
    if (categoria) {
      const uso = calcularUsoPresupuesto(categoria.total, pres.monto_limite)
      if (uso.estado === 'alerta') {
        consejos.push({
          tipo: TIPO_CONSEJO.ALERTA,
          mensaje: `Vas por el ${uso.porcentaje}% de ${categoria.categoria?.nombre || 'tu presupuesto'}`,
          prioridad: 4
        })
      }
    }
  })

  // 4. Presupuesto al 100%+
  presupuestos.forEach(pres => {
    const categoria = categoriasMesActual.find(c => c.categoria_id === pres.categoria_id)
    if (categoria) {
      const uso = calcularUsoPresupuesto(categoria.total, pres.monto_limite)
      if (uso.estado === 'excedido') {
        consejos.push({
          tipo: TIPO_CONSEJO.PELIGRO,
          mensaje: `Llegaste al ${uso.porcentaje}% de ${categoria.categoria?.nombre || 'tu presupuesto'}. Quedan ${diasRestantesMes} dias`,
          prioridad: 5
        })
      }
    }
  })

  // 5. Ahorro en negativo
  if (ingresos) {
    const totalIngresos = (Number(ingresos.ingreso_principal) || 0) +
                          (Number(ingresos.otros_ingresos) || 0) +
                          (Number(ingresos.ingresos_extra) || 0)
    const ahorroReal = totalIngresos - totalMesActual

    if (totalIngresos > 0 && ahorroReal < 0) {
      consejos.push({
        tipo: TIPO_CONSEJO.PELIGRO,
        mensaje: 'Este mes el ahorro quedo en rojo. Gastaste mas de lo que ingresaste',
        prioridad: 6
      })
    }

    // 6. Meta de ahorro cumplida
    const objetivoPorcentaje = Number(ingresos.objetivo_ahorro_porcentaje) || 0
    const ahorroObjetivo = totalIngresos * (objetivoPorcentaje / 100)
    if (objetivoPorcentaje > 0 && ahorroReal >= ahorroObjetivo && totalIngresos > 0) {
      consejos.push({
        tipo: TIPO_CONSEJO.EXITO,
        mensaje: `Felicitaciones! Vas cumpliendo tu objetivo de ahorro`,
        prioridad: 1
      })
    }
  }

  // 7. Aumento >20% vs mes anterior en alguna categoria
  categoriasMesActual.forEach(catActual => {
    const catAnterior = categoriasMesAnterior.find(c => c.categoria_id === catActual.categoria_id)
    if (catAnterior && catAnterior.total > 0) {
      const variacion = calcularVariacion(catActual.total, catAnterior.total)
      if (variacion.porcentaje > 20) {
        consejos.push({
          tipo: TIPO_CONSEJO.ALERTA,
          mensaje: `Gastaste ${variacion.porcentaje}% mas en ${catActual.categoria?.nombre || 'una categoria'} que el mes pasado`,
          prioridad: 3
        })
      }
    }
  })

  // 8. Primer mes completo
  if (esPrimerMes && gastosMesActual.length >= 10) {
    consejos.push({
      tipo: TIPO_CONSEJO.EXITO,
      mensaje: 'Completaste tu primer mes registrando! Ahora tenes data real para analizar',
      prioridad: 1
    })
  }

  // 9. >40% en credito
  const gastosPorMetodo = gastosMesActual.reduce((acc, g) => {
    const monto = g.es_compartido && g.monto_real ? Number(g.monto_real) : Number(g.monto)
    acc[g.metodo_pago] = (acc[g.metodo_pago] || 0) + monto
    return acc
  }, {})

  if (totalMesActual > 0) {
    const porcentajeCredito = Math.round(((gastosPorMetodo.credito || 0) / totalMesActual) * 100)
    if (porcentajeCredito > 40) {
      consejos.push({
        tipo: TIPO_CONSEJO.INFO,
        mensaje: `El ${porcentajeCredito}% de tus gastos son con credito. Recorda que esa plata la vas a necesitar el mes que viene`,
        prioridad: 2
      })
    }
  }

  // Ordenar por prioridad (menor = mas importante)
  consejos.sort((a, b) => a.prioridad - b.prioridad)

  return consejos
}

/**
 * Obtiene el color de un tipo de consejo
 * @param {string} tipo - Tipo de consejo
 * @returns {Object} Clases de color
 */
export function getConsejoColors(tipo) {
  return CONSEJO_COLORS[tipo] || CONSEJO_COLORS.info
}
