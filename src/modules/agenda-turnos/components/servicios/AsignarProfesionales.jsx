/**
 * Componente para asignar profesionales a un servicio
 */

import { useState, useEffect } from 'react'
import { Check, X, DollarSign, Loader2, Users } from 'lucide-react'
import { useProfesionales } from '../../hooks/useDisponibilidad'
import {
  getProfesionalesServicio,
  asignarProfesionalServicio,
  quitarProfesionalServicio,
  actualizarPrecioServicioProfesional
} from '../../services/serviciosService'

export default function AsignarProfesionales({ servicioId, precioBase, onChange }) {
  const { profesionales, loading: loadingProfs } = useProfesionales()
  const [asignados, setAsignados] = useState([])
  const [loading, setLoading] = useState(true)
  const [editandoPrecio, setEditandoPrecio] = useState(null)
  const [precioTemp, setPrecioTemp] = useState('')

  useEffect(() => {
    if (servicioId) {
      cargarAsignados()
    } else {
      setAsignados([])
      setLoading(false)
    }
  }, [servicioId])

  const cargarAsignados = async () => {
    setLoading(true)
    const { data } = await getProfesionalesServicio(servicioId)
    setAsignados(data || [])
    setLoading(false)
  }

  const toggleProfesional = async (profesionalId) => {
    const yaAsignado = asignados.find(a => a.profesional_id === profesionalId)

    if (yaAsignado) {
      await quitarProfesionalServicio(servicioId, profesionalId)
      setAsignados(prev => prev.filter(a => a.profesional_id !== profesionalId))
    } else {
      const { data } = await asignarProfesionalServicio(servicioId, profesionalId)
      if (data) {
        // Buscar el profesional para agregarlo con su info
        const prof = profesionales.find(p => p.id === profesionalId)
        setAsignados(prev => [...prev, { ...data, profesional: prof }])
      }
    }

    onChange?.()
  }

  const handleEditarPrecio = (profesionalId, precioActual) => {
    setEditandoPrecio(profesionalId)
    setPrecioTemp(precioActual?.toString() || precioBase.toString())
  }

  const handleGuardarPrecio = async (profesionalId) => {
    const nuevoPrecio = parseFloat(precioTemp) || null
    await actualizarPrecioServicioProfesional(servicioId, profesionalId, nuevoPrecio)
    setAsignados(prev => prev.map(a =>
      a.profesional_id === profesionalId
        ? { ...a, precio_override: nuevoPrecio }
        : a
    ))
    setEditandoPrecio(null)
    onChange?.()
  }

  const handleCancelarPrecio = () => {
    setEditandoPrecio(null)
    setPrecioTemp('')
  }

  if (loadingProfs || loading) {
    return (
      <div className="text-center py-4">
        <Loader2 className="w-5 h-5 animate-spin inline text-gray-400" />
      </div>
    )
  }

  if (profesionales.length <= 1) {
    return (
      <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
        <Users className="w-4 h-4 inline mr-1" />
        Único profesional, todos los servicios están disponibles.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Users className="w-4 h-4 inline mr-1" />
        Profesionales que ofrecen este servicio
      </label>

      <div className="space-y-2">
        {profesionales.map(prof => {
          const asignacion = asignados.find(a => a.profesional_id === prof.id)
          const estaAsignado = !!asignacion
          const precioEspecial = asignacion?.precio_override

          return (
            <div
              key={prof.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                estaAsignado
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleProfesional(prof.id)}
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                    estaAsignado
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {estaAsignado && <Check className="w-4 h-4" />}
                </button>

                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    prof.esDuenio ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {prof.nombre?.charAt(0)}{prof.apellido?.charAt(0) || ''}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {prof.nombre} {prof.apellido || ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      {prof.esDuenio ? 'Propietario' : 'Empleado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Precio especial */}
              {estaAsignado && (
                <div className="flex items-center gap-2">
                  {editandoPrecio === prof.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">$</span>
                      <input
                        type="number"
                        value={precioTemp}
                        onChange={(e) => setPrecioTemp(e.target.value)}
                        className="w-24 px-2 py-1 text-sm border rounded"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleGuardarPrecio(prof.id)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelarPrecio}
                        className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleEditarPrecio(prof.id, precioEspecial)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                        precioEspecial
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={precioEspecial ? 'Precio especial' : 'Usar precio base'}
                    >
                      <DollarSign className="w-3 h-3" />
                      {precioEspecial ? precioEspecial.toLocaleString() : 'Base'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Podés asignar un precio especial por profesional haciendo click en el precio.
      </p>
    </div>
  )
}
