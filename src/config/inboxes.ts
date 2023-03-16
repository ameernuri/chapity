import { formatKey } from './lib'

const req = (strings: TemplateStringsArray) => `REQ_${formatKey(strings[0])}`
const res = (strings: TemplateStringsArray) => `RES_${formatKey(strings[0])}`
const inf = (strings: TemplateStringsArray) => `INF_${formatKey(strings[0])}`

export const inboxes = {
  req: {
    feedback: req`feedback`,
    openOptionsPage: req`open_options_page`,
    accessToken: req`access_token`,
    prompt: req`prompt`,
    stopPrompt: req`stop_prompt`,
    conversation: req`conversation`,
  },
  res: {
    feedback: res`feedback`,
    openOptionsPage: res`open_options_page`,
    prompt: res`prompt`,
    conversation: res`conversation`,
  },
  info: { chatgptCookieUpdated: inf`chatgpt_cookie_updated` },
}
