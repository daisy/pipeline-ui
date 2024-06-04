import { TtsConfig, TtsVoice } from 'shared/types/ttsConfig'

// return the first part of the language code (e.g. 'en' for 'en-US')
// or return the whole thing if there is no dash
let getLang = (str) => {
    let trimmed = str.trim()
    let idxOfDash = trimmed.indexOf('-')
    return str.slice(0, idxOfDash == -1 ? undefined : idxOfDash)
}
function ttsConfigToXml(ttsConfig: TtsConfig): string {
    // we already know the voice is "preferred"
    // just find out if it's a default
    let isDefault = (voice: TtsVoice) =>
        ttsConfig.defaultVoices.find((v) => v.id == voice.id)
    let xmlString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
  <config>
    ${ttsConfig.preferredVoices
        .map((v) => {
            return `
            <voice engine="${v.engine}" name="${v.name}" lang="${
                v.lang
            }" gender="${v.gender}" priority="${isDefault(v) ? 2 : 1}"/>
            ${
                isDefault(v)
                    ? `<voice engine="${v.engine}" name="${
                          v.name
                      }" lang="${getLang(v.lang)}" 
                gender="${v.gender}" priority="2"/>`
                    : ''
            }`
        })
        .join('')}
  </config>`
    return xmlString
}

export { ttsConfigToXml }
