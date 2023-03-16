const streamDoneSignal = '[DONE]'

const base = {
  streamDoneSignal,
}

export const models = {
  davinci: { ...base, name: 'davinci' },
  curie: { ...base, name: 'curie' },
  babbage: { ...base, name: 'babbage' },
  ada: { ...base, name: 'ada' },
  unofficial_chatgpt: { ...base, name: 'gpt-3.5-turbo' },
  gpt3_5_turbo: {
    ...base,
    name: 'gpt-3.5-turbo',
  },
  gpt4: {
    ...base,
    name: 'gpt-4',
  },
}
