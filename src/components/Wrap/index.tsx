import Content from '../Content'
import './style.scss'
import LogoFace from '../Logo/Face'
import { useContext, useEffect } from 'preact/hooks'
import { getPossibleElementByQuerySelector } from '@src/lib/utils'
import { HostContext } from '@src/providers/host'
import { config } from '@src/config'
import { ChatsContext } from '@src/providers/chats'
import { v4 as uuid } from 'uuid'
import Browser from 'webextension-polyfill'
import { useSignal } from '@preact/signals'
import { InternalMessage } from '@src/interfaces'

function Wrap() {
  const { chats, setCurrentChat, upsertChat, upsertMessage } = useContext(ChatsContext)
  const $port = useSignal(null as Browser.Runtime.Port | null)

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

  const { parsedContent } = useContext(HostContext)

  useEffect(() => {
    // if (!setPrompt) return

    const siteRegex = new RegExp(Object.keys(config.searchEngines).join('|'))
    const siteName = (location.hostname.match(siteRegex) || [null])[0]
    const siteConfig = siteName ? config.searchEngines[siteName] : null

    const bodyText = document.body.innerText.slice(0, 2000)

    const searchInput = siteConfig
      ? getPossibleElementByQuerySelector<HTMLInputElement>(siteConfig.inputQuery)
      : null

    if (searchInput?.value) {
      const prompt = `For the following query for ${siteName}, provide a helpful answer using the result from ${siteName} only as context to help you understand the question and to get latest information. If you don't need the result to answer the question, ignore it and answer on your own. If you don't understand the context, use the search result to figure out the context and provide an answer. If you don't know the answer, use the search result to extract the answer. If you use search results in the answer, provide inline links in a markdown format like [reference](https://example.com/reference-link) \n\nQuery: ${
        searchInput.value
      }\n\nSearch Result from ${siteName}: ${parsedContent?.textContent || bodyText}`

      // const prompt = `${searchInput.value}\n\nHere's the search result from ${siteName} for the above prompt:\n\n${bodyText}\n\nAnswer the prompt and use the content from ${siteName} only as a context to help you answer the prompt. If the prompt is not clear, make a guess of the context based on the search result from ${siteName} and answer the prompt as best as you can. If you use search results in the answer, provide inline links in a markdown format like: [1](https://example.com/reference-link)`

      console.log('prompt', prompt)

      const chatUuid = uuid()
      const msgUuid = uuid()

      upsertChat(chatUuid, {
        uuid: chatUuid,
        messages: [
          {
            id: msgUuid,
            uuid: msgUuid,
            role: 'user',
            text: prompt,
            display: searchInput.value,
            type: 'search',
            createdAt: new Date().toISOString(),
          },
        ],
      })

      setCurrentChat({ uuid: chatUuid })

      $port.value?.postMessage({
        id: msgUuid,
        inbox: config.inboxes.req.prompt,
        from: msgUuid,
        payload: {
          chatUuid,
          msgUuid,
          text: prompt,
        },
      })
    }
  }, [chats])

  // listen for messages
  useEffect(() => {
    const listener = (msg: InternalMessage) => {
      switch (msg.inbox) {
        case config.inboxes.res.prompt:
          const { payload } = msg
          // $ansEvent.value = payload

          const { conversationId: cid, messageId: mid, chatUuid, msgUuid } = payload

          if (cid) {
            // upsertChat(chatUuid, {
            //   isResponding: true,
            // })
            upsertMessage(chatUuid, mid, {
              id: mid,
              role: 'assistant',
              text: msg.payload.text,
              createdAt: msg.payload.data?.created,
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
  }, [$port.value])

  return (
    <>
      <div className="float-wrap">
        <Content />

        <div
          className="fab"
          onClick={() => {
            if (chats.current) {
              setCurrentChat(null)
            } else if (chats.list.length) {
              setCurrentChat({ uuid: chats.list[0].uuid })
            } else {
              const chat = {
                uuid: uuid(),
              }
              upsertChat(chat.uuid, chat)
              setCurrentChat(chat)
            }
          }}
        >
          <LogoFace />
        </div>
      </div>
    </>
  )
}

export default Wrap
