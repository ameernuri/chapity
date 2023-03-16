import { useSignal } from '@preact/signals'
import { config } from '@src/config'
import { InternalMessage, Message } from '@src/interfaces'
import { ChatsContext } from '@src/providers/chats'
import c from 'classnames'
import { useCallback, useContext, useEffect } from 'preact/hooks'
import { v4 as uuid } from 'uuid'
import Browser from 'webextension-polyfill'
import TypingLoader from '../TypingLoader'

const Chats = () => {
  const { chats, upsertMessage, upsertChat, setCurrentChat } = useContext(ChatsContext)
  const $inputMsg = useSignal(null as any)
  const $currentConvoId = useSignal(null as string | null)
  const $inputTextId = useSignal(null as string | null)
  const $displays = useSignal({} as any)
  const $port = useSignal(null as Browser.Runtime.Port | null)
  const $currentNode = useSignal(null as string | null)
  const $ans = useSignal(null as any | null)
  const $ansEvent = useSignal({} as any)
  const $ansLoading = useSignal(false)
  const $ansStatus = useSignal(undefined as any)
  const $ansError = useSignal(null as any)

  // init port
  useEffect(() => {
    $port.value = Browser.runtime.connect()

    $port.value?.onDisconnect?.addListener(() => {
      $port.value = Browser.runtime.connect()
    })

    return () => {
      $port.value?.disconnect?.()
    }
  }, [])

  // listen for messages
  useEffect(() => {
    const listener = (msg: InternalMessage) => {
      $ansLoading.value = true

      switch (msg.inbox) {
        case config.inboxes.res.prompt:
          const { payload } = msg
          $ansEvent.value = payload

          const { conversationId: cid, messageId: mid, chatUuid, msgUuid } = payload

          console.log({ msg })

          if (cid) {
            upsertChat(chatUuid, {})
            upsertMessage(chatUuid, mid, {
              id: mid,
              role: 'assistant',
              text: msg.payload.text,
              createdAt: new Date(msg.payload.data?.created).toISOString(),
            })
          }

          break

        case config.inboxes.res.conversation:
          {
            onConvoResult(msg)
          }
          break
      }
    }

    $port.value?.onMessage?.addListener(listener)

    return () => {
      $port.value?.onMessage?.removeListener(listener)
    }
  }, [$port.value, $currentConvoId.value])

  // get current conversation
  useEffect(() => {
    if (!$currentConvoId.value) return

    $port.value?.postMessage({
      inbox: config.inboxes.req.conversation,
      payload: {
        id: $currentConvoId.value,
      },
    })
  }, [$currentConvoId.value, $currentNode.value])

  //on ans change update convos
  useEffect(() => {
    if (!$ans.value) return

    const { text, conversationId, messageId } = $ans.value

    if (!text || !conversationId || !messageId) return

    const msg = {
      id: messageId,
      message: {
        id: messageId,
        author: {
          role: 'assistant',
        },
        content: {
          content_type: 'text',
          parts: [text],
        },
      },
    }

    updateConvoMsg(conversationId, messageId, msg)
  }, [$ans.value])

  // on ansEvent change
  useEffect(() => {
    const { text, error, event, conversationId, messageId } = $ansEvent.value

    if (conversationId) {
      $currentConvoId.value = conversationId
    }

    if (text) {
      $ans.value = $ansEvent.value
      $ansStatus.value = 'success'
      $currentNode.value = messageId
    } else if (error) {
      $ansError.value = error
      $ansStatus.value = 'error'
    } else if (event === 'DONE') {
      $ansLoading.value = false
    }
  }, [$ansEvent.value])

  // on inputText change
  useEffect(() => {
    if (!$inputMsg.value || !$inputMsg.value?.text?.trim()?.length) return
    const id = $inputMsg.value.msgUuid

    $inputTextId.value = id

    if ($inputMsg.value.display) {
      $displays.value = {
        ...$displays.value,
        [id]: $inputMsg.value.display,
      }
    }

    const msg = {
      id,
      message: {
        id,
        author: {
          role: 'user',
        },
        content: {
          content_type: 'text',
          parts: [$inputMsg.value.text],
        },
      },
    }

    if ($currentConvoId.value) {
      updateConvoMsg($currentConvoId.value, id, msg)
    }

    const currentChat = (chats.list || []).find((chat) => chat.uuid === chats.current?.uuid)

    console.log({ msgs: currentChat?.messages })
    const history = currentChat?.messages?.map((msg) => ({
      content: msg.text,
      role: msg.role || 'user',
    }))

    const { text } = $inputMsg.value

    if (!text?.trim()) return

    const payload = {
      id,
      context: history,
      text,
      chatUuid: $inputMsg.value.chatUuid,
      msgUuid: $inputMsg.value.msgUuid,
      conversationId: $currentConvoId.value,
      parentId: $currentNode.value,
    }

    console.log({ payload })

    $port.value?.postMessage({
      inbox: config.inboxes.req.prompt,
      from: id,
      payload,
    })

    $port.value?.onMessage.addListener((msg: any) => {
      if (msg.to === id) {
        $inputTextId.value = null

        // const cid = msg.payload.conversationId

        // console.log('1st', { msg })

        // if (cid) {
        //   upsertMessage(cid, id, {
        //     id,
        //     uuid: id,
        //     role: 'assistant',
        //     text: msg.payload.text,
        //   })
        // }
      }
    })
  }, [$inputMsg.value])

  const onInput = useCallback(
    (e: any, chat: any) => {
      const msgUuid = uuid()

      if (e.key === 'Enter') {
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
          const text = e.target?.value.trim()

          const message: Message = {
            uuid: msgUuid,
            text,
            createdAt: new Date().toISOString(),
            role: 'user',
          }

          upsertMessage(chat.uuid, msgUuid, message)

          $inputMsg.value = { text, chatUuid: chat.uuid, msgUuid }
          e.target.value = ''
          e.preventDefault()
        }
      }

      e.target.style.height = 'inherit'

      // Get the computed styles for the element
      const computed = window.getComputedStyle(e.target)

      // Calculate the height
      const height =
        parseInt(computed.getPropertyValue('border-top-width'), 10) +
        parseInt(computed.getPropertyValue('padding-top'), 10) +
        e.target.scrollHeight +
        parseInt(computed.getPropertyValue('padding-bottom'), 10) +
        parseInt(computed.getPropertyValue('border-bottom-width'), 10)

      e.target.style.height = `${height > 200 ? 200 : height}px`
    },
    [$currentConvoId.value, $inputTextId.value],
  )

  const updateConvoMsg = useCallback((conversationId: string, messageId: string, msg: any) => {},
  [])

  const onConvoResult = useCallback((msg: any) => {}, [$ansLoading.value, $currentConvoId.value])

  const updateConvo = useCallback((id: string, data: any) => {}, [])

  return (
    <div
      style={{
        display: 'grid',
        gap: '20px',
      }}
    >
      {chats.list?.map((chat) => {
        return (
          <div
            key={chat.uuid}
            style={{
              border: '2px solid #000000',
              borderColor: chat.uuid === chats.current?.uuid ? '#ff0000' : '#000000',
              cursor: 'pointer',
            }}
            onClick={() => {
              setCurrentChat({
                uuid: chat.uuid,
                id: chat.id,
              })
            }}
          >
            {chat.uuid}
            {chat.title}
            <div>
              {chat.messages ? (
                chat.messages.map((message) => {
                  return (
                    <div
                      key={message.uuid}
                      style={{
                        border: '1px solid #000000',
                      }}
                    >
                      {message.text}
                      <div>{message.createdAt}</div>
                    </div>
                  )
                })
              ) : (
                <i>no messages</i>
              )}
            </div>

            <div
              className={c({
                'chat-input-wrap': true,
              })}
            >
              {$ansLoading.value ? (
                <TypingLoader />
              ) : (
                <textarea
                  className={c('chat-input')}
                  onKeyDown={(e) => onInput(e, chat)}
                  placeholder="Chat with me..."
                ></textarea>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Chats
