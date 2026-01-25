/**
 * Componente simple para renderizar Markdown básico
 * Soporta: headers, párrafos, listas, bold, italic, links, código inline
 */

export function SimpleMarkdown({ children }) {
  if (!children) return null

  const renderMarkdown = (text) => {
    // Dividir por líneas dobles (párrafos)
    const blocks = text.split(/\n\n+/)

    return blocks.map((block, blockIndex) => {
      const trimmedBlock = block.trim()
      if (!trimmedBlock) return null

      // Headers
      if (trimmedBlock.startsWith('# ')) {
        return <h1 key={blockIndex} className="text-3xl font-bold text-gray-900 mb-4 mt-6">{parseInline(trimmedBlock.slice(2))}</h1>
      }
      if (trimmedBlock.startsWith('## ')) {
        return <h2 key={blockIndex} className="text-2xl font-bold text-gray-900 mb-3 mt-5">{parseInline(trimmedBlock.slice(3))}</h2>
      }
      if (trimmedBlock.startsWith('### ')) {
        return <h3 key={blockIndex} className="text-xl font-semibold text-gray-900 mb-2 mt-4">{parseInline(trimmedBlock.slice(4))}</h3>
      }
      if (trimmedBlock.startsWith('#### ')) {
        return <h4 key={blockIndex} className="text-lg font-semibold text-gray-900 mb-2 mt-3">{parseInline(trimmedBlock.slice(5))}</h4>
      }

      // Horizontal rule
      if (trimmedBlock === '---' || trimmedBlock === '***') {
        return <hr key={blockIndex} className="my-6 border-gray-200" />
      }

      // Lista no ordenada
      if (trimmedBlock.match(/^[-*]\s/m)) {
        const items = trimmedBlock.split('\n').filter(line => line.match(/^[-*]\s/))
        return (
          <ul key={blockIndex} className="list-disc list-inside space-y-1 mb-4 text-gray-700">
            {items.map((item, i) => (
              <li key={i}>{parseInline(item.replace(/^[-*]\s/, ''))}</li>
            ))}
          </ul>
        )
      }

      // Lista ordenada
      if (trimmedBlock.match(/^\d+\.\s/m)) {
        const items = trimmedBlock.split('\n').filter(line => line.match(/^\d+\.\s/))
        return (
          <ol key={blockIndex} className="list-decimal list-inside space-y-1 mb-4 text-gray-700">
            {items.map((item, i) => (
              <li key={i}>{parseInline(item.replace(/^\d+\.\s/, ''))}</li>
            ))}
          </ol>
        )
      }

      // Párrafo normal
      return <p key={blockIndex} className="mb-4 text-gray-700 leading-relaxed">{parseInline(trimmedBlock)}</p>
    })
  }

  // Parsear elementos inline (bold, italic, links, código)
  const parseInline = (text) => {
    if (!text) return text

    const parts = []
    let remaining = text
    let key = 0

    while (remaining.length > 0) {
      // Bold **text** o __text__
      let match = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)$/s) || remaining.match(/^(.*?)__(.+?)__(.*)$/s)
      if (match) {
        if (match[1]) parts.push(<span key={key++}>{match[1]}</span>)
        parts.push(<strong key={key++} className="font-semibold">{match[2]}</strong>)
        remaining = match[3]
        continue
      }

      // Italic *text* o _text_
      match = remaining.match(/^(.*?)\*(.+?)\*(.*)$/s) || remaining.match(/^(.*?)_(.+?)_(.*)$/s)
      if (match && !match[1].endsWith('*') && !match[3].startsWith('*')) {
        if (match[1]) parts.push(<span key={key++}>{match[1]}</span>)
        parts.push(<em key={key++} className="italic">{match[2]}</em>)
        remaining = match[3]
        continue
      }

      // Código inline `code`
      match = remaining.match(/^(.*?)`(.+?)`(.*)$/s)
      if (match) {
        if (match[1]) parts.push(<span key={key++}>{match[1]}</span>)
        parts.push(<code key={key++} className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-violet-700">{match[2]}</code>)
        remaining = match[3]
        continue
      }

      // Links [text](url)
      match = remaining.match(/^(.*?)\[(.+?)\]\((.+?)\)(.*)$/s)
      if (match) {
        if (match[1]) parts.push(<span key={key++}>{match[1]}</span>)
        parts.push(
          <a
            key={key++}
            href={match[3]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 hover:text-violet-700 underline"
          >
            {match[2]}
          </a>
        )
        remaining = match[4]
        continue
      }

      // No más matches, agregar el resto como texto
      parts.push(<span key={key++}>{remaining}</span>)
      break
    }

    return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts
  }

  return (
    <div className="prose-custom">
      {renderMarkdown(children)}
    </div>
  )
}

export default SimpleMarkdown
