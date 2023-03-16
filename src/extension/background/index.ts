import Browser from 'webextension-polyfill'
import { config } from '@src/config'
import { getConversationController, sendPromptController } from './controllers'
import { getChatGPTAccessToken, sendMessageFeedback } from './engines/chatgpt'

Browser.runtime.onConnect.addListener((port) => {
  const { postMessage } = port
  port.onMessage.addListener(async (msg) => {
    const { inbox, payload, from: to } = msg

    switch (inbox) {
      case config.inboxes.req.prompt:
        try {
          await sendPromptController(port, to, payload)
        } catch (err: any) {
          console.error(err)
          postMessage({
            inbox: config.inboxes.res.prompt,
            to,
            payload: { error: err.message },
          })
        }
        break
      case config.inboxes.req.stopPrompt:
        break
      case config.inboxes.req.conversation:
        try {
          await getConversationController(port, payload.id)
        } catch (err: any) {
          console.error(err)
          postMessage({
            inbox: config.inboxes.res.conversation,
            payload: { error: err.message },
          })
        }
      case config.inboxes.res.conversation:
        break
      default:
        return
    }
  })
})

Browser.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === config.inboxes.req.feedback) {
    const token = await getChatGPTAccessToken()
    await sendMessageFeedback(token, msg.data)
  } else if (msg.type === config.inboxes.req.openOptionsPage) {
    Browser.runtime.openOptionsPage()
  } else if (msg.type === config.inboxes.req.accessToken) {
    return getChatGPTAccessToken()
  }
})

Browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    Browser.runtime.openOptionsPage()
  } else if (details.reason === 'update') {
    // Browser.runtime.openOptionsPage()
  }
})

Browser.runtime.onUpdateAvailable.addListener((details) => {
  // Browser.runtime.openOptionsPage()
})
