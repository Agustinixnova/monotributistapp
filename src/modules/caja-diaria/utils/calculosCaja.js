/**
 * Cálculos para caja diaria
 */

/**
 * Calcular total de un movimiento desde sus pagos
 */
export const calcularTotalMovimiento = (pagos) => {
  if (!pagos || pagos.length === 0) return 0
  return pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
}

/**
 * Calcular totales de efectivo desde movimientos
 */
export const calcularEfectivo = (movimientos) => {
  if (!movimientos || movimientos.length === 0) {
    return {
      entradas: 0,
      salidas: 0,
      saldo: 0
    }
  }

  let entradas = 0
  let salidas = 0

  movimientos.forEach(mov => {
    if (!mov.pagos) return

    mov.pagos.forEach(pago => {
      if (pago.metodo?.es_efectivo) {
        if (mov.tipo === 'entrada') {
          entradas += parseFloat(pago.monto || 0)
        } else {
          salidas += parseFloat(pago.monto || 0)
        }
      }
    })
  })

  return {
    entradas,
    salidas,
    saldo: entradas - salidas
  }
}

/**
 * Calcular totales digitales desde movimientos
 */
export const calcularDigital = (movimientos) => {
  if (!movimientos || movimientos.length === 0) {
    return {
      entradas: 0,
      salidas: 0,
      saldo: 0
    }
  }

  let entradas = 0
  let salidas = 0

  movimientos.forEach(mov => {
    if (!mov.pagos) return

    mov.pagos.forEach(pago => {
      if (!pago.metodo?.es_efectivo) {
        if (mov.tipo === 'entrada') {
          entradas += parseFloat(pago.monto || 0)
        } else {
          salidas += parseFloat(pago.monto || 0)
        }
      }
    })
  })

  return {
    entradas,
    salidas,
    saldo: entradas - salidas
  }
}

/**
 * Calcular totales generales desde movimientos
 */
export const calcularTotales = (movimientos) => {
  if (!movimientos || movimientos.length === 0) {
    return {
      entradas: 0,
      salidas: 0,
      saldo: 0
    }
  }

  let entradas = 0
  let salidas = 0

  movimientos.forEach(mov => {
    const monto = parseFloat(mov.monto_total || 0)
    if (mov.tipo === 'entrada') {
      entradas += monto
    } else {
      salidas += monto
    }
  })

  return {
    entradas,
    salidas,
    saldo: entradas - salidas
  }
}

/**
 * Calcular efectivo esperado en caja
 * saldoInicial + entradasEfectivo - salidasEfectivo
 */
export const calcularEfectivoEsperado = (saldoInicial, entradasEfectivo, salidasEfectivo) => {
  return parseFloat(saldoInicial || 0) + parseFloat(entradasEfectivo || 0) - parseFloat(salidasEfectivo || 0)
}

/**
 * Calcular diferencia de cierre
 * efectivoReal - efectivoEsperado
 */
export const calcularDiferenciaCierre = (efectivoReal, efectivoEsperado) => {
  return parseFloat(efectivoReal || 0) - parseFloat(efectivoEsperado || 0)
}

/**
 * Validar que los montos de pago sumen correctamente
 */
export const validarMontosPagos = (pagos) => {
  const total = calcularTotalMovimiento(pagos)
  const tieneMontos = pagos.some(p => parseFloat(p.monto || 0) > 0)

  return {
    valido: total > 0 && tieneMontos,
    total,
    mensaje: total <= 0 ? 'Debe ingresar al menos un monto' : ''
  }
}

/**
 * Agrupar movimientos por método de pago
 */
export const agruparPorMetodoPago = (movimientos) => {
  const resumen = {}

  movimientos.forEach(mov => {
    if (!mov.pagos) return

    mov.pagos.forEach(pago => {
      const metodoId = pago.metodo?.id
      if (!metodoId) return

      if (!resumen[metodoId]) {
        resumen[metodoId] = {
          metodo: pago.metodo,
          entradas: 0,
          salidas: 0,
          total: 0
        }
      }

      const monto = parseFloat(pago.monto || 0)
      if (mov.tipo === 'entrada') {
        resumen[metodoId].entradas += monto
        resumen[metodoId].total += monto
      } else {
        resumen[metodoId].salidas += monto
        resumen[metodoId].total -= monto
      }
    })
  })

  return Object.values(resumen)
}
