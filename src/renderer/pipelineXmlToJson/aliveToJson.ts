// <alive xmlns="http://www.daisy.org/ns/pipeline/data" localfs="true" authentication="false" version="1.0.0"/>

function aliveXmlToJson(xmlString: string) {
  let doc = new DOMParser().parseFromString(xmlString, 'text/xml')
  let aliveElm = doc.getElementsByTagName('alive')
  if (!aliveElm || aliveElm.length == 0) {
    return {
      alive: false,
    }
  }
  return {
    alive: true,
    localfs: aliveElm[0].getAttribute('localfs'),
    authentication: aliveElm[0].getAttribute('authentication'),
    version: aliveElm[0].getAttribute('version'),
  }
}

export { aliveXmlToJson }
