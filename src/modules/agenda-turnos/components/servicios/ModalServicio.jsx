/**
 * Modal para crear/editar servicios
 */

import { useState, useEffect } from 'react'
import { X, Scissors, Clock, DollarSign, Percent, Palette, Loader2 } from 'lucide-react'
import { COLORES_SERVICIOS } from '../../utils/formatters'
import { formatDuracion } from '../../utils/dateUtils'
import AsignarProfesionales from './AsignarProfesionales'

export default function ModalServicio({
  isOpen,
  onClose,
  onGuardar,
  servicio = null // null = crear nuevo
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    duracion_minutos: 30,
    duracion_flexible: false,
    duracion_minima: 15,
    duracion_maxima: 60,
    precio: '',
    costo_estimado: '',
    requiere_sena: false,
    porcentaje_sena: 30,
    color: '#3B82F6'
  })

  // Reset form cuando se abre/cierra o cambia el servicio
  useEffect(() => {
    if (isOpen) {
      if (servicio) {
        setForm({
          nombre: servicio.nombre || '',
          descripcion: servicio.descripcion || '',
          duracion_minutos: servicio.duracion_minutos || 30,
          duracion_flexible: !!(servicio.duracion_minima || servicio.duracion_maxima),
          duracion_minima: servicio.duracion_minima || 15,
          duracion_maxima: servicio.duracion_maxima || 60,
          precio: servicio.precio?.toString() || '',
          costo_estimado: servicio.costo_estimado?.toString() || '',
          requiere_sena: servicio.requiere_sena || false,
          porcentaje_sena: servicio.porcentaje_sena || 30,
          color: servicio.color || '#3B82F6'
        })
      } else {
        setForm({
          nombre: '',
          descripcion: '',
          duracion_minutos: 30,
          duracion_flexible: false,
          duracion_minima: 15,
          duracion_maxima: 60,
          precio: '',
          costo_estimado: '',
          requiere_sena: false,
          porcentaje_sena: 30,
          color: '#3B82F6'
        })
      }
      setError(null)
    }
  }, [isOpen, servicio])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    if (!form.precio || parseFloat(form.precio) <= 0) {
      setError('El precio debe ser mayor a 0')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onGuardar({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        duracion_minutos: parseInt(form.duracion_minutos),
        duracion_minima: form.duracion_flexible ? parseInt(form.duracion_minima) : null,
        duracion_maxima: form.duracion_flexible ? parseInt(form.duracion_maxima) : null,
        precio: parseFloat(form.precio),
        costo_estimado: form.costo_estimado ? parseFloat(form.costo_estimado) : null,
        requiere_sena: form.requiere_sena,
        porcentaje_sena: form.requiere_sena ? parseInt(form.porcentaje_sena) : 0,
        color: form.color
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar servicio')
    } finally {
      setLoading(false)
    }
  }

  const duracionesPreset = [15, 30, 45, 60, 90, 120]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Scissors className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-lg">
                {servicio ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del servicio *
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Corte de cabello"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                autoFocus
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (opcional)
              </label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Detalles adicionales..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
              />
            </div>

            {/* Duración */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Duración
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {duracionesPreset.map(min => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, duracion_minutos: min }))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      form.duracion_minutos === min
                        ? 'bg-violet-100 text-violet-700 border-2 border-violet-500'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {formatDuracion(min)}
                  </button>
                ))}
              </div>

              {/* Duración flexible */}
              <label className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <input
                  type="checkbox"
                  checked={form.duracion_flexible}
                  onChange={(e) => setForm(f => ({ ...f, duracion_flexible: e.target.checked }))}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                Duración flexible (puede variar)
              </label>

              {form.duracion_flexible && (
                <div className="flex gap-2 mt-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Mínimo</label>
                    <input
                      type="number"
                      value={form.duracion_minima}
                      onChange={(e) => setForm(f => ({ ...f, duracion_minima: e.target.value }))}
                      min={5}
                      step={5}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Máximo</label>
                    <input
                      type="number"
                      value={form.duracion_maxima}
                      onChange={(e) => setForm(f => ({ ...f, duracion_maxima: e.target.value }))}
                      min={5}
                      step={5}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Precio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Precio *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={form.precio}
                  onChange={(e) => setForm(f => ({ ...f, precio: e.target.value }))}
                  placeholder="0"
                  min={0}
                  step={100}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            </div>

            {/* Costo estimado (opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo estimado (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={form.costo_estimado}
                  onChange={(e) => setForm(f => ({ ...f, costo_estimado: e.target.value }))}
                  placeholder="Para calcular margen"
                  min={0}
                  step={100}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              {form.precio && form.costo_estimado && (
                <p className="text-xs text-gray-500 mt-1">
                  Margen: ${parseFloat(form.precio) - parseFloat(form.costo_estimado)} (
                  {Math.round(((parseFloat(form.precio) - parseFloat(form.costo_estimado)) / parseFloat(form.precio)) * 100)}%)
                </p>
              )}
            </div>

            {/* Seña */}
            <div className="bg-amber-50 rounded-lg p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-amber-800">
                <input
                  type="checkbox"
                  checked={form.requiere_sena}
                  onChange={(e) => setForm(f => ({ ...f, requiere_sena: e.target.checked }))}
                  className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <Percent className="w-4 h-4" />
                Requiere seña para reservar
              </label>

              {form.requiere_sena && (
                <div className="mt-3">
                  <label className="text-xs text-amber-700">Porcentaje de seña</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="range"
                      value={form.porcentaje_sena}
                      onChange={(e) => setForm(f => ({ ...f, porcentaje_sena: e.target.value }))}
                      min={10}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-amber-800 w-12 text-right">
                      {form.porcentaje_sena}%
                    </span>
                  </div>
                  {form.precio && (
                    <p className="text-xs text-amber-600 mt-1">
                      Seña: ${Math.round(parseFloat(form.precio) * form.porcentaje_sena / 100)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Palette className="w-4 h-4 inline mr-1" />
                Color en calendario
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORES_SERVICIOS.map(color => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: color.valor }))}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      form.color === color.valor ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color.valor }}
                    title={color.nombre}
                  />
                ))}
              </div>
            </div>

            {/* Asignar Profesionales - solo al editar */}
            {servicio && (
              <div className="border-t pt-4">
                <AsignarProfesionales
                  servicioId={servicio.id}
                  precioBase={parseFloat(form.precio) || servicio.precio || 0}
                />
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4 flex gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                servicio ? 'Guardar cambios' : 'Crear servicio'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
