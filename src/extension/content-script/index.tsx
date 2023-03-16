import { render } from 'preact'
import { config, getAllConfigs } from '@src/config'
import { detectSystemColorScheme } from '@src/lib/utils'
import './styles/common.scss'
import ContentScript from './App'
import { Theme } from '@src/interfaces'

const mountChapity = async () => {
  const wrap = document.createElement('div')
  wrap.className = 'chapity-wrap'

  const userConfig = await getAllConfigs()

  const theme: Theme =
    userConfig.theme === Theme.Auto ? detectSystemColorScheme() : userConfig.theme

  wrap.classList.add('dark-theme')

  if (theme === Theme.Light) {
    wrap.classList.add('light-theme')
  } else {
    wrap.classList.add('dark-theme')
  }

  document.body.appendChild(wrap)

  render(<ContentScript />, wrap)
}

const siteRegex = new RegExp(Object.keys(config.searchEngines).join('|'))
const siteName = (location.hostname.match(siteRegex) || [null])[0]
const siteConfig = siteName ? config.searchEngines[siteName] : null

mountChapity()

if (siteConfig?.watchRouteChange) {
  siteConfig.watchRouteChange(mountChapity)
}

// window.addEventListener('locationchange', run)
