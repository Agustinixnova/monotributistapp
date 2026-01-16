import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { ResizableImage } from './ResizableImageExtension'
import { TipTapToolbar } from './TipTapToolbar'

/**
 * Editor TipTap completo con todas las extensiones
 */
export function TipTapEditor({
  content,
  onChange,
  placeholder = 'Escribe el contenido del articulo...',
  editable = true,
  articuloId = null,
  className = ''
}) {
  const initialContentSet = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-inside'
          }
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal list-inside'
          }
        },
        listItem: {
          HTMLAttributes: {
            class: 'ml-4'
          }
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-violet-600 underline hover:text-violet-700'
        }
      }),
      ResizableImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'cursor-move'
        }
      }),
      Youtube.configure({
        inline: false,
        width: '100%',
        height: 400
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Placeholder.configure({
        placeholder
      })
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      onChange?.(json)
    }
  })

  // Actualizar contenido cuando llega del servidor (solo la primera vez)
  useEffect(() => {
    if (editor && content && !initialContentSet.current) {
      editor.commands.setContent(content)
      initialContentSet.current = true
    }
  }, [editor, content])

  if (!editor) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-gray-400">Cargando editor...</span>
      </div>
    )
  }

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {editable && (
        <TipTapToolbar editor={editor} articuloId={articuloId} />
      )}
      <EditorContent
        editor={editor}
        className={`
          prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none
          prose-headings:font-heading prose-headings:text-gray-900
          prose-p:text-gray-700 prose-p:leading-relaxed
          prose-a:text-violet-600 prose-a:underline hover:prose-a:text-violet-700
          prose-img:rounded-lg prose-img:shadow-md
          prose-blockquote:border-l-violet-500 prose-blockquote:bg-violet-50 prose-blockquote:py-1
          prose-ul:list-disc prose-ul:pl-6 prose-ul:my-3
          prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-3
          prose-li:text-gray-700 prose-li:my-1
          [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[280px]
          [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6
          [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6
          [&_.ProseMirror_li]:ml-2 [&_.ProseMirror_li]:text-gray-700
          [&_.ProseMirror_a]:text-violet-600 [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:cursor-pointer
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0
          ${!editable ? 'bg-gray-50' : 'bg-white'}
        `}
      />
    </div>
  )
}

/**
 * Visor de contenido TipTap (solo lectura)
 */
export function TipTapViewer({ content, className = '' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-inside'
          }
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal list-inside'
          }
        },
        listItem: {
          HTMLAttributes: {
            class: 'ml-4'
          }
        }
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-violet-600 underline hover:text-violet-700'
        }
      }),
      Image,
      Youtube.configure({
        width: '100%',
        height: 400
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      })
    ],
    content: content || '',
    editable: false
  })

  if (!editor) {
    return (
      <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
    )
  }

  return (
    <EditorContent
      editor={editor}
      className={`
        prose prose-sm sm:prose-base max-w-none
        prose-headings:font-heading prose-headings:text-gray-900
        prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
        prose-p:text-gray-700 prose-p:leading-relaxed
        prose-a:text-violet-600 prose-a:underline hover:prose-a:text-violet-700
        prose-img:rounded-lg prose-img:shadow-md prose-img:mx-auto
        prose-blockquote:border-l-violet-500 prose-blockquote:bg-violet-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
        prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4
        prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4
        prose-li:text-gray-700 prose-li:my-2
        prose-strong:text-gray-900
        prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded
        [&_.ProseMirror]:outline-none
        [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6
        [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6
        [&_.ProseMirror_li]:ml-2 [&_.ProseMirror_li]:text-gray-700
        [&_.ProseMirror_a]:text-violet-600 [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:cursor-pointer
        ${className}
      `}
    />
  )
}
