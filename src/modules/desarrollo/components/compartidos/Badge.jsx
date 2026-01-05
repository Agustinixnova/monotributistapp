import { getColorClasses } from '../../utils/config'

/**
 * Badge con color configurable
 */
export function Badge({ color = 'gray', children, className = '' }) {
  const colors = getColorClasses(color)

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${className}`}>
      {children}
    </span>
  )
}

/**
 * Badge con emoji
 */
export function BadgeEmoji({ emoji, texto, color = 'gray', className = '' }) {
  const colors = getColorClasses(color)

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${className}`}>
      <span>{emoji}</span>
      <span>{texto}</span>
    </span>
  )
}

export default Badge
