import he from 'he'
import axios from 'axios'
import striptags from 'striptags'

export default class YTCaptions {
  static extractCaptions(htmlString: string) {
    const splittedHtml = htmlString.split('"captions":')
    if (splittedHtml.length > 1) {
      const videoDetails = splittedHtml[1].split(',"videoDetails')[0]
      const jsonObj = JSON.parse(videoDetails.replace('\n', ''))
      return jsonObj['playerCaptionsTracklistRenderer']
    }
    return null
  }

  static async getLanguagesList(videoID: string) {
    const videoURL = `https://www.youtube.com/watch?v=${videoID}`
    const { data } = await axios.get(videoURL)
    const decodedData = data.replace('\\u0026', '&').replace('\\', '')

    const captionJSON = this.extractCaptions(decodedData)

    // ensure we have access to captions data
    if (!captionJSON || !('captionTracks' in captionJSON)) {
      throw new Error(`Could not find captions for video: ${videoID}`)
    }

    return captionJSON.captionTracks.map((track: any) => {
      return {
        ...track,
        language: track.name.simpleText,
      }
    })
  }

  static async getCaptionString(caption: { baseUrl: string }) {
    if (!caption || !caption.baseUrl) {
      throw new Error(`Subtitle object received is not valid`)
    }

    const { data: transcript } = await axios.get(caption.baseUrl)

    const lines = transcript
      .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '')
      .replace('</transcript>', '')
      .split('</text>')
      .filter((line: any) => line && line.trim())
      .map((line: any) => {
        const startRegex = /start="([\d.]+)"/
        const durRegex = /dur="([\d.]+)"/

        const [, start] = startRegex.exec(line) || [, 0.0]
        const [, dur] = durRegex.exec(line) || [, 0.0]

        const htmlText = line
          .replace(/<text.+>/, '')
          .replace(/&amp;/gi, '&')
          .replace(/<\/?[^>]+(>|$)/g, '')

        const decodedText = he.decode(htmlText)
        const text = striptags(decodedText)

        return {
          start,
          dur,
          text,
        }
      })

    return lines
  }
}
