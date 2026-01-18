/**
 * Configuracion de metodos de pago
 */

import { Banknote, CreditCard, Smartphone } from 'lucide-react'

/**
 * Metodos de pago disponibles (como objeto para facilitar acceso)
 */
export const METODOS_PAGO = {
  efectivo: {
    label: 'Efectivo',
    icon: Banknote,
    color: 'green',
    bgSelected: 'bg-green-100',
    borderSelected: 'border-green-300',
    textSelected: 'text-green-700'
  },
  debito: {
    label: 'Debito',
    icon: CreditCard,
    color: 'blue',
    bgSelected: 'bg-blue-100',
    borderSelected: 'border-blue-300',
    textSelected: 'text-blue-700'
  },
  credito: {
    label: 'Credito',
    icon: CreditCard,
    color: 'purple',
    bgSelected: 'bg-purple-100',
    borderSelected: 'border-purple-300',
    textSelected: 'text-purple-700'
  },
  transferencia: {
    label: 'Transferencia/QR',
    icon: Smartphone,
    color: 'cyan',
    bgSelected: 'bg-cyan-100',
    borderSelected: 'border-cyan-300',
    textSelected: 'text-cyan-700'
  }
}

/**
 * Lista de metodos de pago (para iterar)
 */
export const METODOS_PAGO_LIST = Object.entries(METODOS_PAGO).map(([key, config]) => ({
  value: key,
  ...config
}))

/**
 * Obtener configuracion de un metodo de pago
 * @param {string} value - Valor del metodo
 * @returns {Object} Configuracion del metodo
 */
export function getMetodoPago(value) {
  return METODOS_PAGO[value] || METODOS_PAGO.efectivo
}

/**
 * Colores para graficos de metodos de pago
 */
export const METODO_PAGO_COLORS = {
  efectivo: '#22C55E',
  debito: '#3B82F6',
  credito: '#A855F7',
  transferencia: '#06B6D4'
}
