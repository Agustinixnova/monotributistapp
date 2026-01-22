/**
 * Calculadora estilo cinta de almacén con teclado numérico
 * Botones grandes para uso fácil en móvil
 */

import { useState, useRef, useEffect } from 'react'
import { X, Trash2, Delete, DollarSign } from 'lucide-react'
import { formatearMonto } from '../utils/formatters'

export default function ModalCalculadora({ isOpen, onClose, onCobrar }) {
  const [lineas, setLineas] = useState([])
  const [display, setDisplay] = useState('')
  const listaRef = useRef(null)

  // Refs para acceder a las funciones desde el event listener
  const agregarDigitoRef = useRef()
  const agregarLineaRef = useRef()
  const borrarUltimoRef = useRef()
  const limpiarDisplayRef = useRef()
  const calcularPorcentajeRef = useRef()
  const calcularResultadoRef = useRef()
  const displayRef = useRef(display)

  // Scroll al final cuando se agregan líneas
  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight
    }
  }, [lineas])

  // Resetear al cerrar
  useEffect(() => {
    if (!isOpen) {
      displayRef.current = ''
      setDisplay('')
      setLineas([])
    }
  }, [isOpen])

  // Soporte para teclado físico en PC
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      // Números
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        agregarDigitoRef.current(e.key)
        return
      }

      // Multiplicación (* o x)
      if (e.key === '*' || e.key === 'x' || e.key === 'X') {
        e.preventDefault()
        agregarDigitoRef.current('×')
        return
      }

      // Resta (-)
      if (e.key === '-') {
        e.preventDefault()
        agregarDigitoRef.current('−')
        return
      }

      // Punto decimal
      if (e.key === '.' || e.key === ',') {
        e.preventDefault()
        agregarDigitoRef.current('.')
        return
      }

      // + para suma
      if (e.key === '+') {
        e.preventDefault()
        agregarDigitoRef.current('+')
        return
      }

      // Enter para calcular y agregar línea
      if (e.key === 'Enter') {
        e.preventDefault()
        calcularResultadoRef.current()
        return
      }

      // Backspace para borrar
      if (e.key === 'Backspace') {
        e.preventDefault()
        borrarUltimoRef.current()
        return
      }

      // Escape para cerrar
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      // C para limpiar display
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        limpiarDisplayRef.current()
        return
      }

      // = para calcular resultado
      if (e.key === '=') {
        e.preventDefault()
        calcularResultadoRef.current()
        return
      }

      // % para porcentaje
      if (e.key === '%') {
        e.preventDefault()
        calcularPorcentajeRef.current()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Agregar dígito o símbolo al display
  const agregarDigito = (digito) => {
    setDisplay(prev => {
      const operadores = ['×', '−', '+']

      // No permitir múltiples operadores seguidos
      if (operadores.includes(digito)) {
        if (operadores.some(op => prev.endsWith(op))) return prev
        // No empezar con operador
        if (prev === '') return prev
      }

      // No permitir múltiples puntos en el mismo número
      if (digito === '.') {
        const partes = prev.split(/[×−+]/)
        const ultimaParte = partes[partes.length - 1]
        if (ultimaParte.includes('.')) return prev
      }

      const newDisplay = prev + digito
      displayRef.current = newDisplay
      return newDisplay
    })
  }
  agregarDigitoRef.current = agregarDigito

  // Borrar último carácter
  const borrarUltimo = () => {
    setDisplay(prev => {
      const newDisplay = prev.slice(0, -1)
      displayRef.current = newDisplay
      return newDisplay
    })
  }
  borrarUltimoRef.current = borrarUltimo

  // Limpiar display
  const limpiarDisplay = () => {
    displayRef.current = ''
    setDisplay('')
  }
  limpiarDisplayRef.current = limpiarDisplay

  // Redondear a 2 decimales
  const redondear = (num) => Math.round(num * 100) / 100

  // Parsear y calcular el display actual (usa el valor pasado o displayRef)
  const calcularDisplay = (displayValue = null) => {
    const currentDisplay = displayValue !== null ? displayValue : displayRef.current
    if (!currentDisplay) return 0

    // Si tiene ×, es una multiplicación
    if (currentDisplay.includes('×')) {
      const partes = currentDisplay.split('×').map(p => parseFloat(p) || 0)
      if (partes.length === 2) {
        return redondear(partes[0] * partes[1])
      }
    }

    // Si tiene +, es una suma
    if (currentDisplay.includes('+')) {
      const partes = currentDisplay.split('+').map(p => parseFloat(p) || 0)
      if (partes.length === 2) {
        return redondear(partes[0] + partes[1])
      }
    }

    // Si tiene −, es una resta
    if (currentDisplay.includes('−')) {
      const partes = currentDisplay.split('−').map(p => parseFloat(p) || 0)
      if (partes.length === 2) {
        return redondear(partes[0] - partes[1])
      }
    }

    // Si es solo un número
    return redondear(parseFloat(currentDisplay) || 0)
  }

  // Agregar línea al total
  const agregarLinea = () => {
    const currentDisplay = displayRef.current
    if (!currentDisplay) return

    // Usar calcularDisplay para obtener el resultado
    const resultado = calcularDisplay(currentDisplay)

    if (resultado === 0 && !currentDisplay.includes('0')) return

    const nuevaLinea = {
      id: Date.now(),
      expresion: currentDisplay,
      resultado
    }

    setLineas(prev => [...prev, nuevaLinea])
    displayRef.current = ''
    setDisplay('')
  }
  agregarLineaRef.current = agregarLinea

  // Eliminar línea
  const eliminarLinea = (id) => {
    setLineas(lineas.filter(l => l.id !== id))
  }

  // Limpiar todo
  const limpiarTodo = () => {
    setLineas([])
    displayRef.current = ''
    setDisplay('')
  }

  // Calcular porcentaje
  // Para + y −: calcula el porcentaje del primer número (ej: 1000+10% → 1000+100 = 1100)
  // Para ×: convierte a decimal (ej: 1000×10% → 1000×0.1 = 100)
  const calcularPorcentaje = () => {
    const currentDisplay = displayRef.current
    if (!currentDisplay) return

    // Buscar si tiene operador
    const tieneMultiplicacion = currentDisplay.includes('×')
    const tieneSuma = currentDisplay.includes('+')
    const tieneResta = currentDisplay.includes('−')

    let newDisplay = currentDisplay

    if (tieneMultiplicacion) {
      // Para multiplicación: convertir a decimal (10% → 0.1)
      const partes = currentDisplay.split('×')
      if (partes.length === 2 && partes[1]) {
        const num1 = partes[0]
        const num2 = redondear(parseFloat(partes[1]) / 100)
        newDisplay = `${num1}×${num2}`
      }
    } else if (tieneSuma) {
      // Para suma: calcular el porcentaje del primer número (1000+10% → 1000+100)
      const partes = currentDisplay.split('+')
      if (partes.length === 2 && partes[1]) {
        const num1 = parseFloat(partes[0]) || 0
        const porcentaje = parseFloat(partes[1]) || 0
        const valorPorcentaje = redondear(num1 * porcentaje / 100)
        newDisplay = `${partes[0]}+${valorPorcentaje}`
      }
    } else if (tieneResta) {
      // Para resta: calcular el porcentaje del primer número (1000−10% → 1000−100)
      const partes = currentDisplay.split('−')
      if (partes.length === 2 && partes[1]) {
        const num1 = parseFloat(partes[0]) || 0
        const porcentaje = parseFloat(partes[1]) || 0
        const valorPorcentaje = redondear(num1 * porcentaje / 100)
        newDisplay = `${partes[0]}−${valorPorcentaje}`
      }
    } else {
      // Solo un número, dividir por 100
      const num = redondear(parseFloat(currentDisplay) / 100)
      newDisplay = num.toString()
    }

    displayRef.current = newDisplay
    setDisplay(newDisplay)
  }
  calcularPorcentajeRef.current = calcularPorcentaje

  // Calcular resultado (=) - calcula y agrega la línea a la cinta
  const calcularResultado = () => {
    const currentDisplay = displayRef.current
    if (!currentDisplay) return

    // Si tiene operación, calcular y agregar línea
    if (currentDisplay.includes('×') || currentDisplay.includes('−') || currentDisplay.includes('+')) {
      const resultado = calcularDisplay(currentDisplay)

      // Agregar línea a la cinta
      const nuevaLinea = {
        id: Date.now(),
        expresion: currentDisplay,
        resultado
      }
      setLineas(prev => [...prev, nuevaLinea])
      displayRef.current = ''
      setDisplay('')
    } else {
      // Si es solo un número, también agregarlo a la cinta
      const resultado = redondear(parseFloat(currentDisplay) || 0)
      if (resultado === 0 && !currentDisplay.includes('0')) return

      const nuevaLinea = {
        id: Date.now(),
        expresion: currentDisplay,
        resultado
      }
      setLineas(prev => [...prev, nuevaLinea])
      displayRef.current = ''
      setDisplay('')
    }
  }
  calcularResultadoRef.current = calcularResultado

  // Calcular total
  const total = redondear(lineas.reduce((sum, l) => sum + l.resultado, 0))
  const displayValor = calcularDisplay()

  if (!isOpen) return null

  // Botón del teclado
  const Boton = ({ children, onClick, className = '', span = 1 }) => (
    <button
      onClick={onClick}
      className={`
        h-14 rounded-xl font-semibold text-xl
        active:scale-95 transition-all
        ${span === 2 ? 'col-span-2' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Pantalla completa en móvil */}
      <div className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm sm:max-h-[90vh] bg-white sm:rounded-2xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-white flex items-center justify-between shrink-0">
          <h3 className="font-heading font-semibold text-lg">Calculadora</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de líneas (cinta) */}
        <div
          ref={listaRef}
          className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-gray-50 min-h-[120px] max-h-[200px]"
        >
          {lineas.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Usá = para agregar items a la cinta
            </div>
          ) : (
            lineas.map((linea, index) => (
              <div
                key={linea.id}
                className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-100 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs w-5">{index + 1}.</span>
                  <span className="text-gray-700">{linea.expresion}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {formatearMonto(linea.resultado)}
                  </span>
                  <button
                    onClick={() => eliminarLinea(linea.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Display */}
        <div className="px-4 py-3 bg-white border-t border-gray-100">
          <div className="bg-gray-100 rounded-xl px-4 py-3 text-right">
            <div className="text-gray-500 text-sm h-5 overflow-hidden">
              {display || '0'}
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {formatearMonto(display ? displayValor : 0)}
            </div>
          </div>
        </div>

        {/* Total y Botón Cobrar */}
        {lineas.length > 0 && (
          <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-amber-700 font-medium">TOTAL</span>
              <span className="text-2xl font-bold text-amber-600">
                {formatearMonto(total)}
              </span>
            </div>
            {onCobrar && (
              <button
                onClick={() => {
                  onCobrar(total)
                  onClose()
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                <DollarSign className="w-5 h-5" />
                Cobrar {formatearMonto(total)}
              </button>
            )}
          </div>
        )}

        {/* Teclado */}
        <div className="p-3 bg-white border-t border-gray-200 shrink-0">
          <div className="grid grid-cols-4 gap-2">
            {/* Fila 1: 🗑️ C ⌫ % */}
            <Boton
              onClick={limpiarTodo}
              className="bg-red-100 text-red-600 hover:bg-red-200"
            >
              <Trash2 className="w-5 h-5 mx-auto" />
            </Boton>
            <Boton onClick={limpiarDisplay} className="bg-gray-200 text-gray-700 hover:bg-gray-300">C</Boton>
            <Boton onClick={borrarUltimo} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
              <Delete className="w-5 h-5 mx-auto" />
            </Boton>
            <Boton onClick={calcularPorcentaje} className="bg-amber-100 text-amber-700 hover:bg-amber-200">%</Boton>

            {/* Fila 2: 7 8 9 × */}
            <Boton onClick={() => agregarDigito('7')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">7</Boton>
            <Boton onClick={() => agregarDigito('8')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">8</Boton>
            <Boton onClick={() => agregarDigito('9')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">9</Boton>
            <Boton onClick={() => agregarDigito('×')} className="bg-amber-100 text-amber-700 hover:bg-amber-200">×</Boton>

            {/* Fila 3: 4 5 6 + (suma) */}
            <Boton onClick={() => agregarDigito('4')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">4</Boton>
            <Boton onClick={() => agregarDigito('5')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">5</Boton>
            <Boton onClick={() => agregarDigito('6')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">6</Boton>
            <Boton onClick={() => agregarDigito('+')} className="bg-amber-100 text-amber-700 hover:bg-amber-200">+</Boton>

            {/* Fila 4: 1 2 3 − */}
            <Boton onClick={() => agregarDigito('1')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">1</Boton>
            <Boton onClick={() => agregarDigito('2')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">2</Boton>
            <Boton onClick={() => agregarDigito('3')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">3</Boton>
            <Boton onClick={() => agregarDigito('−')} className="bg-amber-100 text-amber-700 hover:bg-amber-200">−</Boton>

            {/* Fila 5: 0 00 . = (agregar a cinta) */}
            <Boton onClick={() => agregarDigito('0')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">0</Boton>
            <Boton onClick={() => agregarDigito('00')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">00</Boton>
            <Boton onClick={() => agregarDigito('.')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">.</Boton>
            <Boton onClick={calcularResultado} className="bg-emerald-500 text-white hover:bg-emerald-600">=</Boton>
          </div>
        </div>
      </div>
    </div>
  )
}
