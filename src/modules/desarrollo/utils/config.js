// =============================================
// CONFIGURACIÓN SIMPLIFICADA - MÓDULO DESARROLLO
// =============================================

import {
  Lightbulb,
  ClipboardList,
  Wrench,
  Eye,
  Rocket,
  AlertCircle,
  AlertTriangle,
  MessageCircle,
  Circle,
  PlayCircle,
  TestTube,
  CheckCircle,
  Clock,
  Inbox
} from 'lucide-react'

// Mapeo de iconos Lucide
export const ICON_MAP = {
  Lightbulb,
  ClipboardList,
  Wrench,
  Eye,
  Rocket,
  AlertCircle,
  AlertTriangle,
  MessageCircle,
  Circle,
  PlayCircle,
  TestTube,
  CheckCircle,
  Clock,
  Inbox
}

export const getIcon = (iconName) => ICON_MAP[iconName] || Circle

// Etapas del tablero (4 columnas)
export const ETAPAS = [
  { id: 'idea', nombre: 'Idea', icon: 'Lightbulb', color: 'gray' },
  { id: 'desarrollo', nombre: 'En desarrollo', icon: 'Wrench', color: 'yellow' },
  { id: 'revisar', nombre: 'Para revisar', icon: 'Eye', color: 'purple' },
  { id: 'publicado', nombre: 'Publicado', icon: 'Rocket', color: 'green' }
]

// Tipos de reporte
export const TIPOS_REPORTE = [
  { id: 'falla_grave', nombre: 'Falla grave', icon: 'AlertCircle', color: 'red', descripcion: 'Algo no funciona y es urgente' },
  { id: 'error', nombre: 'Error', icon: 'AlertTriangle', color: 'orange', descripcion: 'Algo anda mal pero no es urgente' },
  { id: 'sugerencia', nombre: 'Sugerencia', icon: 'MessageCircle', color: 'green', descripcion: 'Una mejora o idea' }
]

// Estados de reporte (5 estados)
export const ESTADOS_REPORTE = [
  { id: 'pendiente', nombre: 'Pendiente', icon: 'Inbox', color: 'gray' },
  { id: 'abierto', nombre: 'Abierto', icon: 'Circle', color: 'yellow' },
  { id: 'en_curso', nombre: 'En curso', icon: 'PlayCircle', color: 'blue' },
  { id: 'para_probar', nombre: 'Para probar', icon: 'TestTube', color: 'purple' },
  { id: 'resuelto', nombre: 'Resuelto', icon: 'CheckCircle', color: 'green' }
]

// Prioridades
export const PRIORIDADES = [
  { id: 'urgente', nombre: 'Urgente', icon: 'AlertCircle', color: 'red' },
  { id: 'normal', nombre: 'Normal', icon: 'Circle', color: 'yellow' },
  { id: 'puede_esperar', nombre: 'Puede esperar', icon: 'Clock', color: 'green' }
]

// Tonos para UX
export const TONOS = [
  { id: 'amigable', nombre: 'Amigable' },
  { id: 'formal', nombre: 'Formal' },
  { id: 'urgente', nombre: 'Urgente' },
  { id: 'explicativo', nombre: 'Explicativo' }
]

// Helpers
export const getEtapa = (id) => ETAPAS.find(e => e.id === id)
export const getTipoReporte = (id) => TIPOS_REPORTE.find(t => t.id === id)
export const getEstadoReporte = (id) => ESTADOS_REPORTE.find(e => e.id === id)
export const getPrioridad = (id) => PRIORIDADES.find(p => p.id === id)

// Colores de Tailwind por color config
export const TAILWIND_COLORS = {
  gray: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' }
}

export const getColorClasses = (color) => TAILWIND_COLORS[color] || TAILWIND_COLORS.gray
