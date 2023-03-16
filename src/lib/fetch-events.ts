import { createParser } from 'eventsource-parser'
import { isEmpty } from 'ramda'
import { streamAsyncIterable } from './stream-async-iterable.js'

export async function fetchEvents(
  resource: string,
  options: RequestInit & { onEvent: (message: string) => void },
) {
  const { onEvent: onMessage, ...fetchOptions } = options
  const res = await fetch(resource, fetchOptions)

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(!isEmpty(error) ? JSON.stringify(error) : `${res.status} ${res.statusText}`)
  }

  const parser = createParser((event) => {
    if (event.type === 'event') {
      onMessage(event.data)
    }
  })

  for await (const chunk of streamAsyncIterable(res.body!)) {
    const str = new TextDecoder().decode(chunk)
    parser.feed(str)
  }
}
