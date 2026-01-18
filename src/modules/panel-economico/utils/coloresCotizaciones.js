/**
 * Configuracion de colores e iconos para cotizaciones
 * Usa Lucide React icons (NO emojis)
 */

import {
  DollarSign,
  Building2,
  CreditCard,
  TrendingUp,
  Bitcoin,
  Landmark,
  Banknote,
  CircleDollarSign
} from 'lucide-react'

/**
 * Configuracion de cada tipo de cotizacion
 */
export const COTIZACIONES_CONFIG = {
  blue: {
    nombre: 'Blue',
    nombreCorto: 'Blue',
    icon: DollarSign,
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    gradiente: 'from-blue-500 to-blue-600',
    descripcion: 'Dolar paralelo o informal'
  },
  oficial: {
    nombre: 'Oficial',
    nombreCorto: 'Oficial',
    icon: Building2,
    bg: 'bg-emerald-500',
    bgLight: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    gradiente: 'from-emerald-500 to-emerald-600',
    descripcion: 'Cotizacion oficial del BCRA'
  },
  mayorista: {
    nombre: 'Mayorista',
    nombreCorto: 'Mayorista',
    icon: Landmark,
    bg: 'bg-teal-500',
    bgLight: 'bg-teal-50',
    text: 'text-teal-600',
    border: 'border-teal-200',
    gradiente: 'from-teal-500 to-teal-600',
    descripcion: 'Dolar mayorista BNA'
  },
  tarjeta: {
    nombre: 'Tarjeta',
    nombreCorto: 'Tarjeta',
    icon: CreditCard,
    bg: 'bg-violet-500',
    bgLight: 'bg-violet-50',
    text: 'text-violet-600',
    border: 'border-violet-200',
    gradiente: 'from-violet-500 to-violet-600',
    descripcion: 'Oficial + 60% impuestos'
  },
  mep: {
    nombre: 'MEP / Bolsa',
    nombreCorto: 'MEP',
    icon: TrendingUp,
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    gradiente: 'from-amber-500 to-amber-600',
    descripcion: 'Mercado Electronico de Pagos'
  },
  cripto: {
    nombre: 'Cripto',
    nombreCorto: 'Cripto',
    icon: Bitcoin,
    bg: 'bg-orange-500',
    bgLight: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    gradiente: 'from-orange-500 to-orange-600',
    descripcion: 'Dolar en exchanges crypto'
  },
  euro: {
    nombre: 'Euro',
    nombreCorto: 'Euro',
    icon: CircleDollarSign,
    bg: 'bg-indigo-500',
    bgLight: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-200',
    gradiente: 'from-indigo-500 to-indigo-600',
    descripcion: 'Cotizacion del Euro'
  },
  real: {
    nombre: 'Real',
    nombreCorto: 'Real',
    icon: Banknote,
    bg: 'bg-green-500',
    bgLight: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    gradiente: 'from-green-500 to-green-600',
    descripcion: 'Real brasileno'
  },
}

/**
 * Obtiene la configuracion de una cotizacion
 * @param {string} tipo - Tipo de cotizacion (blue, oficial, etc)
 * @returns {Object} Configuracion de la cotizacion
 */
export const getConfigCotizacion = (tipo) => {
  return COTIZACIONES_CONFIG[tipo] || COTIZACIONES_CONFIG.blue
}

/**
 * Obtiene todas las cotizaciones ordenadas para mostrar
 * @returns {Array} Lista de tipos de cotizacion en orden
 */
export const getOrdenCotizaciones = () => {
  return ['blue', 'oficial', 'mayorista', 'tarjeta', 'mep', 'cripto', 'euro', 'real']
}

/**
 * Obtiene solo las cotizaciones de dolar (sin otras monedas)
 * @returns {Array} Lista de tipos de dolar
 */
export const getCotizacionesDolar = () => {
  return ['blue', 'oficial', 'mayorista', 'tarjeta', 'mep', 'cripto']
}
