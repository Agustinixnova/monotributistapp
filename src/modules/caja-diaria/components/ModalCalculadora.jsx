/**
 * Calculadora tradicional con botón de cobrar
 * Funciona como calculadora común, no como cinta
 */

import { useState, useRef, useEffect } from 'react'
import { X, Delete, DollarSign, RotateCcw } from 'lucide-react'
import { formatearMonto } from '../utils/formatters'

export default function ModalCalculadora({ isOpen, onClose, onCobrar }) {
  const [display, setDisplay] = useState('0')
  const [expresion, setExpresion] = useState('')
  const [resultado, setResultado] = useState(null)
  const [operacionPendiente, setOperacionPendiente] = useState(false)

  // Refs para teclado
  const agregarDigitoRef = useRef()
  const agregarOperadorRef = useRef()
  const calcularRef = useRef()
  const borrarUltimoRef = useRef()
  const limpiarRef = useRef()
  const calcularPorcentajeRef = useRef()

  // Resetear al cerrar
  useEffect(() => {
    if (!isOpen) {
      setDisplay('0')
      setExpresion('')
      setResultado(null)
      setOperacionPendiente(false)
    }
  }, [isOpen])

  // Soporte para teclado físico
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      // Números
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        agregarDigitoRef.current(e.key)
        return
      }

      // Operadores
      if (e.key === '+') {
        e.preventDefault()
        agregarOperadorRef.current('+')
        return
      }
      if (e.key === '-') {
        e.preventDefault()
        agregarOperadorRef.current('−')
        return
      }
      if (e.key === '*' || e.key === 'x' || e.key === 'X') {
        e.preventDefault()
        agregarOperadorRef.current('×')
        return
      }
      if (e.key === '/') {
        e.preventDefault()
        agregarOperadorRef.current('÷')
        return
      }

      // Punto decimal
      if (e.key === '.' || e.key === ',') {
        e.preventDefault()
        agregarDigitoRef.current('.')
        return
      }

      // Enter o = para calcular
      if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault()
        calcularRef.current()
        return
      }

      // Backspace
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

      // C para limpiar
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        limpiarRef.current()
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

  // Redondear a 2 decimales
  const redondear = (num) => Math.round(num * 100) / 100

  // Evaluar expresión matemática
  const evaluarExpresion = (expr) => {
    if (!expr) return 0

    try {
      // Reemplazar símbolos por operadores JS
      const expresionJS = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')

      // Evaluar de forma segura
      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + expresionJS)()

      if (isNaN(result) || !isFinite(result)) return 0
      return redondear(result)
    } catch {
      return 0
    }
  }

  // Agregar dígito
  const agregarDigito = (digito) => {
    // Si acabamos de calcular un resultado, empezar nuevo número
    if (resultado !== null && !operacionPendiente) {
      setDisplay(digito === '.' ? '0.' : digito)
      setExpresion(digito === '.' ? '0.' : digito)
      setResultado(null)
      return
    }

    // Si hay operación pendiente, empezar nuevo número
    if (operacionPendiente) {
      setDisplay(digito === '.' ? '0.' : digito)
      setExpresion(prev => prev + (digito === '.' ? '0.' : digito))
      setOperacionPendiente(false)
      return
    }

    // No permitir múltiples puntos
    if (digito === '.' && display.includes('.')) return

    // No permitir números muy largos
    if (display.replace(/[^0-9]/g, '').length >= 12) return

    // Si el display es "0", reemplazar (excepto para punto)
    if (display === '0' && digito !== '.') {
      setDisplay(digito)
      setExpresion(prev => {
        // Si la expresión termina en 0 solo, reemplazar
        if (prev === '0' || prev === '') return digito
        // Si termina en operador + 0, reemplazar el 0
        if (/[+\−×÷]0$/.test(prev)) return prev.slice(0, -1) + digito
        return prev + digito
      })
    } else {
      setDisplay(prev => prev + digito)
      setExpresion(prev => prev + digito)
    }
  }
  agregarDigitoRef.current = agregarDigito

  // Agregar operador
  const agregarOperador = (op) => {
    // Si acabamos de calcular, usar el resultado
    if (resultado !== null) {
      setExpresion(resultado.toString() + op)
      setDisplay(resultado.toString())
      setResultado(null)
      setOperacionPendiente(true)
      return
    }

    // Si ya hay operación pendiente, reemplazar operador
    if (operacionPendiente) {
      setExpresion(prev => prev.slice(0, -1) + op)
      return
    }

    // Agregar operador
    setExpresion(prev => prev + op)
    setOperacionPendiente(true)
  }
  agregarOperadorRef.current = agregarOperador

  // Calcular resultado
  const calcular = () => {
    if (!expresion || operacionPendiente) return

    const res = evaluarExpresion(expresion)
    setResultado(res)
    setDisplay(res.toString())
    setOperacionPendiente(false)
  }
  calcularRef.current = calcular

  // Borrar último carácter
  const borrarUltimo = () => {
    if (resultado !== null) {
      // Si hay resultado, limpiar todo
      limpiar()
      return
    }

    if (display.length <= 1 || display === '0') {
      setDisplay('0')
      setExpresion(prev => {
        const newExpr = prev.slice(0, -1)
        return newExpr || '0'
      })
      return
    }

    const lastChar = display.slice(-1)
    const isOperator = ['+', '−', '×', '÷'].includes(lastChar)

    setDisplay(prev => prev.slice(0, -1) || '0')
    setExpresion(prev => prev.slice(0, -1) || '0')

    if (isOperator) {
      setOperacionPendiente(false)
    }
  }
  borrarUltimoRef.current = borrarUltimo

  // Limpiar todo
  const limpiar = () => {
    setDisplay('0')
    setExpresion('')
    setResultado(null)
    setOperacionPendiente(false)
  }
  limpiarRef.current = limpiar

  // Calcular porcentaje
  const calcularPorcentaje = () => {
    if (resultado !== null) {
      // Si hay resultado, calcular porcentaje del resultado
      const porcentaje = redondear(resultado / 100)
      setDisplay(porcentaje.toString())
      setExpresion(porcentaje.toString())
      setResultado(porcentaje)
      return
    }

    // Buscar el último número en la expresión
    const match = expresion.match(/([+\−×÷]?)(\d+\.?\d*)$/)
    if (!match) return

    const operador = match[1]
    const numero = parseFloat(match[2])

    if (operador === '+' || operador === '−') {
      // Para suma/resta: calcular porcentaje del total anterior
      const anterior = expresion.slice(0, -match[0].length)
      const valorAnterior = evaluarExpresion(anterior)
      const porcentaje = redondear(valorAnterior * numero / 100)

      setExpresion(anterior + operador + porcentaje)
      setDisplay(porcentaje.toString())
    } else if (operador === '×' || operador === '÷') {
      // Para multiplicación/división: convertir a decimal
      const porcentaje = redondear(numero / 100)
      const nuevaExpr = expresion.slice(0, -match[2].length) + porcentaje
      setExpresion(nuevaExpr)
      setDisplay(porcentaje.toString())
    } else {
      // Solo un número: dividir por 100
      const porcentaje = redondear(numero / 100)
      setExpresion(porcentaje.toString())
      setDisplay(porcentaje.toString())
    }
  }
  calcularPorcentajeRef.current = calcularPorcentaje

  // Cambiar signo (+/-)
  const cambiarSigno = () => {
    if (resultado !== null) {
      const nuevo = -resultado
      setResultado(nuevo)
      setDisplay(nuevo.toString())
      setExpresion(nuevo.toString())
      return
    }

    if (display === '0') return

    // Si el display actual es negativo, hacerlo positivo y viceversa
    if (display.startsWith('-')) {
      const nuevoDisplay = display.slice(1)
      setDisplay(nuevoDisplay)
      // Actualizar expresión también
      setExpresion(prev => {
        const idx = prev.lastIndexOf('-' + display.slice(1))
        if (idx >= 0) {
          return prev.slice(0, idx) + nuevoDisplay
        }
        return prev
      })
    } else {
      const nuevoDisplay = '-' + display
      setDisplay(nuevoDisplay)
      setExpresion(prev => {
        // Encontrar y reemplazar el número actual
        const idx = prev.lastIndexOf(display)
        if (idx >= 0) {
          return prev.slice(0, idx) + '(-' + display + ')'
        }
        return '(-' + prev + ')'
      })
    }
  }

  // Valor actual para cobrar
  const valorActual = resultado !== null ? resultado : evaluarExpresion(expresion)

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

      {/* Modal */}
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

        {/* Display */}
        <div className="px-4 py-4 bg-white border-b border-gray-200 flex-shrink-0">
          {/* Expresión */}
          <div className="text-gray-500 text-sm h-6 text-right overflow-hidden font-mono">
            {expresion || '0'}
          </div>
          {/* Resultado/Display principal */}
          <div className="text-4xl font-bold text-gray-900 text-right font-mono tracking-tight">
            {display}
          </div>
        </div>

        {/* Teclado */}
        <div className="p-3 bg-white flex-1">
          <div className="grid grid-cols-4 gap-2">
            {/* Fila 1: C ± % ÷ */}
            <Boton onClick={limpiar} className="bg-gray-300 text-gray-800 hover:bg-gray-400">C</Boton>
            <Boton onClick={cambiarSigno} className="bg-gray-300 text-gray-800 hover:bg-gray-400">±</Boton>
            <Boton onClick={calcularPorcentaje} className="bg-gray-300 text-gray-800 hover:bg-gray-400">%</Boton>
            <Boton onClick={() => agregarOperador('÷')} className="bg-amber-500 text-white hover:bg-amber-600">÷</Boton>

            {/* Fila 2: 7 8 9 × */}
            <Boton onClick={() => agregarDigito('7')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">7</Boton>
            <Boton onClick={() => agregarDigito('8')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">8</Boton>
            <Boton onClick={() => agregarDigito('9')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">9</Boton>
            <Boton onClick={() => agregarOperador('×')} className="bg-amber-500 text-white hover:bg-amber-600">×</Boton>

            {/* Fila 3: 4 5 6 − */}
            <Boton onClick={() => agregarDigito('4')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">4</Boton>
            <Boton onClick={() => agregarDigito('5')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">5</Boton>
            <Boton onClick={() => agregarDigito('6')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">6</Boton>
            <Boton onClick={() => agregarOperador('−')} className="bg-amber-500 text-white hover:bg-amber-600">−</Boton>

            {/* Fila 4: 1 2 3 + */}
            <Boton onClick={() => agregarDigito('1')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">1</Boton>
            <Boton onClick={() => agregarDigito('2')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">2</Boton>
            <Boton onClick={() => agregarDigito('3')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">3</Boton>
            <Boton onClick={() => agregarOperador('+')} className="bg-amber-500 text-white hover:bg-amber-600">+</Boton>

            {/* Fila 5: 0 . ⌫ = */}
            <Boton onClick={() => agregarDigito('0')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">0</Boton>
            <Boton onClick={() => agregarDigito('.')} className="bg-gray-100 text-gray-900 hover:bg-gray-200">.</Boton>
            <Boton onClick={borrarUltimo} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
              <Delete className="w-5 h-5 mx-auto" />
            </Boton>
            <Boton onClick={calcular} className="bg-amber-500 text-white hover:bg-amber-600">=</Boton>
          </div>
        </div>

        {/* Botón Cobrar */}
        {onCobrar && (
          <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 shrink-0">
            <button
              onClick={() => {
                if (valorActual > 0) {
                  onCobrar(valorActual)
                  onClose()
                }
              }}
              disabled={valorActual <= 0}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <DollarSign className="w-6 h-6" />
              Cobrar {formatearMonto(valorActual)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
