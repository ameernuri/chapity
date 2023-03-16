import { useSignal } from '@preact/signals'
import { ChatsContext } from '@src/providers/chats'
import { useCallback, useContext } from 'preact/hooks'
import Chats from '../Chats'
import { v4 as uuid } from 'uuid'

const Content = () => {
  const $debug = useSignal(false)
  const $closed = useSignal(false)
  const { chats, upsertChat, setCurrentChat } = useContext(ChatsContext)

  const startChat = useCallback(() => {
    const chat = {
      uuid: uuid(),
    }

    setCurrentChat(chat)
    upsertChat(chat.uuid, chat)
  }, [])

  return (
    !$closed.value && (
      <div
        style={{
          background: '#ffffffdd',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'scroll',
        }}
      >
        <div>
          <button
            onClick={() => {
              $closed.value = !$closed.value
            }}
          >
            x
          </button>
          <button
            onClick={() => {
              $debug.value = !$debug.value
            }}
          >
            Debug
          </button>
        </div>
        {$debug.value ? (
          <div>
            <code>{JSON.stringify(chats, null, 2)}</code>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateRows: '1fr 50px',
            }}
          >
            <Chats />
            <div>
              <button onClick={startChat}>start chat</button>
            </div>
          </div>
        )}
      </div>
    )
  )
}

export default Content
