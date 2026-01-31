import { marked } from 'marked'

/**
 * Configure marked options for better rendering
 */
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
})

/**
 * Parse markdown text to HTML
 */
export function useMarkdown() {
  const parseMarkdown = (text: string): string => {
    if (!text) return ''

    try {
      return marked.parse(text) as string
    } catch (error) {
      console.error('Markdown parsing error:', error)
      return text
    }
  }

  return {
    parseMarkdown,
  }
}
