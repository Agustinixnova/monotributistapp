/**
 * Avatar de usuario
 */
export function Avatar({ nombre, apellido, avatarUrl, size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  }

  const getInitials = () => {
    const n = nombre?.charAt(0) || ''
    const a = apellido?.charAt(0) || ''
    return (n + a).toUpperCase() || '?'
  }

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${nombre} ${apellido}`}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-violet-600 text-white font-semibold flex items-center justify-center ${className}`}>
      {getInitials()}
    </div>
  )
}

export default Avatar
