import { supabase } from '../../../lib/supabase'

/**
 * Obtiene las instrucciones de pago del mes actual para un cliente
 * @param {string} clientId - ID del cliente
 * @returns {Promise<{monotributo: Object|null, iibb: Object|null}>}
 */
export async function getInstruccionesMesActual(clientId) {
  const ahora = new Date()
  const anio = ahora.getFullYear()
  const mes = ahora.getMonth() + 1

  const { data, error } = await supabase
    .from('client_instrucciones_pago')
    .select('*')
    .eq('client_id', clientId)
    .eq('anio', anio)
    .eq('mes', mes)

  if (error) {
    console.error('Error obteniendo instrucciones de pago:', error)
    return { monotributo: null, iibb: null }
  }

  // Separar por tipo
  const monotributo = data?.find(i => i.tipo === 'monotributo') || null
  const iibb = data?.find(i => i.tipo === 'iibb') || null

  return { monotributo, iibb }
}

/**
 * Obtiene las instrucciones de pago para el cliente logueado
 * @returns {Promise<{monotributo: Object|null, iibb: Object|null}>}
 */
export async function getInstruccionesCliente() {
  // Obtener el client_id del usuario logueado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { monotributo: null, iibb: null }

  const { data: clientData, error: clientError } = await supabase
    .from('client_fiscal_data')
    .select('id, regimen_iibb')
    .eq('user_id', user.id)
    .single()

  if (clientError || !clientData) {
    return { monotributo: null, iibb: null }
  }

  const instrucciones = await getInstruccionesMesActual(clientData.id)

  // Si el cliente NO tiene régimen local o convenio multilateral, no mostrar IIBB
  const tieneIibb = clientData.regimen_iibb === 'local' || clientData.regimen_iibb === 'convenio_multilateral'

  return {
    monotributo: instrucciones.monotributo,
    iibb: tieneIibb ? instrucciones.iibb : null
  }
}

/**
 * Guarda o actualiza instrucciones de pago
 * @param {string} clientId - ID del cliente
 * @param {string} tipo - 'monotributo' o 'iibb'
 * @param {Object} datos - Datos de las instrucciones
 * @returns {Promise<Object>}
 */
export async function guardarInstrucciones(clientId, tipo, datos) {
  const ahora = new Date()
  const anio = ahora.getFullYear()
  const mes = ahora.getMonth() + 1

  const { data: { user } } = await supabase.auth.getUser()

  const payload = {
    client_id: clientId,
    tipo,
    metodo_pago: datos.metodo_pago,
    vep_numero: datos.vep_numero || null,
    vep_monto: datos.vep_monto || null,
    vep_vencimiento: datos.vep_vencimiento || null,
    mercadopago_numero: datos.mercadopago_numero || null,
    mercadopago_vencimiento: datos.mercadopago_vencimiento || null,
    cpe_codigo: datos.cpe_codigo || null,
    efectivo_boleta_url: datos.efectivo_boleta_url || null,
    notas: datos.notas || null,
    anio,
    mes,
    created_by: user?.id
  }

  // Upsert basado en el constraint único (client_id, tipo, anio, mes)
  const { data, error } = await supabase
    .from('client_instrucciones_pago')
    .upsert(payload, {
      onConflict: 'client_id,tipo,anio,mes',
      ignoreDuplicates: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error guardando instrucciones:', error)
    throw error
  }

  return data
}

/**
 * Elimina instrucciones de pago para un cliente/tipo/mes
 * @param {string} clientId - ID del cliente
 * @param {string} tipo - 'monotributo' o 'iibb'
 */
export async function eliminarInstrucciones(clientId, tipo) {
  const ahora = new Date()
  const anio = ahora.getFullYear()
  const mes = ahora.getMonth() + 1

  const { error } = await supabase
    .from('client_instrucciones_pago')
    .delete()
    .eq('client_id', clientId)
    .eq('tipo', tipo)
    .eq('anio', anio)
    .eq('mes', mes)

  if (error) {
    console.error('Error eliminando instrucciones:', error)
    throw error
  }
}

/**
 * Genera el texto de instrucciones de pago para enviar por Buzón
 * @param {Object} instruccionesMonotributo - Instrucciones de monotributo
 * @param {Object} instruccionesIibb - Instrucciones de IIBB
 * @param {string} mesNombre - Nombre del mes
 * @returns {string}
 */
export function generarTextoInstrucciones(instruccionesMonotributo, instruccionesIibb, mesNombre) {
  let texto = `Instrucciones de pago - ${mesNombre}\n\n`

  if (instruccionesMonotributo) {
    texto += `MONOTRIBUTO\n`
    texto += generarTextoMetodo(instruccionesMonotributo)
    texto += '\n'
  }

  if (instruccionesIibb) {
    texto += `INGRESOS BRUTOS\n`
    texto += generarTextoMetodo(instruccionesIibb)
    texto += '\n'
  }

  return texto
}

/**
 * Genera el texto según el método de pago
 */
function generarTextoMetodo(instrucciones) {
  let texto = ''

  switch (instrucciones.metodo_pago) {
    case 'debito_automatico':
      texto += 'Asegurate de tener saldo en tu cuenta para que se debite correctamente.\n'
      texto += 'En caso de no contar con saldo, se generará una deuda y se sumarán intereses.\n'
      break

    case 'vep':
      texto += 'Pagá con el siguiente VEP:\n'
      if (instrucciones.vep_numero) {
        texto += `Número de VEP: ${instrucciones.vep_numero}\n`
      }
      if (instrucciones.vep_monto) {
        texto += `Monto: $${instrucciones.vep_monto.toLocaleString('es-AR')}\n`
      }
      if (instrucciones.vep_vencimiento) {
        const fecha = new Date(instrucciones.vep_vencimiento)
        texto += `Vence: ${fecha.toLocaleDateString('es-AR')}\n`
      }
      break

    case 'mercado_pago':
      texto += 'Pagá con Mercado Pago:\n'
      if (instrucciones.mercadopago_numero) {
        texto += `Número de Mercado Pago: ${instrucciones.mercadopago_numero}\n`
      }
      break

    case 'efectivo':
      texto += 'Pagá en efectivo (Rapipago, PagoFacil, etc.):\n'
      if (instrucciones.cpe_codigo) {
        texto += `Código de pago: ${instrucciones.cpe_codigo}\n`
      }
      break

    default:
      texto += 'Consultá con tu contador/a.\n'
  }

  if (instrucciones.notas) {
    texto += `\nNota: ${instrucciones.notas}\n`
  }

  return texto
}

/**
 * Labels para métodos de pago
 */
export const METODOS_PAGO = {
  debito_automatico: {
    label: 'Débito automático',
    descripcion: 'Se debita de la cuenta bancaria'
  },
  vep: {
    label: 'VEP',
    descripcion: 'Volante Electrónico de Pago'
  },
  mercado_pago: {
    label: 'Mercado Pago',
    descripcion: 'Link de pago de Mercado Pago'
  },
  efectivo: {
    label: 'Efectivo',
    descripcion: 'Rapipago, PagoFacil, etc.'
  }
}
