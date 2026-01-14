import { supabase } from '../../../lib/supabase'
import { getAcumulado12Meses } from './resumenService'
import { getCuotaMesActual } from './cuotaService'

/**
 * Tipos de eventos fiscales
 */
export const EVENTO_TIPO = {
  CUOTA_MONOTRIBUTO: 'cuota_monotributo',
  RECATEGORIZACION_PERIODICA: 'recategorizacion_periodica',
  ALERTA_RECATEGORIZACION: 'alerta_recategorizacion',
  RIESGO_EXCLUSION: 'riesgo_exclusion',
  VENCIMIENTO_IIBB: 'vencimiento_iibb',
  FACTURACION_PENDIENTE: 'facturacion_pendiente'
}

/**
 * Configuracion visual por tipo de evento
 */
export const EVENTO_CONFIG = {
  [EVENTO_TIPO.CUOTA_MONOTRIBUTO]: {
    label: 'Vencimiento cuota',
    color: 'violet',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-200',
    iconColor: 'text-violet-600'
  },
  [EVENTO_TIPO.RECATEGORIZACION_PERIODICA]: {
    label: 'Recategorizacion',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600'
  },
  [EVENTO_TIPO.ALERTA_RECATEGORIZACION]: {
    label: 'Alerta recategorizacion',
    color: 'amber',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-600'
  },
  [EVENTO_TIPO.RIESGO_EXCLUSION]: {
    label: 'Riesgo de exclusion',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600'
  },
  [EVENTO_TIPO.VENCIMIENTO_IIBB]: {
    label: 'Vencimiento IIBB',
    color: 'teal',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
    iconColor: 'text-teal-600'
  },
  [EVENTO_TIPO.FACTURACION_PENDIENTE]: {
    label: 'Facturacion pendiente',
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    iconColor: 'text-orange-600'
  }
}

/**
 * Obtiene la configuracion de alertas del sistema
 */
async function getAlertasConfig() {
  const { data, error } = await supabase
    .from('alertas_config')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    // Valores por defecto si no hay config
    return {
      alerta_recategorizacion_porcentaje: 80,
      alerta_exclusion_porcentaje: 90,
      dias_alerta_vencimiento_cuota: 5,
      dias_alerta_recategorizacion: 15,
      meses_alerta_facturacion_pendiente: 1
    }
  }

  return data
}

/**
 * Obtiene los vencimientos de Convenio Multilateral
 */
async function getVencimientosCM() {
  const { data } = await supabase
    .from('convenio_multilateral_vencimientos')
    .select('digitos_cuit, dia_vencimiento')
    .is('vigente_hasta', null)
    .order('orden')

  return data || []
}

/**
 * Obtiene el tope de facturacion para una categoria
 */
async function getTopeCategoria(categoria, tipoActividad) {
  const { data } = await supabase
    .from('monotributo_categorias')
    .select('tope_facturacion_anual, tope_facturacion_servicios')
    .eq('categoria', categoria)
    .is('vigente_hasta', null)
    .single()

  if (!data) return null

  const esServicios = tipoActividad === 'servicios'
  if (esServicios && data.tope_facturacion_servicios) {
    return parseFloat(data.tope_facturacion_servicios)
  }

  return parseFloat(data.tope_facturacion_anual)
}

/**
 * Obtiene el tope maximo (categoria K) para calculo de exclusion
 */
async function getTopeMaximo() {
  const { data } = await supabase
    .from('monotributo_categorias')
    .select('tope_facturacion_anual')
    .eq('categoria', 'K')
    .is('vigente_hasta', null)
    .single()

  return data ? parseFloat(data.tope_facturacion_anual) : null
}

/**
 * Calcula el dia de vencimiento IIBB segun CUIT
 */
function calcularDiaVencimientoIIBB(cuit, vencimientosCM) {
  if (!cuit || !vencimientosCM.length) return null

  // Obtener ultimo digito del CUIT (antes del verificador)
  const cuitLimpio = cuit.replace(/\D/g, '')
  const ultimoDigito = parseInt(cuitLimpio.charAt(cuitLimpio.length - 2))

  // Buscar el vencimiento correspondiente
  for (const v of vencimientosCM) {
    const [min, max] = v.digitos_cuit.split('-').map(Number)
    if (ultimoDigito >= min && ultimoDigito <= max) {
      return v.dia_vencimiento
    }
  }

  return null
}

/**
 * Calcula los dias restantes hasta una fecha
 */
function calcularDiasRestantes(fecha) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const target = new Date(fecha)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - hoy) / (1000 * 60 * 60 * 24))
}

/**
 * Formatea una fecha para mostrar
 */
function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Obtiene el nombre del mes
 */
function getNombreMes(mes) {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  return meses[mes - 1]
}

/**
 * Calcula la proxima fecha de recategorizacion (Enero o Julio)
 */
function calcularProximaRecategorizacion() {
  const hoy = new Date()
  const anio = hoy.getFullYear()
  const mes = hoy.getMonth() + 1

  // Vencimientos: 20 de Enero y 20 de Julio
  let proximaFecha
  let periodo

  if (mes < 1 || (mes === 1 && hoy.getDate() <= 20)) {
    // Proxima es Enero del año actual
    proximaFecha = new Date(anio, 0, 20)
    periodo = `Enero ${anio}`
  } else if (mes < 7 || (mes === 7 && hoy.getDate() <= 20)) {
    // Proxima es Julio del año actual
    proximaFecha = new Date(anio, 6, 20)
    periodo = `Julio ${anio}`
  } else {
    // Proxima es Enero del año siguiente
    proximaFecha = new Date(anio + 1, 0, 20)
    periodo = `Enero ${anio + 1}`
  }

  return { fecha: proximaFecha, periodo }
}

/**
 * Calcula todos los eventos fiscales proximos para un cliente
 * @param {string} clientId - ID del client_fiscal_data
 * @returns {Array} Lista de eventos ordenados por fecha
 */
export async function calcularEventosFiscales(clientId) {
  try {
    // Obtener datos del cliente
    const { data: cliente } = await supabase
      .from('client_fiscal_data')
      .select('categoria_monotributo, tipo_actividad, regimen_iibb, cuit, gestion_facturacion')
      .eq('id', clientId)
      .single()

    if (!cliente) return []

    // Obtener configuraciones
    const [config, vencimientosCM, tope, topeMaximo, acumulado, cuota] = await Promise.all([
      getAlertasConfig(),
      getVencimientosCM(),
      getTopeCategoria(cliente.categoria_monotributo, cliente.tipo_actividad),
      getTopeMaximo(),
      getAcumulado12Meses(clientId),
      getCuotaMesActual(clientId)
    ])

    const eventos = []
    const hoy = new Date()
    const anio = hoy.getFullYear()
    const mes = hoy.getMonth() + 1

    // 1. EVENTO: Vencimiento cuota monotributo (dia 20)
    const diaCuota = 20
    let fechaCuota = new Date(anio, mes - 1, diaCuota)

    // Si ya paso el dia 20, la proxima es el mes siguiente
    if (hoy.getDate() > diaCuota) {
      fechaCuota = new Date(anio, mes, diaCuota)
    }

    const diasCuota = calcularDiasRestantes(fechaCuota)
    const cuotaPagada = cuota?.estado === 'informada' || cuota?.estado === 'verificada'

    if (!cuotaPagada) {
      eventos.push({
        tipo: EVENTO_TIPO.CUOTA_MONOTRIBUTO,
        fecha: fechaCuota,
        fechaStr: formatearFecha(fechaCuota),
        diasRestantes: diasCuota,
        prioridad: diasCuota <= config.dias_alerta_vencimiento_cuota ? 'urgente' : 'normal',
        descripcion: `Cuota ${getNombreMes(fechaCuota.getMonth() + 1)} ${fechaCuota.getFullYear()}`,
        detalle: diasCuota <= 0 ? 'Vencida' : `Faltan ${diasCuota} dias`
      })
    }

    // 2. EVENTO: Recategorizacion periodica (Enero/Julio)
    const { fecha: fechaRecateg, periodo: periodoRecateg } = calcularProximaRecategorizacion()
    const diasRecateg = calcularDiasRestantes(fechaRecateg)

    if (diasRecateg <= 60) { // Mostrar si faltan 2 meses o menos
      eventos.push({
        tipo: EVENTO_TIPO.RECATEGORIZACION_PERIODICA,
        fecha: fechaRecateg,
        fechaStr: formatearFecha(fechaRecateg),
        diasRestantes: diasRecateg,
        prioridad: diasRecateg <= config.dias_alerta_recategorizacion ? 'urgente' : 'normal',
        descripcion: `Recategorizacion ${periodoRecateg}`,
        detalle: diasRecateg <= 0 ? 'Vencida' : `Faltan ${diasRecateg} dias`
      })
    }

    // 3. EVENTO: Alerta de recategorizacion por facturacion
    if (tope && acumulado) {
      const porcentaje = Math.round((acumulado.neto / tope) * 100)

      if (porcentaje >= config.alerta_recategorizacion_porcentaje && porcentaje < config.alerta_exclusion_porcentaje) {
        eventos.push({
          tipo: EVENTO_TIPO.ALERTA_RECATEGORIZACION,
          fecha: null, // Evento sin fecha especifica
          fechaStr: 'Revisar ahora',
          diasRestantes: 0,
          prioridad: 'urgente',
          descripcion: `Facturacion al ${porcentaje}% del tope`,
          detalle: `Categoria ${cliente.categoria_monotributo} - Evaluar recategorizacion`
        })
      }
    }

    // 4. EVENTO: Riesgo de exclusion
    if (topeMaximo && acumulado) {
      const porcentajeExclusion = Math.round((acumulado.neto / topeMaximo) * 100)

      if (porcentajeExclusion >= config.alerta_exclusion_porcentaje) {
        eventos.push({
          tipo: EVENTO_TIPO.RIESGO_EXCLUSION,
          fecha: null,
          fechaStr: 'Urgente',
          diasRestantes: -1,
          prioridad: 'critico',
          descripcion: `Facturacion al ${porcentajeExclusion}% del tope maximo`,
          detalle: 'Riesgo de exclusion del regimen - Consultar contador'
        })
      }
    }

    // 5. EVENTO: Vencimiento IIBB (si aplica)
    if (cliente.regimen_iibb === 'convenio_multilateral' || cliente.regimen_iibb === 'local') {
      const diaIIBB = calcularDiaVencimientoIIBB(cliente.cuit, vencimientosCM)

      if (diaIIBB) {
        let fechaIIBB = new Date(anio, mes - 1, diaIIBB)

        // Si ya paso, la proxima es el mes siguiente
        if (hoy.getDate() > diaIIBB) {
          fechaIIBB = new Date(anio, mes, diaIIBB)
        }

        const diasIIBB = calcularDiasRestantes(fechaIIBB)

        eventos.push({
          tipo: EVENTO_TIPO.VENCIMIENTO_IIBB,
          fecha: fechaIIBB,
          fechaStr: formatearFecha(fechaIIBB),
          diasRestantes: diasIIBB,
          prioridad: diasIIBB <= 5 ? 'urgente' : 'normal',
          descripcion: `DDJJ IIBB ${getNombreMes(fechaIIBB.getMonth() + 1)}`,
          detalle: diasIIBB <= 0 ? 'Vencida' : `Faltan ${diasIIBB} dias`
        })
      }
    }

    // 6. EVENTO: Facturacion pendiente de cargar
    if (cliente.gestion_facturacion === 'cliente' || cliente.gestion_facturacion === 'mixta') {
      // Verificar meses sin cargar
      const mesesAtras = config.meses_alerta_facturacion_pendiente || 1
      const { data: resumenes } = await supabase
        .from('client_facturacion_mensual_resumen')
        .select('anio, mes')
        .eq('client_id', clientId)
        .gte('anio', anio - 1)

      const mesesConCargas = new Set((resumenes || []).map(r => `${r.anio}-${r.mes}`))

      // Verificar ultimos N meses (excluyendo actual si estamos antes del 10)
      const mesesFaltantes = []
      for (let i = 1; i <= mesesAtras + 1; i++) {
        let mesCheck = mes - i
        let anioCheck = anio
        if (mesCheck <= 0) {
          mesCheck += 12
          anioCheck -= 1
        }
        if (!mesesConCargas.has(`${anioCheck}-${mesCheck}`)) {
          mesesFaltantes.push({ anio: anioCheck, mes: mesCheck })
        }
      }

      if (mesesFaltantes.length > 0) {
        const mesAntiguo = mesesFaltantes[mesesFaltantes.length - 1]
        eventos.push({
          tipo: EVENTO_TIPO.FACTURACION_PENDIENTE,
          fecha: null,
          fechaStr: 'Pendiente',
          diasRestantes: 0,
          prioridad: mesesFaltantes.length >= 2 ? 'urgente' : 'normal',
          descripcion: `${mesesFaltantes.length} mes${mesesFaltantes.length > 1 ? 'es' : ''} sin cargar`,
          detalle: `Desde ${getNombreMes(mesAntiguo.mes)} ${mesAntiguo.anio}`
        })
      }
    }

    // Ordenar por prioridad y fecha
    const prioridadOrden = { critico: 0, urgente: 1, normal: 2 }
    eventos.sort((a, b) => {
      // Primero por prioridad
      const pA = prioridadOrden[a.prioridad] ?? 2
      const pB = prioridadOrden[b.prioridad] ?? 2
      if (pA !== pB) return pA - pB

      // Luego por dias restantes (eventos sin fecha al final)
      if (a.diasRestantes === null && b.diasRestantes !== null) return 1
      if (a.diasRestantes !== null && b.diasRestantes === null) return -1
      return (a.diasRestantes || 0) - (b.diasRestantes || 0)
    })

    return eventos

  } catch (error) {
    console.error('Error calculando eventos fiscales:', error)
    return []
  }
}

/**
 * Calcula eventos fiscales para el usuario actual
 */
export async function getEventosFiscalesUsuario(userId) {
  const { data: clientData } = await supabase
    .from('client_fiscal_data')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!clientData) return []

  return calcularEventosFiscales(clientData.id)
}

/**
 * Genera calendario de eventos para todo el año
 * Evita duplicados combinando eventos recurrentes con los calculados
 */
export async function getCalendarioAnual(clientId) {
  const eventosCalculados = await calcularEventosFiscales(clientId)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const anio = hoy.getFullYear()

  // Mapa para evitar duplicados por tipo+mes
  const eventosMap = new Map()

  // Primero agregar eventos calculados (tienen mas detalle)
  eventosCalculados.forEach(e => {
    if (e.fecha) {
      const mes = new Date(e.fecha).getMonth()
      const key = `${e.tipo}-${mes}`
      eventosMap.set(key, e)
    } else {
      // Eventos sin fecha (alertas) - usar key unico
      eventosMap.set(`${e.tipo}-alert-${e.descripcion}`, e)
    }
  })

  // Agregar cuotas futuras que no esten ya calculadas
  for (let mes = 1; mes <= 12; mes++) {
    const fechaCuota = new Date(anio, mes - 1, 20)
    const key = `${EVENTO_TIPO.CUOTA_MONOTRIBUTO}-${mes - 1}`

    // Solo agregar si es futuro y no existe ya
    if (fechaCuota > hoy && !eventosMap.has(key)) {
      eventosMap.set(key, {
        tipo: EVENTO_TIPO.CUOTA_MONOTRIBUTO,
        fecha: fechaCuota,
        fechaStr: formatearFecha(fechaCuota),
        diasRestantes: calcularDiasRestantes(fechaCuota),
        prioridad: 'normal',
        descripcion: `Cuota ${getNombreMes(mes)}`,
        detalle: `Vence el 20/${mes.toString().padStart(2, '0')}`
      })
    }
  }

  // Agregar recategorizaciones futuras que no esten ya
  const recategorizaciones = [
    { mes: 0, periodo: 'Enero' },
    { mes: 6, periodo: 'Julio' }
  ]

  recategorizaciones.forEach(({ mes, periodo }) => {
    const fecha = new Date(anio, mes, 20)
    const key = `${EVENTO_TIPO.RECATEGORIZACION_PERIODICA}-${mes}`

    // Si ya paso, agregar la del año siguiente
    if (fecha <= hoy) {
      const fechaSiguiente = new Date(anio + 1, mes, 20)
      const keySiguiente = `${EVENTO_TIPO.RECATEGORIZACION_PERIODICA}-${mes}-next`
      if (!eventosMap.has(keySiguiente)) {
        eventosMap.set(keySiguiente, {
          tipo: EVENTO_TIPO.RECATEGORIZACION_PERIODICA,
          fecha: fechaSiguiente,
          fechaStr: formatearFecha(fechaSiguiente),
          diasRestantes: calcularDiasRestantes(fechaSiguiente),
          prioridad: 'normal',
          descripcion: `Recategorizacion ${periodo} ${anio + 1}`,
          detalle: `Vence el 20/${(mes + 1).toString().padStart(2, '0')}`
        })
      }
    } else if (!eventosMap.has(key)) {
      eventosMap.set(key, {
        tipo: EVENTO_TIPO.RECATEGORIZACION_PERIODICA,
        fecha: fecha,
        fechaStr: formatearFecha(fecha),
        diasRestantes: calcularDiasRestantes(fecha),
        prioridad: 'normal',
        descripcion: `Recategorizacion ${periodo} ${anio}`,
        detalle: `Vence el 20/${(mes + 1).toString().padStart(2, '0')}`
      })
    }
  })

  // Convertir mapa a array y ordenar
  const calendario = Array.from(eventosMap.values())

  calendario.sort((a, b) => {
    if (!a.fecha) return 1
    if (!b.fecha) return -1
    return new Date(a.fecha) - new Date(b.fecha)
  })

  return calendario
}
