import { config } from '@src/config'
import ActionButton from '../ActionButton'
import './style.scss'
import { useEffect, useState } from 'react'
import Browser from 'webextension-polyfill'
import { ulid } from 'ulid'
import { useCallback, useContext } from 'preact/hooks'
import YTCaptions from '@src/lib/yt'
import { useSignal } from '@preact/signals'
import TypingLoader from '../TypingLoader'
import { HostContext } from '@src/providers/host'
import { UiContext } from '@src/providers/ui'
import { v4 as uuid } from 'uuid'
import { CommentIcon, CopyIcon, PlayIcon, TasklistIcon } from '@primer/octicons-react'
import Chats from '../Chats'
import { ChatsContext } from '@src/providers/chats'
import c from 'classnames'

const Content = () => {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('')
  const [answer, setAnswer] = useState({} as any)
  const [convo, setConvo] = useState({} as any)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState({} as any)
  const [done, setDone] = useState(false)

  const { chats, setCurrentChat, upsertChat } = useContext(ChatsContext)

  const { selection, size, location } = useContext(HostContext)
  const { ui } = useContext(UiContext)

  const $youtubeCaption = useSignal(null as null | string)
  const $contentActive = useSignal(false)

  useEffect(() => {
    const port = Browser.runtime.connect()

    if (!input) return

    const listener = (msg: any) => {
      setMsg(msg)

      if (msg.text) {
        setAnswer(msg)
        setStatus('success')
      } else if (msg.error) {
        setError(msg.error)
        setStatus('error')
      } else if (msg.event === 'DONE') {
        setDone(true)
      }
    }

    port.onMessage.addListener(listener)
    port.postMessage({
      id: uuid(),
      inbox: config.inboxes.req.prompt,
      payload: {
        text: input,
        conversationId: answer?.conversationId,
        parentId: answer?.messageId,
      },
    })

    return () => {
      port.onMessage.removeListener(listener)
      port.disconnect()
    }
  }, [input])

  useEffect(() => {
    const port = Browser.runtime.connect()

    const id = answer?.conversationId

    if (!id) return

    const listener = (convo: any) => {
      setConvo(convo)
    }

    port.onMessage.addListener(listener)

    port.postMessage({
      id: ulid(),
      inbox: config.inboxes.req.conversation,
      payload: {
        id,
      },
    })

    return () => {
      port.onMessage.removeListener(listener)
      port.disconnect()
    }
  }, [input])

  useEffect(() => {
    if (isYoutubeVideo()) {
      getVideoCaption()
    }
  }, [location?.href])

  const isYoutubeVideo = useCallback(() => {
    return window.location.href.startsWith('https://www.youtube.com/watch?')
  }, [location?.href])

  const getVideoCaption = useCallback(async () => {
    const captions = YTCaptions.extractCaptions(document.documentElement.innerHTML)
    console.log({ captions })
    const caption1 = captions.captionTracks[0]

    const captionString = await YTCaptions.getCaptionString(caption1)

    console.log({ captionString })

    $youtubeCaption.value = captionString.map((line: any) => `${line.text}`).join('\n')
  }, [document.documentElement.innerHTML])

  return (
    <div>
      {!chats.current ? (
        <div className={c('action-list')}>
          <ActionButton
            onClick={() => {
              if (!chats.list?.length) {
                const chatUuid = uuid()
                const chat = {
                  uuid: chatUuid,
                }

                upsertChat(chatUuid, {})
                setCurrentChat(chat)
              } else {
                setCurrentChat({ uuid: chats?.list[0]?.uuid })
              }
            }}
          >
            Chat <CommentIcon size={16} />
          </ActionButton>
        </div>
      ) : (
        <Chats />
      )}
    </div>
  )
}

export default Content
