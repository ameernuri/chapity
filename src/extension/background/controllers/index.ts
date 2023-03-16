import { config, getConfig } from '@src/config'
import { Prompt } from '@src/interfaces'
import Browser from 'webextension-polyfill'
import { ChatCompletionEngine } from '../engines/chat'
import { getChatGPTAccessToken, UnofficialChatGPTEngine } from '../engines/chatgpt'
import { AIEngine } from '@src/interfaces'

const startEngine = async () => {
  const openaiApiKey = await getConfig(config.optionsKeys.apiKeys.openai)

  const engine: AIEngine = openaiApiKey
    ? new ChatCompletionEngine(openaiApiKey, config.models.gpt3_5_turbo.name)
    : new UnofficialChatGPTEngine(await getChatGPTAccessToken())

  return engine
}

export const getConversationController = async (port: Browser.Runtime.Port, id: string) => {
  const engine = await startEngine()

  engine.getConversation({
    id,
    onResult: (result) => {
      port.postMessage({
        inbox: config.inboxes.res.conversation,
        payload: result.payload,
      })
    },
  })
}

export const sendPromptController = async (
  port: Browser.Runtime.Port,
  to: string,
  prompt: Prompt,
) => {
  const engine = await startEngine()

  const { signal, abort } = new AbortController()

  port.onDisconnect.addListener(() => {
    abort()
    cleanup?.()
  })

  const { cleanup } = await engine.conversation({
    prompt,
    signal,
    onEvent(event) {
      if (event.type === 'done') {
        port.postMessage({
          inbox: config.inboxes.res.prompt,
          to,
          payload: { event: 'DONE' },
        })

        return
      }

      port.postMessage({
        inbox: config.inboxes.res.prompt,
        to,
        payload: event.payload,
      })
    },
  })
}
