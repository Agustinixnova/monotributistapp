/**
 * Configuracion de categorias del sistema
 * Usa Lucide React icons (NO emojis)
 */

import {
  Home,
  UtensilsCrossed,
  Car,
  Heart,
  GraduationCap,
  PartyPopper,
  ShoppingBag,
  Briefcase,
  Receipt,
  Building2,
  Tv,
  Gift,
  PiggyBank,
  HelpCircle
} from 'lucide-react'

/**
 * Mapeo de nombre de categoria a icono Lucide
 */
export const CATEGORIA_ICONOS = {
  'Hogar': Home,
  'Comidas': UtensilsCrossed,
  'Transporte': Car,
  'Salud': Heart,
  'Educacion': GraduationCap,
  'Ocio': PartyPopper,
  'Compras': ShoppingBag,
  'Trabajo': Briefcase,
  'Monotributo': Receipt,
  'Alquiler y Servicios': Building2,
  'Suscripciones': Tv,
  'Regalos': Gift,
  'Ahorro': PiggyBank
}

/**
 * Tipos de ahorro disponibles
 */
export const TIPOS_AHORRO = [
  { value: '', label: 'No detallar' },
  { value: 'pesos', label: 'Pesos' },
  { value: 'dolares', label: 'Dólares' },
  { value: 'otros', label: 'Otros' }
]

/**
 * Obtener icono Lucide para una categoria
 * @param {string} nombre - Nombre de la categoria
 * @returns {Component} Componente Lucide
 */
export function getCategoriaIcono(nombre) {
  return CATEGORIA_ICONOS[nombre] || HelpCircle
}

/**
 * Mapeo de colores de categoria a clases de Tailwind
 */
export const CATEGORIA_COLORS = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    fill: '#3B82F6'
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300',
    fill: '#F97316'
  },
  cyan: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
    border: 'border-cyan-300',
    fill: '#06B6D4'
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
    fill: '#EF4444'
  },
  indigo: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    border: 'border-indigo-300',
    fill: '#6366F1'
  },
  pink: {
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    border: 'border-pink-300',
    fill: '#EC4899'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
    fill: '#A855F7'
  },
  slate: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    fill: '#64748B'
  },
  violet: {
    bg: 'bg-violet-100',
    text: 'text-violet-700',
    border: 'border-violet-300',
    fill: '#8B5CF6'
  },
  emerald: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    fill: '#10B981'
  },
  amber: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-300',
    fill: '#F59E0B'
  },
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    fill: '#6B7280'
  }
}

/**
 * Obtener clases de color para una categoria
 * @param {string} color - Nombre del color
 * @returns {Object} Clases de Tailwind
 */
export function getCategoriaColor(color) {
  return CATEGORIA_COLORS[color] || CATEGORIA_COLORS.gray
}

/**
 * Colores disponibles para categorias personalizadas
 */
export const COLORES_DISPONIBLES = [
  { value: 'blue', label: 'Azul', sample: 'bg-blue-500' },
  { value: 'orange', label: 'Naranja', sample: 'bg-orange-500' },
  { value: 'cyan', label: 'Celeste', sample: 'bg-cyan-500' },
  { value: 'red', label: 'Rojo', sample: 'bg-red-500' },
  { value: 'indigo', label: 'Indigo', sample: 'bg-indigo-500' },
  { value: 'pink', label: 'Rosa', sample: 'bg-pink-500' },
  { value: 'purple', label: 'Purpura', sample: 'bg-purple-500' },
  { value: 'slate', label: 'Gris', sample: 'bg-slate-500' },
  { value: 'violet', label: 'Violeta', sample: 'bg-violet-500' },
  { value: 'emerald', label: 'Verde', sample: 'bg-emerald-500' },
  { value: 'amber', label: 'Ambar', sample: 'bg-amber-500' }
]
