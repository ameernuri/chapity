import { Readability } from '@mozilla/readability'
import { useSignal } from '@preact/signals'
import { createContext } from 'preact'
import { useEffect } from 'preact/hooks'

interface Props {
  children: any
}

interface HostContext {
  selection?: string
  parsedContent?: ParsedContent
  location?: any
  size?: {
    innerWidth?: number
    innerHeight?: number
    outerWidth?: number
    outerHeight?: number
  }
}

type ParsedContent = null | {
  title: string
  byline: string
  dir: string // direction
  content: string
  textContent: string
  length: number
  excerpt: string
  siteName: string
}

export const HostContext = createContext({} as HostContext)

const HostProvider = ({ children }: Props) => {
  const $selection = useSignal('')
  const $parsedContent = useSignal(null as ParsedContent)
  const $location = useSignal(null as any)
  const $size = useSignal({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
  })

  useEffect(() => {
    const doc = document.cloneNode(true) as Document
    $parsedContent.value = new Readability(doc).parse()

    const selectionListener = (_: any) => {
      const selection = window.getSelection()
      const text = selection?.toString()

      $selection.value = text ? text.trim() : ''
    }

    document.addEventListener('selectionchange', selectionListener)

    const locationListener = (_: any) => {
      const doc = document.cloneNode(true) as Document
      $parsedContent.value = new Readability(doc).parse()
      $location.value = window.location
    }

    window.addEventListener('locationchange', locationListener)

    const resizeListener = (_: any) => {
      $size.value = {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
      }
    }

    window.addEventListener('resize', resizeListener)

    return () => {
      document.removeEventListener('selectionchange', selectionListener)
      window.removeEventListener('locationchange', locationListener)
    }
  }, [])

  return (
    <HostContext.Provider
      value={{
        selection: $selection.value,
        parsedContent: $parsedContent.value,
        location: $location.value,
        size: $size.value,
      }}
    >
      {children}
    </HostContext.Provider>
  )
}

export default HostProvider
