import { Answer } from './messaging'

export type Prompt = {
  text: string
  messageId?: string
  conversationId?: string
}

export type Event =
  | {
      type: 'answer'
      payload?: Answer
    }
  | {
      type: 'done' | 'error'
      payload?: any
    }

export type Result = {
  payload: any
}

export interface ConversationParams {
  prompt: {
    id?: string
    action?: 'next' | 'variant'
    context?: any[]
    text: string
    parentId?: string
    conversationId?: string
    chatUuid?: string
    msgUuid?: string
  }
  onEvent: (event: Event) => void
  signal?: AbortSignal
}

export interface GetConversationsParams {
  limit?: number
  offset?: number
  onResult: (result: Result) => void
}

export interface GetConversationParams {
  id: string
  onResult: (result: Result) => void
}

export interface AIEngine {
  conversation(params: ConversationParams): Promise<{ cleanup?: () => void }>
  getConversation(params: GetConversationParams): any
}

export type RequestMethod =
  | 'GET'
  | 'POST'
  | 'PATCH'
  | 'DELETE'
  | 'PUT'
  | 'HEAD'
  | 'OPTIONS'
  | 'TRACE'
  | 'CONNECT'
  | 'PURGE'
  | 'LINK'
  | 'UNLINK'
  | 'COPY'
  | 'LOCK'
  | 'UNLOCK'
  | 'PROPFIND'
  | 'VIEW'
  | 'SEARCH'
  | 'UNLOCK'

export interface InternalMessage {
  inbox: string
  payload: any
  from?: string
  to?: string
}

export enum Theme {
  Auto = 'auto',
  Light = 'light',
  Dark = 'dark',
}

export enum Language {
  Auto = 'auto',
  English = 'english',
}
export type CurrentChat = null | {
  id?: string
  uuid: string
}

export interface Message {
  id?: string
  uuid?: string
  role?: 'user' | 'assistant' | 'system'
  text?: string
  display?: string
  hidden?: boolean
  type?: 'search' | 'prompt' | 'answer' | 'system' | 'background'
  createdAt?: string
  updatedAt?: string
}

export interface Chat {
  uuid: string
  id?: string
  title?: string
  inputText?: string
  isResponding?: boolean
  messages?: Message[]
  createdAt?: string
  updatedAt?: string
}

export interface Chats {
  current: CurrentChat
  list: Chat[]
}

export interface ChatsContextType {
  chats: Chats
  setCurrentChat: (chat: CurrentChat) => void
  upsertChat: (uuid: string, updates: Partial<Chat>) => void
  upsertMessage: (chatUuid: string, uuid: string, updates: Partial<Message>) => void
}
