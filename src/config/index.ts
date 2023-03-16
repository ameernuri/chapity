import Browser from 'webextension-polyfill'
import { apis } from './apis'
import { app } from './app'
import { constants } from './constants'
import { inboxes } from './inboxes'
import { models } from './models'
import { optionsKeys } from './optionsKeys'
import { searchEngines } from './searchEngine'

export const config = {
  app,
  apis,
  constants,
  models,
  inboxes,
  optionsKeys,
  searchEngines,
}

export async function getAllConfigs() {
  const result = await Browser.storage.local.get()
  return result
}

export async function updateConfig(updates: any) {
  return Browser.storage.local.set(updates)
}

export async function getConfig(key: string) {
  const result = await Browser.storage.local.get(key)

  return result[key]
}

export async function saveConfig(key: string, value: string) {
  return Browser.storage.local.set({
    [key]: value,
  })
}
