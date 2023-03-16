export interface SearchEngine {
  inputQuery: string[]
  appendContainerQuery: string[]
  watchRouteChange?: (callback: () => void) => void
}

export const searchEngines: Record<string, SearchEngine> = {
  google: {
    inputQuery: ["input[name='q']"],
    appendContainerQuery: ['#rcnt'],
  },
  bing: {
    inputQuery: ["[name='q']"],
    appendContainerQuery: [],
  },
  yahoo: {
    inputQuery: ["input[name='p']"],
    appendContainerQuery: ['#cols', '#contents__wrap'],
  },
  duckduckgo: {
    inputQuery: ["input[name='q']"],
    appendContainerQuery: ['#links_wrapper'],
  },
  baidu: {
    inputQuery: ["input[name='wd']"],
    appendContainerQuery: ['#container'],
    watchRouteChange(callback) {
      const targetNode = document.getElementById('wrapper_wrapper')!
      const observer = new MutationObserver(function (records) {
        for (const record of records) {
          if (record.type === 'childList') {
            for (const node of record.addedNodes) {
              if ('id' in node && node.id === 'container') {
                callback()
                return
              }
            }
          }
        }
      })
      observer.observe(targetNode, { childList: true })
    },
  },
  kagi: {
    inputQuery: ["input[name='q']"],
    appendContainerQuery: ['#_0_app_content'],
  },
  yandex: {
    inputQuery: ["input[name='text']"],
    appendContainerQuery: [],
  },
  naver: {
    inputQuery: ["input[name='query']"],
    appendContainerQuery: ['#content'],
  },
  brave: {
    inputQuery: ["input[name='q']"],
    appendContainerQuery: [],
  },
  searx: {
    inputQuery: ["input[name='q']"],
    appendContainerQuery: [],
  },
}
