/**
 * Input para montos con formateo en tiempo real
 * 1000 → 1.000
 */

import { useState, useEffect } from 'react'
import { formatearInputMonto, parsearMonto } from '../utils/formatters'

export default function InputMonto({
  value,
  onChange,
  placeholder = '0',
  className = '',
  disabled = false,
  name = 'monto'
}) {
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    if (value) {
      setDisplayValue(formatearInputMonto(value.toString()))
    } else {
      setDisplayValue('')
    }
  }, [value])

  const handleChange = (e) => {
    const formatted = formatearInputMonto(e.target.value)
    setDisplayValue(formatted)
    onChange(parsearMonto(formatted))
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      name={name}
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`text-right ${className}`}
      autoFocus={false} // NUNCA autoFocus en iOS/Safari
    />
  )
}
