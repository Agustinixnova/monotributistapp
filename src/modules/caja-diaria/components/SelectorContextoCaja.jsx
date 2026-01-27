/**
 * Selector de contexto de caja para empleados
 * Permite elegir entre ver la caja personal o la del empleador
 */

import { useState, useEffect } from 'react'
import { Store, User, ChevronDown, Check } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

const STORAGE_KEY = 'caja_contexto_seleccionado'

export default function SelectorContextoCaja({ onCambioContexto }) {
  const [isOpen, setIsOpen] = useState(false)
  const [contexto, setContexto] = useState('empleador') // 'propio' | 'empleador'
  const [infoEmpleador, setInfoEmpleador] = useState(null)
  const [esEmpleado, setEsEmpleado] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verificarEstado = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log('[SelectorContexto] No hay usuario autenticado')
          setLoading(false)
          return
        }

        console.log('[SelectorContexto] Verificando si', user.email, 'es empleado...')

        // Primero buscar si es empleado (sin join para evitar errores)
        const { data: empleadoData, error: empleadoError } = await supabase
          .from('caja_empleados')
          .select('duenio_id, activo')
          .eq('empleado_id', user.id)
          .maybeSingle()

        if (empleadoError) {
          console.error('[SelectorContexto] Error buscando empleado:', empleadoError)
          setLoading(false)
          return
        }

        console.log('[SelectorContexto] Resultado empleado:', empleadoData)

        // Si no existe registro o no está activo
        if (!empleadoData) {
          console.log('[SelectorContexto] No es empleado de nadie')
          setLoading(false)
          return
        }

        if (!empleadoData.activo) {
          console.log('[SelectorContexto] Es empleado pero está INACTIVO')
          setLoading(false)
          return
        }

        // Es empleado activo, buscar info del dueño
        const { data: duenioData } = await supabase
          .from('usuarios_free')
          .select('nombre, apellido, email')
          .eq('id', empleadoData.duenio_id)
          .maybeSingle()

        console.log('[SelectorContexto] Info dueño:', duenioData)

        setEsEmpleado(true)
        setInfoEmpleador({
          id: empleadoData.duenio_id,
          nombre: duenioData?.nombre || '',
          apellido: duenioData?.apellido || '',
          email: duenioData?.email || ''
        })

        // Recuperar contexto guardado
        const contextoGuardado = localStorage.getItem(STORAGE_KEY)
        if (contextoGuardado === 'propio' || contextoGuardado === 'empleador') {
          setContexto(contextoGuardado)
        }

        setLoading(false)
      } catch (err) {
        console.error('[SelectorContexto] Error:', err)
        setLoading(false)
      }
    }

    verificarEstado()
  }, [])

  // Cambiar contexto
  const handleCambiarContexto = (nuevoContexto) => {
    if (nuevoContexto === contexto) {
      setIsOpen(false)
      return
    }

    setContexto(nuevoContexto)
    localStorage.setItem(STORAGE_KEY, nuevoContexto)
    setIsOpen(false)

    // Notificar al padre para que refresque los datos
    if (onCambioContexto) {
      onCambioContexto(nuevoContexto)
    }
  }

  // Si no es empleado o está cargando, no mostrar nada
  if (loading || !esEmpleado) {
    return null
  }

  const nombreEmpleador = [infoEmpleador?.nombre, infoEmpleador?.apellido]
    .filter(Boolean)
    .join(' ')
    .trim() || infoEmpleador?.email?.split('@')[0] || 'Empleador'

  return (
    <div className="relative">
      {/* Botón del selector */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors text-sm"
        title={contexto === 'propio' ? 'Mi caja personal' : `Caja de ${nombreEmpleador}`}
      >
        {contexto === 'propio' ? (
          <User className="w-4 h-4 text-violet-600 flex-shrink-0" />
        ) : (
          <Store className="w-4 h-4 text-violet-600 flex-shrink-0" />
        )}
        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-violet-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay para cerrar */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu - se abre hacia la izquierda en mobile para no salirse de pantalla */}
          <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <p className="text-xs text-gray-500 font-medium px-2">Seleccionar caja</p>
            </div>

            {/* Opción: Mi caja personal */}
            <button
              onClick={() => handleCambiarContexto('propio')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors ${
                contexto === 'propio' ? 'bg-violet-50' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                contexto === 'propio' ? 'bg-violet-100' : 'bg-gray-100'
              }`}>
                <User className={`w-4 h-4 ${contexto === 'propio' ? 'text-violet-600' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${contexto === 'propio' ? 'text-violet-700' : 'text-gray-700'}`}>
                  Mi caja personal
                </p>
                <p className="text-xs text-gray-500">Tu propio negocio</p>
              </div>
              {contexto === 'propio' && (
                <Check className="w-4 h-4 text-violet-600" />
              )}
            </button>

            {/* Opción: Caja del empleador */}
            <button
              onClick={() => handleCambiarContexto('empleador')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors ${
                contexto === 'empleador' ? 'bg-violet-50' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                contexto === 'empleador' ? 'bg-violet-100' : 'bg-gray-100'
              }`}>
                <Store className={`w-4 h-4 ${contexto === 'empleador' ? 'text-violet-600' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${contexto === 'empleador' ? 'text-violet-700' : 'text-gray-700'}`}>
                  Caja de {nombreEmpleador}
                </p>
                <p className="text-xs text-gray-500">Como empleado</p>
              </div>
              {contexto === 'empleador' && (
                <Check className="w-4 h-4 text-violet-600" />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
