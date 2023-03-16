import ExpiryMap from 'expiry-map'
import { v4 as uuidv4 } from 'uuid'
import { config } from '@src/config'
import { fetchEvents } from '@src/lib/fetch-events'
import {
  ConversationParams,
  AIEngine,
  RequestMethod,
  GetConversationParams,
  GetConversationsParams,
} from '@src/interfaces'

const cache = new ExpiryMap(10 * 1000)

export async function sendRequest(
  token: string,
  method: RequestMethod,
  path: string,
  data?: unknown,
) {
  return fetch(`${config.apis.openai.unofficial.backend}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  })
}

export async function sendMessageFeedback(token: string, data: unknown) {
  await sendRequest(token, 'POST', '/conversation/message_feedback', data)
}

export async function setConversationProperty(
  token: string,
  conversationId: string,
  propertyObject: object,
) {
  await sendRequest(token, 'PATCH', `/conversation/${conversationId}`, propertyObject)
}

export async function getChatGPTAccessToken(): Promise<string> {
  if (cache.get(config.constants.accessToken)) {
    return cache.get(config.constants.accessToken)
  }

  const res = await fetch(`${config.apis.openai.unofficial.api}/auth/session`)

  if (res.status === 403) {
    throw new Error('CLOUDFLARE')
  }

  const data = await res.json().catch(() => ({}))

  if (!data.accessToken) {
    throw new Error('UNAUTHORIZED')
  }

  cache.set(config.constants.accessToken, data.accessToken)

  return data.accessToken
}

export class UnofficialChatGPTEngine implements AIEngine {
  constructor(private token: string) {
    this.token = token
  }

  async fetchModels(): Promise<
    { slug: string; title: string; description: string; max_tokens: number }[]
  > {
    const resp = await sendRequest(this.token, 'GET', '/models').then((r) => r.json())
    return resp.models
  }

  async getModelName(): Promise<string> {
    try {
      const models = await this.fetchModels()
      return models[0].slug
    } catch (err) {
      console.error(err)
      return config.models.unofficial_chatgpt?.name
      // text-davinci-002-render-sha
    }
  }

  async getConversations({ onResult }: GetConversationsParams) {
    const Authorization = `Bearer ${this.token}`
    const headers = {
      'Content-Type': 'application/json',
      Authorization,
    }

    const endpoint = `${config.apis.openai.unofficial.backend}/conversations`

    const res = await fetch(endpoint, {
      method: 'GET',
      headers,
    })

    const data = await res.json()

    console.log({ data })

    const payload = {
      requestId: uuidv4(),
      data,
      endpoint,
    }

    onResult({
      payload,
    })
  }

  async generateTitle({ id, onEvent }: any) {
    let conversationId: string | undefined

    const cleanup = () => {
      if (conversationId) {
        // setConversationProperty(this.token, conversationId, { is_visible: false })
      }
    }

    const model = await this.getModelName()

    const body = {
      message_id: id,
      model,
    }

    await fetchEvents(`${config.apis.openai.unofficial.backend}/conversation/gen_title/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(body),
      onEvent(event: string) {
        if (event === config.models.unofficial_chatgpt.streamDoneSignal) {
          onEvent({
            type: 'done',
            payload: {
              // body,
            },
          })

          cleanup()

          return
        }

        let data

        try {
          data = JSON.parse(event)
        } catch (err) {
          console.error(err)

          return
        }

        const text = data.message?.content?.parts?.[0]

        if (text) {
          conversationId = data.conversation_id

          onEvent({
            type: 'answer',
            payload: {
              text,
              messageId: data.message.id,
              conversationId: data.conversation_id,
            },
          })
        }
      },
    })

    return { cleanup }
  }

  async getConversation({ id, onResult }: GetConversationParams) {
    const Authorization = `Bearer ${this.token}`
    const headers = {
      'Content-Type': 'application/json',
      Authorization,
    }

    const endpoint = `${config.apis.openai.unofficial.backend}/conversation/${id}`

    if (!id) return

    const res = await fetch(endpoint, {
      method: 'GET',
      headers,
    })

    const data = await res.json()

    console.log({ data })

    const payload = {
      requestId: uuidv4(),
      data,
      endpoint,
    }

    onResult({
      payload,
    })
  }

  async conversation({ signal, prompt, onEvent }: ConversationParams) {
    let conversationId: string | undefined

    const cleanup = () => {
      if (conversationId) {
        // setConversationProperty(this.token, conversationId, { is_visible: false })
      }
    }

    const modelName = await this.getModelName()

    console.debug('Using model:', modelName)

    const id = prompt.id || uuidv4()

    const body = {
      action: prompt.action || 'next',
      conversation_id: prompt.conversationId,
      messages: [
        {
          id,
          role: 'user',
          content: {
            content_type: 'text',
            parts: [prompt.text],
          },
        },
      ],
      model: modelName,
      parent_message_id: prompt.parentId || uuidv4(),
    }

    await fetchEvents(`${config.apis.openai.unofficial.backend}/conversation`, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(body),
      onEvent(event: string) {
        console.debug('event', event)

        if (event === config.models.unofficial_chatgpt.streamDoneSignal) {
          onEvent({
            type: 'done',
            payload: {
              body,
            },
          })

          cleanup()

          return
        }

        let data

        try {
          data = JSON.parse(event)
        } catch (err) {
          console.error(err)

          return
        }

        const text = data.message?.content?.parts?.[0]

        if (text) {
          conversationId = data.conversation_id

          console.log({ data })
          console.log({ prompt })

          if (data?.message?.author?.role === 'user') return

          onEvent({
            type: 'answer',
            payload: {
              text,
              messageId: data.message.id,
              conversationId: data.conversation_id,
              chatUuid: prompt.chatUuid,
              msgUuid: prompt.msgUuid,
              parentId: id,
              createdAt: new Date(data.message.create_time).toISOString(),
              data,
            },
          })
        }
      },
    })

    return { cleanup }
  }
}
