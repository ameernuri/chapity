import { formatKey } from './lib'

const runtime = (strings: TemplateStringsArray) => `RUNTIME_${formatKey(strings[0])}`

export const constants = {
  accessToken: 'accessToken',
  noChatId: runtime`no_convo_id`,
}
