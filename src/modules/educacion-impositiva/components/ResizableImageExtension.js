import Image from '@tiptap/extension-image'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ResizableImageComponent } from './ResizableImage'

/**
 * Extension de Image con soporte para redimensionar
 */
export const ResizableImage = Image.extend({
  name: 'resizableImage',

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: element => element.getAttribute('data-width') || element.style.width || '100%',
        renderHTML: attributes => {
          return {
            'data-width': attributes.width,
            style: `width: ${attributes.width}`
          }
        }
      }
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent)
  }
})
