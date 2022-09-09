import { scriptElementToJson } from './scriptToJson'

function scriptsXmlToJson(xmlString: string) {
  let doc = new DOMParser().parseFromString(xmlString, 'text/xml')
  let scripts = Array.from(doc.getElementsByTagName('script')).map(
    (scriptElm) => {
      return scriptElementToJson(scriptElm)
    }
  )
  return scripts
}

export { scriptsXmlToJson }
