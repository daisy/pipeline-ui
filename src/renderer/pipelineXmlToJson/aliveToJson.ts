import { Alive } from 'shared/types/pipeline'

function aliveXmlToJson(xmlString: string): Alive {
  let doc = new DOMParser().parseFromString(xmlString, 'text/xml')
  let aliveElm = doc.getElementsByTagName('alive')
  if (!aliveElm || aliveElm.length == 0) {
    return {
      alive: false,
    }
  }
  return {
    alive: true,
    localfs: aliveElm[0].getAttribute('localfs') == 'true',
    authentication: aliveElm[0].getAttribute('authentication') == 'true',
    version: aliveElm[0].getAttribute('version'),
  }
}

export { aliveXmlToJson }
