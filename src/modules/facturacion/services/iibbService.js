import { supabase } from '../../../lib/supabase'

/**
 * Obtiene la facturación del mes anterior para un cliente
 * Usa la tabla client_facturacion_mensual_resumen que tiene el total_neto calculado
 * @param {string} clientId - ID del cliente
 * @returns {Promise<{monto: number, anio: number, mes: number}|null>}
 */
export async function getFacturacionMesAnterior(clientId) {
  try {
    const ahora = new Date()
    let anio = ahora.getFullYear()
    let mesActual = ahora.getMonth() + 1 // Convertir a 1-12

    // Calcular mes anterior
    let mesAnterior = mesActual - 1
    let anioAnterior = anio

    // Si el mes anterior es 0, es diciembre del año pasado
    if (mesAnterior === 0) {
      mesAnterior = 12
      anioAnterior = anio - 1
    }

    const { data, error } = await supabase
      .from('client_facturacion_mensual_resumen')
      .select('total_neto, anio, mes')
      .eq('client_id', clientId)
      .eq('anio', anioAnterior)
      .eq('mes', mesAnterior)
      .single()

    if (error) {
      // No hay facturación cargada para ese mes
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    const monto = data.total_neto ?? 0

    return {
      monto,
      anio: data.anio,
      mes: data.mes
    }
  } catch (error) {
    console.error('Error obteniendo facturación mes anterior:', error)
    return null
  }
}

/**
 * Calcula el IIBB estimado mensual para un cliente
 * Basado en la facturación del mes anterior
 * @param {string} clientId - ID del cliente
 * @param {number} facturacionMesAnterior - Facturación del mes anterior
 * @returns {Promise<{total: number, detalle: Array}>} - Monto estimado de IIBB y detalle por provincia
 */
export async function calcularIibbEstimado(clientId, facturacionMesAnterior) {
  try {
    // Obtener régimen del cliente
    const { data: cliente, error: clienteError } = await supabase
      .from('client_fiscal_data')
      .select('regimen_iibb')
      .eq('id', clientId)
      .single()

    if (clienteError) throw clienteError
    if (!cliente) return { total: 0, detalle: [] }

    const { regimen_iibb } = cliente

    // Solo calculamos para Local y CM
    if (regimen_iibb !== 'local' && regimen_iibb !== 'convenio_multilateral') {
      return { total: 0, detalle: [] }
    }

    // Obtener jurisdicciones configuradas
    const { data: jurisdicciones, error: jurisdiccionesError } = await supabase
      .from('client_iibb_jurisdicciones')
      .select('provincia, alicuota, coeficiente, es_sede')
      .eq('client_id', clientId)

    if (jurisdiccionesError) throw jurisdiccionesError
    if (!jurisdicciones || jurisdicciones.length === 0) return { total: 0, detalle: [] }

    let totalIibb = 0
    const detalle = []

    for (const jurisdiccion of jurisdicciones) {
      const alicuota = parseFloat(jurisdiccion.alicuota || 0)

      if (alicuota === 0) continue

      let iibbJurisdiccion = 0
      let baseImponible = facturacionMesAnterior

      if (regimen_iibb === 'convenio_multilateral') {
        // CM: base imponible = facturación * coeficiente / 100
        const coeficiente = parseFloat(jurisdiccion.coeficiente || 0)
        baseImponible = facturacionMesAnterior * (coeficiente / 100)
        iibbJurisdiccion = baseImponible * (alicuota / 100)
      } else {
        // Local: base imponible = facturación total
        iibbJurisdiccion = facturacionMesAnterior * (alicuota / 100)
      }

      totalIibb += iibbJurisdiccion

      detalle.push({
        provincia: jurisdiccion.provincia,
        coeficiente: jurisdiccion.coeficiente,
        alicuota,
        baseImponible,
        monto: iibbJurisdiccion
      })
    }

    return { total: totalIibb, detalle }
  } catch (error) {
    console.error('Error calculando IIBB estimado:', error)
    return { total: 0, detalle: [] }
  }
}

/**
 * Obtiene la fecha de vencimiento de IIBB según el último dígito del CUIT
 * @param {string} cuit - CUIT del cliente
 * @param {number} anio - Año
 * @param {number} mes - Mes (1-12)
 * @returns {Promise<Date|null>} - Fecha de vencimiento
 */
export async function getVencimientoIibb(cuit, anio, mes) {
  try {
    if (!cuit || cuit.length < 11) return null

    // Obtener último dígito del CUIT
    const ultimoDigito = parseInt(cuit.slice(-1))

    // Determinar el rango de dígitos
    let digitosRango = ''
    if (ultimoDigito === 0 || ultimoDigito === 1) digitosRango = '0-1'
    else if (ultimoDigito === 2 || ultimoDigito === 3) digitosRango = '2-3'
    else if (ultimoDigito === 4 || ultimoDigito === 5) digitosRango = '4-5'
    else if (ultimoDigito === 6 || ultimoDigito === 7) digitosRango = '6-7'
    else if (ultimoDigito === 8 || ultimoDigito === 9) digitosRango = '8-9'

    // Buscar en la tabla de vencimientos
    const { data: vencimiento, error } = await supabase
      .from('convenio_multilateral_vencimientos')
      .select('dia_vencimiento')
      .eq('digitos_cuit', digitosRango)
      .is('vigente_hasta', null)
      .single()

    if (error || !vencimiento) {
      // Si no hay config, usar defaults
      const defaultDias = {
        '0-1': 13,
        '2-3': 14,
        '4-5': 15,
        '6-7': 16,
        '8-9': 17
      }
      const dia = defaultDias[digitosRango] || 15

      // El vencimiento es el mes siguiente
      const fechaVencimiento = new Date(anio, mes, dia) // mes ya es 0-indexed en Date
      return fechaVencimiento
    }

    // El vencimiento de IIBB del mes X se paga en el mes X+1
    const fechaVencimiento = new Date(anio, mes, vencimiento.dia_vencimiento)
    return fechaVencimiento

  } catch (error) {
    console.error('Error obteniendo vencimiento IIBB:', error)
    return null
  }
}

/**
 * Calcula el estado de vencimiento del IIBB (similar a cuotaService)
 * @param {Date} fechaVencimiento - Fecha de vencimiento
 * @returns {Object} - { color, mensaje, diasRestantes }
 */
export function calcularEstadoVencimientoIibb(fechaVencimiento) {
  if (!fechaVencimiento) {
    return {
      color: 'gray',
      mensaje: 'Sin fecha',
      diasRestantes: 0
    }
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const vencimiento = new Date(fechaVencimiento)
  vencimiento.setHours(0, 0, 0, 0)

  const diffTime = vencimiento - hoy
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return {
      color: 'red',
      mensaje: 'Vencido',
      diasRestantes: 0
    }
  } else if (diffDays <= 5) {
    return {
      color: 'yellow',
      mensaje: `${diffDays} días`,
      diasRestantes: diffDays
    }
  } else {
    return {
      color: 'green',
      mensaje: `${diffDays} días`,
      diasRestantes: diffDays
    }
  }
}
