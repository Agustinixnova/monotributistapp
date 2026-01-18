/**
 * Renderiza iconos de Lucide dinámicamente desde un string
 */

import * as LucideIcons from 'lucide-react'

export default function IconoDinamico({ nombre, className = "w-5 h-5" }) {
  // Si no hay nombre, mostrar icono por defecto
  if (!nombre) {
    return <LucideIcons.Circle className={className} />
  }

  // Obtener el componente del icono desde Lucide
  const IconComponent = LucideIcons[nombre]

  // Si no existe el icono, mostrar uno por defecto
  if (!IconComponent) {
    return <LucideIcons.Circle className={className} />
  }

  return <IconComponent className={className} />
}
