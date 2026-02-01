/**
 * Modal principal de Herramientas de Desarrollo
 * Solo visible para agustin@ixnova.com.ar
 * Tema: Dark Mode
 */

import { useState } from 'react'
import { X, Wrench, Activity, AlertTriangle, History, MessageSquare, Globe } from 'lucide-react'
import PanelSalud from './PanelSalud'
import PanelErrores from './PanelErrores'
import PanelAuditoria from './PanelAuditoria'
import PanelFeedback from './PanelFeedback'
import PanelApiLogs from './PanelApiLogs'

const TABS = [
  { id: 'salud', label: 'Salud', icon: Activity },
  { id: 'errores', label: 'Errores', icon: AlertTriangle },
  { id: 'apis', label: 'APIs', icon: Globe },
  { id: 'auditoria', label: 'Auditoría', icon: History },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare }
]

export default function DevToolsModal({ isOpen, onClose }) {
  const [tabActiva, setTabActiva] = useState('salud')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg">Dev Tools</h3>
                <p className="text-white/80 text-sm">Herramientas de desarrollo</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700 bg-gray-800 px-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                  tabActiva === tab.id
                    ? 'text-orange-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
                {tabActiva === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 bg-gray-900">
            {tabActiva === 'salud' && <PanelSalud darkMode />}
            {tabActiva === 'errores' && <PanelErrores darkMode />}
            {tabActiva === 'apis' && <PanelApiLogs />}
            {tabActiva === 'auditoria' && <PanelAuditoria />}
            {tabActiva === 'feedback' && <PanelFeedback />}
          </div>
        </div>
      </div>
    </div>
  )
}
