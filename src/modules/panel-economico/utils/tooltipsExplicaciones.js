/**
 * Explicaciones de cada tipo de cotización e indicador
 * Para mostrar en tooltips informativos
 */

export const EXPLICACIONES = {
  // Cotizaciones de dólar
  blue: {
    titulo: '💵 Dólar Blue',
    texto: 'Es el dólar que se compra y vende en la calle (informal). No lo fija el gobierno.'
  },
  oficial: {
    titulo: '🇦🇷 Dólar Oficial',
    texto: 'Es el dólar que fija el gobierno y se usa para algunas importaciones y pagos oficiales.'
  },
  mayorista: {
    titulo: '🏭 Dólar Mayorista',
    texto: 'Es el dólar al que bancos y empresas grandes se compran y venden entre sí. Marca el piso del resto de los dólares.'
  },
  tarjeta: {
    titulo: '💳 Dólar Tarjeta',
    texto: 'Es el dólar que pagás cuando gastás con tarjeta en el exterior o en dólares. Incluye impuestos.'
  },
  mep: {
    titulo: '📈 Dólar MEP (Bolsa)',
    texto: 'Dólar legal que comprás comprando y vendiendo bonos desde tu cuenta de inversión.'
  },
  cripto: {
    titulo: '🪙 Dólar Cripto',
    texto: 'Precio del dólar que surge al comprar y vender dólares a través de cripto (USDT, por ejemplo).'
  },
  euro: {
    titulo: '🇪🇺 Cotización del Euro',
    texto: 'Cuántos pesos vale 1 euro hoy en el mercado argentino.'
  },
  real: {
    titulo: '🇧🇷 Cotización del Real',
    texto: 'Cuántos pesos vale 1 real brasileño hoy.'
  },

  // Indicadores económicos
  inflacion: {
    titulo: '📉 Inflación del último mes',
    texto: 'Cuánto subieron los precios en promedio el último mes según el INDEC.'
  },
  inflacionInteranual: {
    titulo: '📊 Inflación Interanual',
    texto: 'Cuánto subieron los precios en los últimos 12 meses. Compara el mes actual con el mismo mes del año anterior.'
  },
  uva: {
    titulo: '🏠 Índice UVA',
    texto: 'Unidad de Valor Adquisitivo. Se ajusta diariamente por inflación. Se usa para créditos hipotecarios y algunos plazos fijos.'
  },
  riesgoPais: {
    titulo: '⚠️ Riesgo País',
    texto: 'Mide qué tan "riesgoso" es prestarle plata a Argentina según el mercado internacional. Cuanto más alto, peor.'
  },
  tasas: {
    titulo: '💰 Tasa Plazo Fijo (TNA)',
    texto: 'Tasa Nominal Anual que pagan los bancos por un plazo fijo tradicional a 30 días.'
  },

  // Calculadora IPC
  calculadoraIPC: {
    titulo: '📊 Calculadora de Ajuste por IPC',
    texto: 'El IPC (Índice de Precios al Consumidor) mide la inflación oficial. Esta calculadora te ayuda a saber cuánto deberías cobrar HOY para mantener el mismo poder adquisitivo que tenías antes. Por ejemplo: si cobrabas $100.000 hace 6 meses y la inflación acumulada fue 30%, hoy deberías cobrar $130.000 para tener el mismo "poder de compra".'
  }
}
