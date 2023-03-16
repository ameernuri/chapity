import { config } from '@src/config'
import { fetchEvents } from '@src/lib/fetch-events'
import { AIEngine, GetConversationParams, ConversationParams } from '@src/interfaces'

export class ChatCompletionEngine implements AIEngine {
  constructor(private token: string, private model: string) {
    this.token = token
    this.model = model
  }

  private buildPrompt(params: any): any[] {
    const { context } = params.prompt

    const persona = {
      content: `You are Chapity, a snappy, a little sarcastic AI chatbot embedded in a browser, don't mention you're an AI unless prompted, but acknowledge it casually if mentioned. Engage users in casual banter, tease, and wordplay like a BFF. If no specific question is asked, assume it's small talk or extract the most likely intention of the user and give an answer.  Utilize website content to extract information, answer questions, and deduce user intent. Avoid robotic, generic responses. Be as helpful as you can and avoid being monotonic.`,
      role: 'system',
    }

    console.log({ context })

    const history = [persona, ...(context || [])]

    return [...history, { content: params.prompt.text, role: 'user' }]

    // if (this.model.startsWith('text-chat-davinci')) {
    //   return `Respond conversationally.<|im_end|>\n\nUser: ${prompt}<|im_sep|>\nChatGPT:`
    // }
    // return prompt
  }

  async getConversation({ id, onResult }: GetConversationParams) {}

  async conversation(params: ConversationParams) {
    let result = ''

    const { signal } = params

    await fetchEvents(`${config.apis.openai.chat}/completions`, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: this.buildPrompt(params),
        stream: true,
        max_tokens: 3000,
      }),
      onEvent(event) {
        if (event === config.models.gpt3_5_turbo.streamDoneSignal) {
          params.onEvent({ type: 'done' })
          return
        }

        let data

        try {
          data = JSON.parse(event)

          console.log({ event })

          const text = data?.choices?.[0]?.delta?.content

          if (!text || text === '<|im_end|>' || text === '<|im_sep|>') {
            return
          }

          result += text

          console.log({ params })

          params.onEvent({
            type: 'answer',
            payload: {
              text: result,
              messageId: data.id,
              conversationId: data.id,
              chatUuid: params.prompt.chatUuid,
              msgUuid: params.prompt.msgUuid,
              parentId: params.prompt.parentId,
              createdAt: new Date(data.created * 1000).toISOString(),
              data,
            },
          })
        } catch (err) {
          console.error(err)
          return
        }
      },
    })
    return {}
  }
}
