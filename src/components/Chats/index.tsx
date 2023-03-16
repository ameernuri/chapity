import { useSignal } from '@preact/signals'
import { ChevronRightIcon, PlusCircleIcon, SearchIcon } from '@primer/octicons-react'
import { config } from '@src/config'
import { InternalMessage, Message } from '@src/interfaces'
import { ChatsContext } from '@src/providers/chats'
import c from 'classnames'
import { useCallback, useContext, useEffect, useRef } from 'preact/hooks'
import { v4 as uuid } from 'uuid'
import Browser from 'webextension-polyfill'
import TypingLoader from '../TypingLoader'

import './style.scss'
import SEResize from '../Graphics/se-resize'

const Chats = () => {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { chats, upsertMessage, upsertChat, setCurrentChat } = useContext(ChatsContext)
  const $inputMsg = useSignal(null as any)
  const $currentConvoId = useSignal(null as string | null)
  const $inputTextId = useSignal(null as string | null)
  const $displays = useSignal({} as any)
  const $port = useSignal(null as Browser.Runtime.Port | null)
  const $currentNode = useSignal(null as string | null)
  const $ans = useSignal(null as any | null)
  const $ansEvent = useSignal({} as any)
  const $ansStatus = useSignal('' as any)
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
      switch (msg.inbox) {
        case config.inboxes.res.prompt:
          const { payload } = msg
          $ansEvent.value = payload

          const { conversationId: cid, messageId: mid, chatUuid, msgUuid } = payload

          if (cid) {
            // upsertChat(chatUuid, {
            //   isResponding: true,
            // })
            upsertMessage(chatUuid, mid, {
              id: mid,
              role: 'assistant',
              text: msg.payload.text,
              createdAt: msg.payload.createdAt,
            })
          }

          break

        case config.inboxes.res.conversation:
          {
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
  }, [$ans.value])

  // on ansEvent change
  useEffect(() => {
    const { text, error, event, conversationId, messageId, chatUuid } = $ansEvent.value

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

      // upsertChat(chatUuid, {
      //   isResponding: false,
      // })
    } else if (event === 'DONE') {
      // upsertChat(chatUuid, {
      //   isResponding: false,
      // })
    }
  }, [$ansEvent.value])

  // on inputText change
  useEffect(() => {
    if (!$inputMsg.value || !$inputMsg.value.text.trim().length) return
    const id = $inputMsg.value.msgUuid

    $inputTextId.value = id

    if ($inputMsg.value.display) {
      $displays.value = {
        ...$displays.value,
        [id]: $inputMsg.value.display,
      }
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

  const submitInput = useCallback(
    (chat: any) => {
      const msgUuid = uuid()

      if (!inputRef.current) return

      const text = inputRef.current.value.trim()

      if (!text) return

      const message: Message = {
        uuid: msgUuid,
        text,
        createdAt: new Date().toISOString(),
        role: 'user',
      }

      // upsertChat(chat.uuid, {
      //   isResponding: true,
      // })

      upsertMessage(chat.uuid, msgUuid, message)

      $inputMsg.value = { text, chatUuid: chat.uuid, msgUuid }
      inputRef.current.value = ''
    },
    [inputRef],
  )

  const onInput = useCallback(
    (e: any, chat: any) => {
      // const msgUuid = uuid()

      if (e.key === 'Enter') {
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
          submitInput(chat)
          // const text = e.target?.value.trim()

          // const message: Message = {
          //   uuid: msgUuid,
          //   text,
          //   createdAt: new Date().toISOString(),
          //   role: 'user',
          // }

          // // upsertChat(chat.uuid, {
          // //   isResponding: true,
          // // })

          // upsertMessage(chat.uuid, msgUuid, message)

          // $inputMsg.value = { text, chatUuid: chat.uuid, msgUuid }
          // e.target.value = ''
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

  return (
    <div className={c('content-wrap')}>
      <div className={c('tabs-wrap', 'top-tabs')}>
        <button
          className={c('minimize-btn')}
          onClick={() => {
            setCurrentChat(null)
          }}
        >
          <SEResize style={{ width: 25, height: 25 }} stroke={'#ccc8'} />
        </button>
        <div className={c('tabs')}>
          {chats.list?.map((chat) => {
            return (
              <button
                key={chat.uuid}
                className={c('tab', {
                  'tab-active': chats.current?.uuid === chat.uuid,
                })}
                onClick={() =>
                  setCurrentChat({
                    uuid: chat.uuid,
                    id: chat.id,
                  })
                }
              >
                {chat.title || 'New Chat'}

                {chats.current?.uuid === chat.uuid && <div className={c('tab-close')}></div>}
              </button>
            )
          })}
        </div>
      </div>

      {chats.list?.map((chat) => {
        return (
          <div
            key={chat.uuid}
            className={c({
              'hidden-chat': chat.uuid !== chats.current?.uuid,
            })}
          >
            <div className={c('chat-wrap')}>
              {chat.messages ? (
                chat.messages.map((message) => {
                  return (
                    <div
                      key={message.uuid}
                      className={c('msg', {
                        'msg-search': message.type === 'search',
                        'msg-user': message.role === 'user',
                        'msg-assistant': message.role === 'assistant',
                        'msg-system': message.role === 'system',
                        'msg-hidden': message.hidden,
                      })}
                    >
                      {message.type === 'search' && (
                        <span className={c('msg-icon')}>
                          <SearchIcon />
                        </span>
                      )}
                      {message.display || message.text || ''}

                      {/* <div>{new Date(message.createdAt)}</div> */}
                    </div>
                  )
                })
              ) : (
                <div className={c('no-messages')}>
                  <i>no messages</i>
                </div>
              )}
            </div>

            <div
              className={c({
                'chat-input-wrap': true,
              })}
            >
              {chat.isResponding ? (
                <TypingLoader />
              ) : (
                <textarea
                  ref={inputRef}
                  className={c('chat-input')}
                  onKeyDown={(e) => onInput(e, chat)}
                  placeholder="Chat with me..."
                ></textarea>
              )}
            </div>
          </div>
        )
      })}
      <div className={c('tabs-wrap', 'bottom-tabs')}>
        <div>
          <button
            className={c('footer-btn', 'add-btn')}
            onClick={() => {
              const chatUuid = uuid()
              const chat = {
                uuid: chatUuid,
              }

              upsertChat(chatUuid, {})

              setCurrentChat(chat)
            }}
          >
            <PlusCircleIcon className={c('button-icon')} />
            NEW CHAT
          </button>
        </div>
        <div>
          <button
            className={c('footer-btn', 'submit-btn')}
            onClick={() => {
              if (!chats.current) return

              submitInput(chats.current)
            }}
          >
            <ChevronRightIcon className={c('button-icon')} size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chats
