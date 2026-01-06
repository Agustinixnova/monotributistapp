import { AlertTriangle, AlertCircle, Calendar, Clock, FileText, MessageSquare, File, Info } from 'lucide-react'

export const TIPOS_NOTIFICACION = {
  riesgo_exclusion: { icono: AlertTriangle, bgColor: 'bg-red-100', textColor: 'text-red-600' },
  cerca_recategorizacion: { icono: AlertCircle, bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
  vencimiento_cuota: { icono: Calendar, bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
  cuota_vencida: { icono: Clock, bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
  recategorizacion_periodica: { icono: Calendar, bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
  facturacion_pendiente: { icono: FileText, bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
  mensaje_nuevo: { icono: MessageSquare, bgColor: 'bg-green-100', textColor: 'text-green-600' },
  documento_nuevo: { icono: File, bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
  sistema: { icono: Info, bgColor: 'bg-gray-100', textColor: 'text-gray-600' }
}

export function getConfigTipo(tipo) {
  return TIPOS_NOTIFICACION[tipo] || TIPOS_NOTIFICACION.sistema
}

export function tiempoRelativo(fecha) {
  const diffMs = new Date() - new Date(fecha)
  const diffMins = Math.floor(diffMs / 60000)
  const diffHoras = Math.floor(diffMs / 3600000)
  const diffDias = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHoras < 24) return `Hace ${diffHoras}h`
  if (diffDias === 1) return 'Ayer'
  if (diffDias < 7) return `Hace ${diffDias} días`
  return new Date(fecha).toLocaleDateString('es-AR')
}

export function agruparPorFecha(notificaciones) {
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const ayer = new Date(hoy - 86400000)
  const semana = new Date(hoy - 7 * 86400000)

  return notificaciones.reduce((grupos, n) => {
    const fecha = new Date(n.created_at)
    if (fecha >= hoy) grupos.hoy.push(n)
    else if (fecha >= ayer) grupos.ayer.push(n)
    else if (fecha >= semana) grupos.semana.push(n)
    else grupos.anteriores.push(n)
    return grupos
  }, { hoy: [], ayer: [], semana: [], anteriores: [] })
}
