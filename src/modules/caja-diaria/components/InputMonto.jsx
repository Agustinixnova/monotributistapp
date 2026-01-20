/**
 * Input para montos con formateo en tiempo real
 * 1000 → 1.000
 */

import { useRef, useEffect } from 'react'
import { formatearInputMonto, parsearMonto } from '../utils/formatters'

export default function InputMonto({
  value,
  onChange,
  placeholder = '0',
  className = '',
  disabled = false,
  name = 'monto'
}) {
  const inputRef = useRef(null)
  const isTyping = useRef(false)

  // Sincronizar valor externo solo cuando no está escribiendo
  useEffect(() => {
    if (!isTyping.current && inputRef.current) {
      const formatted = value ? formatearInputMonto(value.toString()) : ''
      if (inputRef.current.value !== formatted) {
        inputRef.current.value = formatted
      }
    }
  }, [value])

  const handleChange = (e) => {
    isTyping.current = true
    const formatted = formatearInputMonto(e.target.value)
    e.target.value = formatted
    onChange(parsearMonto(formatted))
    // Reset typing flag después de un pequeño delay
    setTimeout(() => { isTyping.current = false }, 100)
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      name={name}
      defaultValue={value ? formatearInputMonto(value.toString()) : ''}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`text-right ${className}`}
      autoFocus={false}
    />
  )
}
