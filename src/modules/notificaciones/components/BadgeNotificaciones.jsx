export function BadgeNotificaciones({ count }) {
  if (count === 0) return null

  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-xs font-medium flex items-center justify-center">
      {count > 99 ? '99+' : count}
    </span>
  )
}
