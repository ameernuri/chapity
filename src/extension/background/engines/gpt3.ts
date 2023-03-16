import { config } from '@src/config'
import { fetchEvents } from '@src/lib/fetch-events'
import { AIEngine, GetConversationParams, ConversationParams } from '@src/interfaces'

export class GPT3Engine implements AIEngine {
  constructor(private token: string, private model: string) {
    this.token = token
    this.model = model
  }

  private buildPrompt(prompt: string): string {
    if (this.model.startsWith('text-chat-davinci')) {
      return `Respond conversationally.<|im_end|>\n\nUser: ${prompt}<|im_sep|>\nChatGPT:`
    }
    return prompt
  }

  async getConversation({ id, onResult }: GetConversationParams) {}

  async conversation(params: ConversationParams) {
    let result = ''

    await fetchEvents(`${config.apis.openai.v1}/completions`, {
      method: 'POST',
      signal: params.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        model: this.model,
        prompt: this.buildPrompt(params.prompt.text),
        stream: true,
        max_tokens: 2048,
      }),
      onEvent(event) {
        console.debug('event', event)

        if (event === config.models.davinci.streamDoneSignal) {
          params.onEvent({ type: 'done' })
          return
        }
        let data
        try {
          data = JSON.parse(event)
          const text = data.choices[0].text
          if (text === '<|im_end|>' || text === '<|im_sep|>') {
            return
          }
          result += text
          params.onEvent({
            type: 'answer',
            payload: {
              text: result,
              messageId: data.id,
              conversationId: data.id,
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
