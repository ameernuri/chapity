import { useSignal } from '@preact/signals'
import { createContext } from 'preact'
import { useEffect } from 'preact/hooks'

interface Props {
  children: any
}

interface UiContext {
  ui?: {
    chat?: {
      minimized?: {
        value?: boolean
        setValue: (value: boolean) => void
      }
    }
  }
}

export const UiContext = createContext({} as UiContext)

const UiProvider = ({ children }: Props) => {
  const $chatMinimized = useSignal(false)

  const setChatMinimized = (value: boolean) => {
    $chatMinimized.value = value
  }

  return (
    <UiContext.Provider
      value={{
        ui: {
          chat: {
            minimized: {
              value: $chatMinimized.value,
              setValue: setChatMinimized,
            },
          },
        },
      }}
    >
      {children}
    </UiContext.Provider>
  )
}

export default UiProvider
