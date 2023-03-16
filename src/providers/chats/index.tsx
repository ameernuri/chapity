import { useSignal } from '@preact/signals'
import { createContext } from 'preact'
import { Chat, Chats, ChatsContextType, CurrentChat, Message } from '@src/interfaces'
import { useCallback, useState } from 'preact/hooks'

interface Props {
  children: any
}

export const ChatsContext = createContext({} as ChatsContextType)

const ChatsProvider = ({ children }: Props) => {
  const $chats = useSignal({
    current: null,
    list: [],
  } as Chats)

  const [updateCount, setUpdateCount] = useState(0)

  const setCurrentChat = (chat: CurrentChat) => {
    $chats.value.current = chat
    setUpdateCount((x) => x + 1)
  }

  const upsertChat = (uuid: string, delta: Partial<Chat>) => {
    const chat = $chats.value.list.find((chat) => chat.uuid === uuid)

    if (chat) {
      $chats.value.list = $chats.value.list.map((chat) => {
        if (chat.uuid === uuid) {
          return {
            ...chat,
            ...delta,
          }
        }

        return chat
      })
    } else {
      const chats = [
        ...($chats.value.list || []),
        {
          uuid,
          ...delta,
        },
      ]

      $chats.value.list = chats
    }

    setUpdateCount((x) => x + 1)
  }

  const upsertMessage = (chatUuid: string, uuid: string, delta: Partial<Message>) => {
    const chat = $chats.value.list.find((chat) => chat.uuid === chatUuid)

    if (!chat) return

    const message = chat.messages?.find((message) => message.uuid === uuid)

    if (message) {
      chat.messages = chat.messages?.map((message) => {
        if (message.uuid === uuid) {
          return {
            ...message,
            ...delta,
          }
        }

        return message
      })
    } else {
      chat.messages = [
        ...(chat.messages || []),
        {
          uuid,
          ...delta,
        },
      ]
    }

    setUpdateCount((x) => x + 1)
    upsertChat(chatUuid, chat)
  }

  return (
    <ChatsContext.Provider
      value={{
        chats: $chats.value,
        setCurrentChat,
        upsertChat,
        upsertMessage,
      }}
    >
      {children}
    </ChatsContext.Provider>
  )
}

export default ChatsProvider
