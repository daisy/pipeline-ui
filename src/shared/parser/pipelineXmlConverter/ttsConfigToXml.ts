import { TtsConfig } from 'shared/types/ttsConfig'

// TODO sort out priority
function ttsConfigToXml(ttsConfig: TtsConfig): string {
    let xmlString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
  <config>
    ${ttsConfig.preferredVoices
        .map(
            (v) =>
                `<voice engine="${v.engine}" name="${v.name}" lang="${v.lang}" gender="${v.gender}" priority="1"/>`
        )
        .join('')}
    ${ttsConfig.ttsEngineProperties
        .map((prop) => `<property key="${prop.key}" value="${prop.value}" />`)
        .join('')}
  </config>`
    return xmlString
}

export { ttsConfigToXml }
