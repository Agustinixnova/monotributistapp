import { useState, useCallback } from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon,
  Image as ImageIcon, Youtube, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Heading1, Heading2, Heading3,
  Undo, Redo, X
} from 'lucide-react'
import { ImageUploader } from './ImageUploader'
import { VideoEmbed } from './VideoEmbed'

/**
 * Barra de herramientas del editor TipTap
 */
export function TipTapToolbar({ editor, articuloId }) {
  const [showImageUploader, setShowImageUploader] = useState(false)
  const [showVideoEmbed, setShowVideoEmbed] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  if (!editor) return null

  const ToolButton = ({ onClick, active, disabled, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded transition-colors
        ${active
          ? 'bg-violet-100 text-violet-700'
          : 'text-gray-600 hover:bg-gray-100'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {children}
    </button>
  )

  const Divider = () => (
    <div className="w-px h-6 bg-gray-300 mx-1" />
  )

  const setLink = useCallback(() => {
    if (!linkUrl) {
      editor.chain().focus().unsetLink().run()
      setShowLinkInput(false)
      setLinkUrl('')
      return
    }

    // Asegurar que la URL tenga protocolo
    let finalUrl = linkUrl.trim()
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl
    }

    // Si hay texto seleccionado, aplicar link
    const { from, to } = editor.state.selection
    if (from !== to) {
      editor.chain().focus().setLink({ href: finalUrl }).run()
    } else {
      // Si no hay selección, insertar el URL como texto con link
      editor.chain().focus().insertContent({
        type: 'text',
        text: linkUrl,
        marks: [{ type: 'link', attrs: { href: finalUrl } }]
      }).run()
    }

    setShowLinkInput(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  const handleImageUpload = (url) => {
    editor.chain().focus().setImage({ src: url, width: '100%' }).run()
    setShowImageUploader(false)
  }

  const handleVideoEmbed = (url) => {
    editor.chain().focus().setYoutubeVideo({ src: url }).run()
    setShowVideoEmbed(false)
  }

  return (
    <div className="border-b border-gray-300 bg-gray-50 p-2">
      <div className="flex flex-wrap items-center gap-1">
        {/* Deshacer/Rehacer */}
        <ToolButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Deshacer"
        >
          <Undo className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Rehacer"
        >
          <Redo className="w-4 h-4" />
        </ToolButton>

        <Divider />

        {/* Encabezados */}
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Titulo 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Titulo 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Titulo 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolButton>

        <Divider />

        {/* Formato de texto */}
        <ToolButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Negrita"
        >
          <Bold className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Cursiva"
        >
          <Italic className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Subrayado"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolButton>

        <Divider />

        {/* Alineacion */}
        <ToolButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Alinear izquierda"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Centrar"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Alinear derecha"
        >
          <AlignRight className="w-4 h-4" />
        </ToolButton>

        <Divider />

        {/* Listas */}
        <ToolButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Lista con puntos"
        >
          <List className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Lista numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Cita"
        >
          <Quote className="w-4 h-4" />
        </ToolButton>

        <Divider />

        {/* Links */}
        <ToolButton
          onClick={() => {
            if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run()
            } else {
              setShowLinkInput(!showLinkInput)
              // Pre-llenar con URL existente si hay
              const { href } = editor.getAttributes('link')
              if (href) {
                setLinkUrl(href)
              }
            }
          }}
          active={editor.isActive('link') || showLinkInput}
          title={editor.isActive('link') ? 'Quitar enlace' : 'Insertar enlace'}
        >
          <LinkIcon className="w-4 h-4" />
        </ToolButton>

        {/* Imagen */}
        <ToolButton
          onClick={() => setShowImageUploader(!showImageUploader)}
          active={showImageUploader}
          title="Insertar imagen"
        >
          <ImageIcon className="w-4 h-4" />
        </ToolButton>

        {/* Video */}
        <ToolButton
          onClick={() => setShowVideoEmbed(!showVideoEmbed)}
          active={showVideoEmbed}
          title="Insertar video YouTube"
        >
          <Youtube className="w-4 h-4" />
        </ToolButton>
      </div>

      {/* Input para links */}
      {showLinkInput && (
        <div className="mt-2 p-3 bg-violet-50 rounded border border-violet-200">
          <p className="text-xs text-violet-700 mb-2">
            {editor.state.selection.empty
              ? 'Ingresá la URL y se insertará como texto con link'
              : 'Ingresá la URL para aplicar al texto seleccionado'
            }
          </p>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="ejemplo.com o https://ejemplo.com"
              className="flex-1 px-3 py-2 border border-violet-300 rounded text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              onKeyDown={(e) => e.key === 'Enter' && setLink()}
              autoFocus
            />
            <button
              type="button"
              onClick={setLink}
              disabled={!linkUrl.trim()}
              className="px-4 py-2 bg-violet-600 text-white rounded text-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
              className="p-2 text-gray-500 hover:text-gray-700 rounded hover:bg-white transition-colors"
              title="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Uploader de imagenes */}
      {showImageUploader && (
        <div className="mt-2">
          <ImageUploader
            articuloId={articuloId}
            onUpload={handleImageUpload}
            onClose={() => setShowImageUploader(false)}
          />
        </div>
      )}

      {/* Embed de video */}
      {showVideoEmbed && (
        <div className="mt-2">
          <VideoEmbed
            onEmbed={handleVideoEmbed}
            onClose={() => setShowVideoEmbed(false)}
          />
        </div>
      )}
    </div>
  )
}
