import { Download, FileText, FileSpreadsheet, Image as ImageIcon, File } from 'lucide-react'
import { formatFileSize } from '../services/educacionStorageService'

/**
 * Obtener icono segun tipo MIME
 */
function getIcon(mimeType) {
  if (!mimeType) return File
  if (mimeType.startsWith('image/')) return ImageIcon
  if (mimeType === 'application/pdf') return FileText
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet
  if (mimeType.includes('word') || mimeType.includes('document')) return FileText
  return File
}

/**
 * Obtener color segun tipo
 */
function getColor(mimeType) {
  if (!mimeType) return 'gray'
  if (mimeType.startsWith('image/')) return 'blue'
  if (mimeType === 'application/pdf') return 'red'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'green'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'blue'
  return 'gray'
}

/**
 * Lista de adjuntos descargables para mostrar en el articulo
 */
export function AdjuntosLista({ adjuntos = [] }) {
  if (!adjuntos || adjuntos.length === 0) return null

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Download className="w-5 h-5 text-violet-600" />
        Material descargable
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {adjuntos.map((adjunto) => {
          const IconComponent = getIcon(adjunto.mime_type)
          const color = getColor(adjunto.mime_type)

          const colorClasses = {
            gray: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
            red: 'bg-red-50 text-red-600 hover:bg-red-100',
            green: 'bg-green-50 text-green-600 hover:bg-green-100'
          }

          const iconBgClasses = {
            gray: 'bg-gray-200',
            blue: 'bg-blue-100',
            red: 'bg-red-100',
            green: 'bg-green-100'
          }

          return (
            <a
              key={adjunto.id}
              href={adjunto.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className={`
                flex items-center gap-3 p-4 rounded-lg border border-gray-200
                transition-all duration-200 group
                hover:shadow-md hover:border-violet-300
                ${colorClasses[color]}
              `}
            >
              <div className={`p-2.5 rounded-lg ${iconBgClasses[color]}`}>
                <IconComponent className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate group-hover:text-violet-700">
                  {adjunto.titulo || adjunto.nombre_original}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(adjunto.tamanio)}
                </p>
              </div>

              <Download className="w-5 h-5 text-gray-400 group-hover:text-violet-600 flex-shrink-0" />
            </a>
          )
        })}
      </div>
    </div>
  )
}
